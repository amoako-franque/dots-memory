import prisma from "../config/db"
import logger from "../utils/logger"
import {
	NotFoundError,
	InternalServerError,
	BadRequestError,
} from "../utils/errors"
import stripeService from "./payment/stripe.service"
import paystackService from "./payment/paystack.service"

type PaymentProvider = "STRIPE" | "PAYSTACK"

export class SubscriptionService {
	/**
	 * Get all available subscription plans
	 */
	async getAvailablePlans() {
		return await prisma.subscriptionPlan.findMany({
			where: { isActive: true },
			orderBy: { priceMonthly: "asc" },
		})
	}

	/**
	 * Get a specific plan by tier
	 */
	async getPlanByTier(tier: string) {
		return await prisma.subscriptionPlan.findUnique({
			where: { tier: tier as any },
		})
	}

	/**
	 * Get user's current active subscription
	 */
	async getUserSubscription(userId: string) {
		const subscription = await prisma.subscription.findFirst({
			where: {
				userId,
				status: { in: ["ACTIVE", "TRIAL"] },
			},
			include: {
				plan: true,
			},
			orderBy: { createdAt: "desc" },
		})

		return subscription
	}

	/**
	 * Check if user's trial is active
	 */
	async isTrialActive(userId: string): Promise<boolean> {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { trialEndsAt: true },
		})

		if (!user || !user.trialEndsAt) {
			return false
		}

		return new Date() < user.trialEndsAt
	}

	/**
	 * Check if user's trial has expired
	 */
	async isTrialExpired(userId: string): Promise<boolean> {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { trialEndsAt: true, trialStartedAt: true },
		})

		if (!user || !user.trialStartedAt || !user.trialEndsAt) {
			return false
		}

		return new Date() > user.trialEndsAt
	}

	/**
	 * Get subscription limits for a user
	 */
	async getSubscriptionLimits(userId: string) {
		const subscription = await this.getUserSubscription(userId)

		if (!subscription) {
			const freePlan = await this.getPlanByTier("FREE")
			return freePlan
		}

		return subscription.plan
	}

	/**
	 * Create initial subscription for new user (FREE tier with trial)
	 */
	async createTrialSubscription(userId: string) {
		const freePlan = await this.getPlanByTier("FREE")

		if (!freePlan) {
			throw new InternalServerError(
				"FREE plan not found. Please seed subscription plans.",
				"FREE_PLAN_NOT_FOUND"
			)
		}

		const trialStartedAt = new Date()
		const trialEndsAt = new Date()
		trialEndsAt.setDate(trialEndsAt.getDate() + 15)

		await prisma.user.update({
			where: { id: userId },
			data: {
				trialStartedAt,
				trialEndsAt,
			},
		})

		const subscription = await prisma.subscription.create({
			data: {
				userId,
				planId: freePlan.id,
				status: "TRIAL",
				startDate: trialStartedAt,
				endDate: trialEndsAt,
			},
			include: {
				plan: true,
			},
		})

		await prisma.usageStats.create({
			data: {
				userId,
				photoCount: 0,
				videoCount: 0,
				albumCount: 0,
				storageUsedBytes: 0,
			},
		})

		logger.info("Trial subscription created", {
			userId,
			subscriptionId: subscription.id,
		})

		return subscription
	}

	/**
	 * Create checkout session for subscription
	 */
	async createCheckoutSession(
		userId: string,
		planId: string,
		paymentProvider: PaymentProvider,
		successUrl: string,
		cancelUrl: string
	) {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { email: true, firstName: true, lastName: true },
		})

		if (!user) {
			throw new NotFoundError("User", "USER_NOT_FOUND", userId)
		}

		const plan = await prisma.subscriptionPlan.findUnique({
			where: { id: planId },
		})

		if (!plan) {
			throw new NotFoundError("Subscription plan", "PLAN_NOT_FOUND", planId)
		}

		if (plan.tier === "FREE") {
			throw new BadRequestError("Cannot subscribe to FREE plan", "INVALID_PLAN")
		}

		if (paymentProvider === "STRIPE") {
			const customerId = await stripeService.getOrCreateCustomer(
				userId,
				user.email,
				user.firstName && user.lastName
					? `${user.firstName} ${user.lastName}`
					: undefined
			)

			let priceId = plan.stripePriceId || null
			if (!priceId) {
				const { priceId: newPriceId } =
					await stripeService.createProductAndPrice(
						plan.name,
						plan.description || "",
						Number(plan.priceMonthly),
						"usd"
					)

				await prisma.subscriptionPlan.update({
					where: { id: plan.id },
					data: { stripePriceId: newPriceId },
				})

				priceId = newPriceId
			}

			const session = await stripeService.createCheckoutSession(
				customerId,
				priceId,
				userId,
				successUrl,
				cancelUrl
			)

			return {
				checkoutUrl: session.url,
				sessionId: session.id,
				provider: "STRIPE",
			}
		} else if (paymentProvider === "PAYSTACK") {
			const customerCode = await paystackService.getOrCreateCustomer(
				userId,
				user.email,
				user.firstName || undefined,
				user.lastName || undefined
			)

			let planCode = plan.paystackPlanCode || null
			if (!planCode) {
				planCode = await paystackService.createPlan(
					plan.name,
					Number(plan.priceMonthly),
					"monthly",
					"NGN"
				)

				await prisma.subscriptionPlan.update({
					where: { id: plan.id },
					data: { paystackPlanCode: planCode },
				})
			}

			const transaction = await paystackService.initializeTransaction(
				user.email,
				Number(plan.priceMonthly),
				planCode,
				successUrl,
				{
					userId,
					planId,
					planTier: plan.tier,
				}
			)

			return {
				checkoutUrl: transaction.authorizationUrl,
				reference: transaction.reference,
				accessCode: transaction.accessCode,
				provider: "PAYSTACK",
			}
		} else {
			throw new BadRequestError("Invalid payment provider", "INVALID_PROVIDER")
		}
	}

	/**
	 * Switch subscription to a new plan
	 */
	async switchSubscription(userId: string, newPlanId: string) {
		const currentSubscription = await this.getUserSubscription(userId)

		if (!currentSubscription) {
			throw new NotFoundError("Active subscription", "NO_ACTIVE_SUBSCRIPTION")
		}

		const newPlan = await prisma.subscriptionPlan.findUnique({
			where: { id: newPlanId },
		})

		if (!newPlan) {
			throw new NotFoundError("Subscription plan", "PLAN_NOT_FOUND", newPlanId)
		}

		if (currentSubscription.planId === newPlanId) {
			throw new BadRequestError("Already subscribed to this plan", "SAME_PLAN")
		}

		const paymentProvider = currentSubscription.paymentProvider

		if (!paymentProvider) {
			if (currentSubscription.status === "TRIAL") {
				const updatedSubscription = await prisma.subscription.update({
					where: { id: currentSubscription.id },
					data: {
						planId: newPlan.id,

						status: newPlan.tier === "FREE" ? "TRIAL" : "ACTIVE",
					},
					include: {
						plan: true,
					},
				})

				logger.info("Trial subscription upgraded", {
					userId,
					oldPlanId: currentSubscription.planId,
					newPlanId: newPlan.id,
				})

				return updatedSubscription
			} else {
				throw new BadRequestError(
					"Current subscription has no payment provider",
					"NO_PAYMENT_PROVIDER"
				)
			}
		}

		if (paymentProvider === "STRIPE") {
			if (!currentSubscription.stripeSubscriptionId) {
				throw new BadRequestError(
					"Stripe subscription ID not found",
					"NO_STRIPE_SUB"
				)
			}

			let priceId = newPlan.stripePriceId || null
			if (!priceId) {
				const { priceId: newPriceId } =
					await stripeService.createProductAndPrice(
						newPlan.name,
						newPlan.description || "",
						Number(newPlan.priceMonthly),
						"usd"
					)

				await prisma.subscriptionPlan.update({
					where: { id: newPlan.id },
					data: { stripePriceId: newPriceId },
				})

				priceId = newPriceId
			}

			const stripeSubscription = await stripeService.switchSubscription(
				currentSubscription.stripeSubscriptionId,
				priceId
			)

			const updatedSubscription = await prisma.subscription.update({
				where: { id: currentSubscription.id },
				data: {
					planId: newPlan.id,
					stripePriceId: priceId,
					nextBillingDate: (stripeSubscription as any).current_period_end
						? new Date((stripeSubscription as any).current_period_end * 1000)
						: null,
					cancelAtPeriodEnd: false,
				},
				include: {
					plan: true,
				},
			})

			logger.info("Subscription switched", {
				userId,
				oldPlanId: currentSubscription.planId,
				newPlanId: newPlan.id,
			})

			return updatedSubscription
		} else if (paymentProvider === "PAYSTACK") {
			if (!currentSubscription.paystackSubscriptionCode) {
				throw new BadRequestError(
					"Paystack subscription code not found",
					"NO_PAYSTACK_SUB"
				)
			}

			let planCode = newPlan.paystackPlanCode || null
			if (!planCode) {
				planCode = await paystackService.createPlan(
					newPlan.name,
					Number(newPlan.priceMonthly),
					"monthly",
					"NGN"
				)

				await prisma.subscriptionPlan.update({
					where: { id: newPlan.id },
					data: { paystackPlanCode: planCode },
				})
			}

			const paystackSubscription = await paystackService.switchSubscription(
				currentSubscription.paystackSubscriptionCode,
				planCode
			)

			await prisma.subscription.update({
				where: { id: currentSubscription.id },
				data: {
					status: "CANCELLED",
					cancelledAt: new Date(),
				},
			})

			const newSubscription = await prisma.subscription.create({
				data: {
					userId,
					planId: newPlan.id,
					status: "ACTIVE",
					paymentProvider: "PAYSTACK",
					paystackCustomerCode: currentSubscription.paystackCustomerCode,
					paystackSubscriptionCode: paystackSubscription.subscription_code,
					paystackPlanCode: planCode,
					startDate: new Date(),
					nextBillingDate: paystackSubscription.next_payment_date
						? new Date(paystackSubscription.next_payment_date)
						: null,
				},
				include: {
					plan: true,
				},
			})

			logger.info("Subscription switched", {
				userId,
				oldPlanId: currentSubscription.planId,
				newPlanId: newPlan.id,
			})

			return newSubscription
		} else {
			throw new BadRequestError("Invalid payment provider", "INVALID_PROVIDER")
		}
	}

	/**
	 * Cancel user subscription (at period end)
	 */
	async cancelSubscription(userId: string, cancelImmediately: boolean = false) {
		const subscription = await this.getUserSubscription(userId)

		if (!subscription) {
			throw new NotFoundError("Active subscription", "NO_ACTIVE_SUBSCRIPTION")
		}

		const paymentProvider = subscription.paymentProvider

		if (!paymentProvider) {
			const updatedSubscription = await prisma.subscription.update({
				where: { id: subscription.id },
				data: {
					status: "CANCELLED",
					cancelledAt: new Date(),
					endDate: cancelImmediately ? new Date() : subscription.endDate,
				},
				include: {
					plan: true,
				},
			})

			return updatedSubscription
		}

		if (paymentProvider === "STRIPE") {
			if (!subscription.stripeSubscriptionId) {
				throw new BadRequestError(
					"Stripe subscription ID not found",
					"NO_STRIPE_SUB"
				)
			}

			const stripeSubscription = await stripeService.cancelSubscription(
				subscription.stripeSubscriptionId,
				cancelImmediately
			)

			const updatedSubscription = await prisma.subscription.update({
				where: { id: subscription.id },
				data: {
					status: cancelImmediately ? "CANCELLED" : subscription.status,
					cancelledAt: cancelImmediately
						? new Date()
						: subscription.cancelledAt,
					cancelAtPeriodEnd: !cancelImmediately,
					endDate: cancelImmediately
						? new Date()
						: (stripeSubscription as any).current_period_end
						? new Date((stripeSubscription as any).current_period_end * 1000)
						: subscription.endDate,
				},
				include: {
					plan: true,
				},
			})

			logger.info("Subscription cancelled", {
				userId,
				subscriptionId: subscription.id,
			})

			return updatedSubscription
		} else if (paymentProvider === "PAYSTACK") {
			if (!subscription.paystackSubscriptionCode) {
				throw new BadRequestError(
					"Paystack subscription code not found",
					"NO_PAYSTACK_SUB"
				)
			}

			if (!cancelImmediately) {
				await paystackService.disableSubscription(
					subscription.paystackSubscriptionCode
				)
			}

			const updatedSubscription = await prisma.subscription.update({
				where: { id: subscription.id },
				data: {
					status: cancelImmediately ? "CANCELLED" : subscription.status,
					cancelledAt: cancelImmediately
						? new Date()
						: subscription.cancelledAt,
					cancelAtPeriodEnd: !cancelImmediately,
				},
				include: {
					plan: true,
				},
			})

			logger.info("Subscription cancelled", {
				userId,
				subscriptionId: subscription.id,
			})

			return updatedSubscription
		} else {
			throw new BadRequestError("Invalid payment provider", "INVALID_PROVIDER")
		}
	}

	/**
	 * Check and expire trials (can be run as a cron job)
	 */
	async expireTrials() {
		const now = new Date()

		const expiredTrials = await prisma.subscription.findMany({
			where: {
				status: "TRIAL",
				endDate: {
					lt: now,
				},
			},
		})

		for (const trial of expiredTrials) {
			await prisma.subscription.update({
				where: { id: trial.id },
				data: { status: "EXPIRED" },
			})

			logger.info("Trial expired", {
				userId: trial.userId,
				subscriptionId: trial.id,
			})
		}

		return expiredTrials.length
	}
}

export default new SubscriptionService()
