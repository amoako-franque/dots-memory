import axios, { AxiosInstance } from "axios"
import prisma from "../../config/db"
import logger from "../../utils/logger"
import { InternalServerError } from "../../utils/errors"

if (!process.env.PAYSTACK_SECRET_KEY) {
	throw new Error("PAYSTACK_SECRET_KEY is not set in environment variables")
}

const paystackApi: AxiosInstance = axios.create({
	baseURL: "https://api.paystack.co",
	headers: {
		Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
		"Content-Type": "application/json",
	},
})

export interface PaystackCustomer {
	id: number
	customer_code: string
	email: string
	first_name: string | null
	last_name: string | null
}

export interface PaystackPlan {
	id: number
	name: string
	plan_code: string
	amount: number
	interval: string
	currency: string
}

export interface PaystackSubscription {
	id: number
	customer: number | { customer_code: string } | string
	plan: number | { plan_code: string } | string
	authorization: number | null
	email_token: string
	amount: number
	status: string
	subscription_code: string
	cron_expression: string
	next_payment_date: string
	open_invoice: string | null
}

export class PaystackService {
	/**
	 * Create or retrieve a Paystack customer
	 */
	async getOrCreateCustomer(
		userId: string,
		email: string,
		firstName?: string,
		lastName?: string
	): Promise<string> {
		try {
			const subscription = await prisma.subscription.findFirst({
				where: {
					userId,
					paystackCustomerCode: { not: null },
				},
				select: { paystackCustomerCode: true },
			})

			if (subscription?.paystackCustomerCode) {
				return subscription.paystackCustomerCode
			}

			const existingCustomers = await paystackApi.get("/customer", {
				params: { email },
			})

			if (
				existingCustomers.data.status &&
				existingCustomers.data.data.length > 0
			) {
				const customer = existingCustomers.data.data[0] as PaystackCustomer
				return customer.customer_code
			}

			const response = await paystackApi.post("/customer", {
				email,
				first_name: firstName || "",
				last_name: lastName || "",
				metadata: {
					userId,
				},
			})

			if (!response.data.status) {
				throw new Error(response.data.message || "Failed to create customer")
			}

			const customer = response.data.data as PaystackCustomer

			logger.info("Paystack customer created", {
				userId,
				customerCode: customer.customer_code,
			})

			return customer.customer_code
		} catch (error: any) {
			logger.error("Error creating Paystack customer", { error, userId })
			throw new InternalServerError(
				error.response?.data?.message || "Failed to create Paystack customer",
				"PAYSTACK_CUSTOMER_ERROR"
			)
		}
	}

	/**
	 * Create a subscription plan in Paystack
	 */
	async createPlan(
		name: string,
		amount: number,
		interval: string = "monthly",
		currency: string = "NGN"
	): Promise<string> {
		try {
			const response = await paystackApi.post("/plan", {
				name,
				amount: Math.round(amount * 100), // Convert to kobo
				interval,
				currency,
			})

			if (!response.data.status) {
				throw new Error(response.data.message || "Failed to create plan")
			}

			const plan = response.data.data as PaystackPlan

			logger.info("Paystack plan created", { planCode: plan.plan_code })

			return plan.plan_code
		} catch (error: any) {
			logger.error("Error creating Paystack plan", { error })
			throw new InternalServerError(
				error.response?.data?.message || "Failed to create plan",
				"PAYSTACK_PLAN_ERROR"
			)
		}
	}

	/**
	 * Create a subscription
	 */
	async createSubscription(
		customerCode: string,
		planCode: string,
		authorizationCode?: string
	): Promise<PaystackSubscription> {
		try {
			const payload: any = {
				customer: customerCode,
				plan: planCode,
			}

			if (authorizationCode) {
				payload.authorization = authorizationCode
			}

			const response = await paystackApi.post("/subscription", payload)

			if (!response.data.status) {
				throw new Error(
					response.data.message || "Failed to create subscription"
				)
			}

			const subscription = response.data.data as PaystackSubscription

			logger.info("Paystack subscription created", {
				subscriptionCode: subscription.subscription_code,
			})

			return subscription
		} catch (error: any) {
			logger.error("Error creating Paystack subscription", { error })
			throw new InternalServerError(
				error.response?.data?.message || "Failed to create subscription",
				"PAYSTACK_SUBSCRIPTION_ERROR"
			)
		}
	}

