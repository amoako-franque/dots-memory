import { Request, Response, NextFunction } from "express"
import stripeService from "../services/payment/stripe.service"
import paystackService from "../services/payment/paystack.service"
import prisma from "../config/db"
import logger from "../utils/logger"
import Stripe from "stripe"

class WebhookController {
	/**
	 * Handle Stripe webhooks
	 */
	async handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
		const sig = req.headers["stripe-signature"] as string

		if (!sig) {
			return res.status(400).json({ error: "Missing stripe-signature header" })
		}

		try {
			const event = stripeService.constructWebhookEvent(
				req.body,
				sig
			) as Stripe.Event

			logger.info("Stripe webhook received", { type: event.type, id: event.id })

			switch (event.type) {
				case "checkout.session.completed": {
					const session = event.data.object as Stripe.Checkout.Session
					await this.handleCheckoutCompleted(session)
					break
				}

				case "customer.subscription.created":
				case "customer.subscription.updated": {
					const subscription = event.data.object as Stripe.Subscription
					await this.handleSubscriptionUpdated(subscription)
					break
				}

				case "customer.subscription.deleted": {
					const subscription = event.data.object as Stripe.Subscription
					await this.handleSubscriptionDeleted(subscription)
					break
				}

				case "invoice.payment_succeeded": {
					const invoice = event.data.object as Stripe.Invoice
					await this.handlePaymentSucceeded(invoice)
					break
				}

				case "invoice.payment_failed": {
					const invoice = event.data.object as Stripe.Invoice
					await this.handlePaymentFailed(invoice)
					break
				}

				default:
					logger.info("Unhandled Stripe webhook event", { type: event.type })
			}

			res.json({ received: true })
		} catch (error) {
			logger.error("Error handling Stripe webhook", { error })
			next(error)
		}
	}

	/**
	 * Handle Paystack webhooks
	 */
	async handlePaystackWebhook(req: Request, res: Response, next: NextFunction) {
		const signature = req.headers["x-paystack-signature"] as string

		if (!signature) {
			return res
				.status(400)
				.json({ error: "Missing x-paystack-signature header" })
		}

		try {
			const isValid = paystackService.verifyWebhookSignature(
				req.body,
				signature
			)

			if (!isValid) {
				return res.status(400).json({ error: "Invalid webhook signature" })
			}

			const event = req.body

			logger.info("Paystack webhook received", {
				event: event.event,
				data: event.data,
			})

			switch (event.event) {
				case "subscription.create":
				case "subscription.enable":
				case "subscription.disable": {
					await this.handlePaystackSubscriptionEvent(event.data)
					break
				}

				case "charge.success": {
					await this.handlePaystackPaymentSuccess(event.data)
					break
				}

				case "charge.failed": {
					await this.handlePaystackPaymentFailed(event.data)
					break
				}

				default:
					logger.info("Unhandled Paystack webhook event", {
						event: event.event,
					})
			}

			res.json({ received: true })
		} catch (error) {
			logger.error("Error handling Paystack webhook", { error })
			next(error)
		}
	}

	/**
	 * Handle Stripe checkout session completed
	 */
	private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
		const userId = session.metadata?.userId

		if (!userId) {
			logger.error("No userId in checkout session metadata", {
				sessionId: session.id,
			})
			return
		}

		if (session.mode !== "subscription" || !session.subscription) {
			return
		}

		const stripeSubscription = await stripeService.getSubscription(
			session.subscription as string
		)

		await this.handleSubscriptionUpdated(stripeSubscription)
	}

	/**
	 * Handle Stripe subscription updated
	 */
	private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
		const userId = subscription.metadata?.userId

		if (!userId) {
			logger.error("No userId in subscription metadata", {
				subscriptionId: subscription.id,
			})
			return
		}

		const customerId = subscription.customer as string
		const priceId = subscription.items.data[0]?.price?.id

		if (!priceId) {
			logger.error("No price ID in subscription", {
				subscriptionId: subscription.id,
			})
			return
		}

		const plan = await prisma.subscriptionPlan.findFirst({
			where: { stripePriceId: priceId },
		})

		if (!plan) {
			logger.error("Plan not found for Stripe price", { priceId })
			return
		}

		const existingSubscription = await prisma.subscription.findFirst({
			where: {
				userId,
				stripeSubscriptionId: subscription.id,
			},
		})

		const subscriptionData = {
			userId,
			planId: plan.id,
			status: this.mapStripeStatus(subscription.status) as any,
			paymentProvider: "STRIPE" as const,
			stripeCustomerId: customerId,
			stripeSubscriptionId: subscription.id,
			stripePriceId: priceId,
			startDate: new Date((subscription as any).current_period_start * 1000),
			endDate: subscription.cancel_at
				? new Date(subscription.cancel_at * 1000)
				: (subscription as any).current_period_end
				? new Date((subscription as any).current_period_end * 1000)
				: null,
			nextBillingDate: (subscription as any).current_period_end
				? new Date((subscription as any).current_period_end * 1000)
				: null,
			cancelAtPeriodEnd: subscription.cancel_at_period_end,
			cancelledAt: subscription.canceled_at
				? new Date(subscription.canceled_at * 1000)
				: null,
		}

		if (existingSubscription) {
			await prisma.subscription.update({
				where: { id: existingSubscription.id },
				data: subscriptionData,
			})
		} else {
			await prisma.subscription.create({
				data: subscriptionData,
			})
		}

		logger.info("Stripe subscription updated in database", {
			userId,
			subscriptionId: subscription.id,
		})
	}

	/**
	 * Handle Stripe subscription deleted
	 */
	private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
		const userId = subscription.metadata?.userId

		if (!userId) {
			return
		}

		await prisma.subscription.updateMany({
			where: {
				userId,
				stripeSubscriptionId: subscription.id,
			},
			data: {
				status: "CANCELLED",
				cancelledAt: new Date(),
			},
		})

		logger.info("Stripe subscription cancelled in database", {
			userId,
			subscriptionId: subscription.id,
		})
	}

	/**
	 * Handle Stripe payment succeeded
	 */
	private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
		const subscriptionId =
			typeof (invoice as any).subscription === "string"
				? (invoice as any).subscription
				: (invoice as any).subscription?.id

		if (!subscriptionId) {
			return
		}

		const subscription = await stripeService.getSubscription(subscriptionId)
		await this.handleSubscriptionUpdated(subscription)
	}

	/**
	 * Handle Stripe payment failed
	 */
	private async handlePaymentFailed(invoice: Stripe.Invoice) {
		const subscriptionId =
			typeof (invoice as any).subscription === "string"
				? (invoice as any).subscription
				: (invoice as any).subscription?.id

		if (!subscriptionId) {
			return
		}

		await prisma.subscription.updateMany({
			where: {
				stripeSubscriptionId: subscriptionId,
			},
			data: {
				status: "PAST_DUE" as any,
			},
		})

		logger.info("Stripe payment failed", {
			subscriptionId,
			invoiceId: invoice.id,
		})
	}

	/**
	 * Handle Paystack subscription event
	 */
	private async handlePaystackSubscriptionEvent(data: any) {
		const subscriptionCode = data.subscription_code || data.code
		const customerCode = data.customer?.customer_code || data.customer_code
		const planCode = data.plan?.plan_code || data.plan_code

		if (!subscriptionCode || !customerCode || !planCode) {
			logger.error("Missing required fields in Paystack subscription event", {
				data,
			})
			return
		}

		const subscription = await prisma.subscription.findFirst({
			where: { paystackCustomerCode: customerCode },
			include: { user: true },
		})

		if (!subscription) {
			logger.error("Subscription not found for Paystack customer", {
				customerCode,
			})
			return
		}

		const plan = await prisma.subscriptionPlan.findFirst({
			where: { paystackPlanCode: planCode },
		})

		if (!plan) {
			logger.error("Plan not found for Paystack plan code", { planCode })
			return
		}

		const status = data.status === "active" ? "ACTIVE" : "CANCELLED"

		await prisma.subscription.update({
			where: { id: subscription.id },
			data: {
				status,
				paystackSubscriptionCode: subscriptionCode,
				nextBillingDate: data.next_payment_date
					? new Date(data.next_payment_date)
					: null,
			},
		})

		logger.info("Paystack subscription updated", {
			subscriptionCode,
			status,
		})
	}

	/**
	 * Handle Paystack payment success
	 */
	private async handlePaystackPaymentSuccess(data: any) {
		const customerCode = data.customer?.customer_code || data.customer_code
		const subscriptionCode =
			data.subscription?.subscription_code || data.subscription_code

		if (!customerCode) {
			return
		}

		const subscription = await prisma.subscription.findFirst({
			where: { paystackCustomerCode: customerCode },
		})

		if (subscription && subscriptionCode) {
			const paystackSubscription = await paystackService.getSubscription(
				subscriptionCode
			)

			await prisma.subscription.update({
				where: { id: subscription.id },
				data: {
					status: "ACTIVE",
					nextBillingDate: paystackSubscription.next_payment_date
						? new Date(paystackSubscription.next_payment_date)
						: null,
				},
			})
		}

		logger.info("Paystack payment succeeded", { customerCode })
	}

	/**
	 * Handle Paystack payment failed
	 */
	private async handlePaystackPaymentFailed(data: any) {
		const customerCode = data.customer?.customer_code || data.customer_code

		if (!customerCode) {
			return
		}

		await prisma.subscription.updateMany({
			where: { paystackCustomerCode: customerCode },
			data: {
				status: "PAST_DUE",
			},
		})

		logger.info("Paystack payment failed", { customerCode })
	}

	/**
	 * Map Stripe subscription status to our status enum
	 */
	private mapStripeStatus(status: Stripe.Subscription.Status): string {
		const statusMap: Record<string, string> = {
			active: "ACTIVE",
			canceled: "CANCELLED",
			past_due: "PAST_DUE",
			incomplete: "INCOMPLETE",
			incomplete_expired: "EXPIRED",
			trialing: "TRIAL",
			unpaid: "EXPIRED",
		}

		return statusMap[status] || "ACTIVE"
	}
}

export default new WebhookController()
