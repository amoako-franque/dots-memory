import Stripe from "stripe"
import prisma from "../../config/db"
import logger from "../../utils/logger"
import { InternalServerError } from "../../utils/errors"

if (!process.env.STRIPE_SECRET_KEY) {
	throw new Error("STRIPE_SECRET_KEY is not set in environment variables")
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
	apiVersion: "2025-11-17.clover",
})

export class StripeService {
	/**
	 * Create or retrieve a Stripe customer
	 */
	async getOrCreateCustomer(
		userId: string,
		email: string,
		name?: string
	): Promise<string> {
		try {
			const subscription = await prisma.subscription.findFirst({
				where: {
					userId,
					stripeCustomerId: { not: null },
				},
				select: { stripeCustomerId: true },
			})

			if (subscription?.stripeCustomerId) {
				return subscription.stripeCustomerId
			}

			const customer = await stripe.customers.create({
				email,
				name: name || email,
				metadata: {
					userId,
				},
			})

			logger.info("Stripe customer created", {
				userId,
				customerId: customer.id,
			})

			return customer.id
		} catch (error) {
			logger.error("Error creating Stripe customer", { error, userId })
			throw new InternalServerError(
				"Failed to create Stripe customer",
				"STRIPE_CUSTOMER_ERROR"
			)
		}
	}

	/**
	 * Create a checkout session for subscription
	 */
	async createCheckoutSession(
		customerId: string,
		priceId: string,
		userId: string,
		successUrl: string,
		cancelUrl: string
	): Promise<Stripe.Checkout.Session> {
		try {
			const session = await stripe.checkout.sessions.create({
				customer: customerId,
				payment_method_types: ["card"],
				mode: "subscription",
				line_items: [
					{
						price: priceId,
						quantity: 1,
					},
				],
				success_url: successUrl,
				cancel_url: cancelUrl,
				metadata: {
					userId,
				},
				subscription_data: {
					metadata: {
						userId,
					},
				},
			})

			logger.info("Stripe checkout session created", {
				userId,
				sessionId: session.id,
				customerId,
			})

			return session
		} catch (error) {
			logger.error("Error creating Stripe checkout session", { error, userId })
			throw new InternalServerError(
				"Failed to create checkout session",
				"STRIPE_CHECKOUT_ERROR"
			)
		}
	}

	/**
	 * Create a product and price in Stripe
	 */
	async createProductAndPrice(
		name: string,
		description: string,
		amount: number,
		currency: string = "usd"
	): Promise<{ productId: string; priceId: string }> {
		try {
			const product = await stripe.products.create({
				name,
				description,
			})

			const price = await stripe.prices.create({
				product: product.id,
				unit_amount: Math.round(amount * 100),
				currency,
				recurring: {
					interval: "month",
				},
			})

			logger.info("Stripe product and price created", {
				productId: product.id,
				priceId: price.id,
			})

			return { productId: product.id, priceId: price.id }
		} catch (error) {
			logger.error("Error creating Stripe product/price", { error })
			throw new InternalServerError(
				"Failed to create product/price",
				"STRIPE_PRODUCT_ERROR"
			)
		}
	}

	/**
	 * Update subscription to a new plan
	 */
	async switchSubscription(
		subscriptionId: string,
		newPriceId: string
	): Promise<Stripe.Subscription> {
		try {
			const subscription = await stripe.subscriptions.retrieve(subscriptionId)

			const updatedSubscription = await stripe.subscriptions.update(
				subscriptionId,
				{
					items: [
						{
							id: subscription.items.data[0].id,
							price: newPriceId,
						},
					],
					proration_behavior: "always_invoice",
				}
			)

			logger.info("Stripe subscription switched", {
				subscriptionId,
				newPriceId,
			})

			return updatedSubscription
		} catch (error) {
			logger.error("Error switching Stripe subscription", {
				error,
				subscriptionId,
			})
			throw new InternalServerError(
				"Failed to switch subscription",
				"STRIPE_SWITCH_ERROR"
			)
		}
	}

	/**
	 * Cancel subscription (at period end)
	 */
	async cancelSubscription(
		subscriptionId: string,
		cancelImmediately: boolean = false
	): Promise<Stripe.Subscription> {
		try {
			if (cancelImmediately) {
				const subscription = await stripe.subscriptions.cancel(subscriptionId)
				logger.info("Stripe subscription cancelled immediately", {
					subscriptionId,
				})
				return subscription
			} else {
				const subscription = await stripe.subscriptions.update(subscriptionId, {
					cancel_at_period_end: true,
				})
				logger.info("Stripe subscription scheduled for cancellation", {
					subscriptionId,
				})
				return subscription
			}
		} catch (error) {
			logger.error("Error cancelling Stripe subscription", {
				error,
				subscriptionId,
			})
			throw new InternalServerError(
				"Failed to cancel subscription",
				"STRIPE_CANCEL_ERROR"
			)
		}
	}

	/**
	 * Resume a cancelled subscription
	 */
	async resumeSubscription(
		subscriptionId: string
	): Promise<Stripe.Subscription> {
		try {
			const subscription = await stripe.subscriptions.update(subscriptionId, {
				cancel_at_period_end: false,
			})

			logger.info("Stripe subscription resumed", { subscriptionId })

			return subscription
		} catch (error) {
			logger.error("Error resuming Stripe subscription", {
				error,
				subscriptionId,
			})
			throw new InternalServerError(
				"Failed to resume subscription",
				"STRIPE_RESUME_ERROR"
			)
		}
	}

	/**
	 * Retrieve subscription from Stripe
	 */
	async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
		try {
			return await stripe.subscriptions.retrieve(subscriptionId)
		} catch (error) {
			logger.error("Error retrieving Stripe subscription", {
				error,
				subscriptionId,
			})
			throw new InternalServerError(
				"Failed to retrieve subscription",
				"STRIPE_RETRIEVE_ERROR"
			)
		}
	}

	/**
	 * Construct webhook event from request
	 */
	constructWebhookEvent(
		payload: string | Buffer,
		signature: string
	): Stripe.Event {
		const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
		if (!webhookSecret) {
			throw new Error("STRIPE_WEBHOOK_SECRET is not set")
		}

		try {
			return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
		} catch (error) {
			logger.error("Error constructing Stripe webhook event", { error })
			throw new InternalServerError(
				"Invalid webhook signature",
				"STRIPE_WEBHOOK_ERROR"
			)
		}
	}
}

export default new StripeService()