	/**
	 * Initialize transaction for subscription (returns payment URL)
	 */
	async initializeTransaction(
		email: string,
		amount: number,
		planCode: string,
		callbackUrl: string,
		metadata?: Record<string, any>
	): Promise<{
		authorizationUrl: string
		accessCode: string
		reference: string
	}> {
		try {
			const response = await paystackApi.post("/transaction/initialize", {
				email,
				amount: Math.round(amount * 100), // Convert to kobo
				plan: planCode,
				callback_url: callbackUrl,
				metadata,
			})

			if (!response.data.status) {
				throw new Error(
					response.data.message || "Failed to initialize transaction"
				)
			}

			const data = response.data.data

			logger.info("Paystack transaction initialized", {
				reference: data.reference,
			})

			return {
				authorizationUrl: data.authorization_url,
				accessCode: data.access_code,
				reference: data.reference,
			}
		} catch (error: any) {
			logger.error("Error initializing Paystack transaction", { error })
			throw new InternalServerError(
				error.response?.data?.message || "Failed to initialize transaction",
				"PAYSTACK_TRANSACTION_ERROR"
			)
		}
	}

	/**
	 * Switch subscription to a new plan
	 */
	async switchSubscription(
		subscriptionCode: string,
		newPlanCode: string
	): Promise<PaystackSubscription> {
		try {
			/* TODO: Paystack doesn't have a direct switch API, so we need to: */
			await this.disableSubscription(subscriptionCode)

			const currentSub = await this.getSubscription(subscriptionCode)

			let customerCode: string
			if (
				typeof currentSub.customer === "object" &&
				currentSub.customer !== null
			) {
				customerCode =
					(currentSub.customer as any).customer_code ||
					String(currentSub.customer)
			} else {
				/* TODO: If customer is a number, we need to get the customer code from the database */
				const existingSubscription = await prisma.subscription.findFirst({
					where: { paystackSubscriptionCode: subscriptionCode },
					select: { paystackCustomerCode: true },
				})

				if (!existingSubscription?.paystackCustomerCode) {
					throw new Error("Customer code not found for subscription")
				}

				customerCode = existingSubscription.paystackCustomerCode
			}

			const newSubscription = await this.createSubscription(
				customerCode,
				newPlanCode
			)

			logger.info("Paystack subscription switched", {
				oldSubscriptionCode: subscriptionCode,
				newSubscriptionCode: newSubscription.subscription_code,
			})

			return newSubscription
		} catch (error: any) {
			logger.error("Error switching Paystack subscription", {
				error,
				subscriptionCode,
			})
			throw new InternalServerError(
				error.response?.data?.message || "Failed to switch subscription",
				"PAYSTACK_SWITCH_ERROR"
			)
		}
	}

	/**
	 * Disable subscription (cancels at period end)
	 */
	async disableSubscription(subscriptionCode: string): Promise<void> {
		try {
			const response = await paystackApi.post(`/subscription/disable`, {
				code: subscriptionCode,
				token: "",
			})

			if (!response.data.status) {
				throw new Error(
					response.data.message || "Failed to disable subscription"
				)
			}

			logger.info("Paystack subscription disabled", { subscriptionCode })
		} catch (error: any) {
			logger.error("Error disabling Paystack subscription", {
				error,
				subscriptionCode,
			})
			throw new InternalServerError(
				error.response?.data?.message || "Failed to disable subscription",
				"PAYSTACK_DISABLE_ERROR"
			)
		}
	}

	/**
	 * Enable a disabled subscription
	 */
	async enableSubscription(
		subscriptionCode: string,
		authorizationCode: string
	): Promise<void> {
		try {
			const response = await paystackApi.post(`/subscription/enable`, {
				code: subscriptionCode,
				token: authorizationCode,
			})

			if (!response.data.status) {
				throw new Error(
					response.data.message || "Failed to enable subscription"
				)
			}

			logger.info("Paystack subscription enabled", { subscriptionCode })
		} catch (error: any) {
			logger.error("Error enabling Paystack subscription", {
				error,
				subscriptionCode,
			})
			throw new InternalServerError(
				error.response?.data?.message || "Failed to enable subscription",
				"PAYSTACK_ENABLE_ERROR"
			)
		}
	}

	/**
	 * Get subscription details
	 */
	async getSubscription(
		subscriptionCode: string
	): Promise<PaystackSubscription> {
		try {
			const response = await paystackApi.get(
				`/subscription/${subscriptionCode}`
			)

			if (!response.data.status) {
				throw new Error(response.data.message || "Failed to get subscription")
			}

			return response.data.data as PaystackSubscription
		} catch (error: any) {
			logger.error("Error getting Paystack subscription", {
				error,
				subscriptionCode,
			})
			throw new InternalServerError(
				error.response?.data?.message || "Failed to get subscription",
				"PAYSTACK_GET_ERROR"
			)
		}
	}

	/**
	 * Verify webhook signature
	 */
	verifyWebhookSignature(payload: any, signature: string): boolean {
		const crypto = require("crypto")
		const hash = crypto
			.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
			.update(JSON.stringify(payload))
			.digest("hex")

		return hash === signature
	}
}

export default new PaystackService()
