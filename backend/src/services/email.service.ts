import nodemailer from "nodemailer"
import hbs from "nodemailer-express-handlebars"
import path from "path"
import logger from "../utils/logger"

interface EmailOptions {
	to: string
	subject: string
	template: string
	context: Record<string, any>
}

class EmailService {
	private transporter: nodemailer.Transporter | null = null

	constructor() {
		this.initializeTransporter()
	}

	private initializeTransporter() {
		const emailUser = process.env.EMAIL_USER
		const emailPassword = process.env.EMAIL_PASSWORD
		const emailFrom = process.env.EMAIL_FROM || emailUser

		if (!emailUser || !emailPassword) {
			logger.warn(
				"Email credentials not configured. Email sending will be disabled."
			)
			return
		}

		this.transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: emailUser,
				pass: emailPassword,
			},
		})

		// Configure handlebars templates
		// Use __dirname to get the correct path in both dev and production
		const templatesPath =
			process.env.NODE_ENV === "production"
				? path.join(__dirname, "../../templates/email")
				: path.join(__dirname, "../templates/email")

		const handlebarOptions = {
			viewEngine: {
				extName: ".hbs",
				partialsDir: path.join(templatesPath, "partials"),
				layoutsDir: path.join(templatesPath, "layouts"),
				defaultLayout: "main",
			},
			viewPath: templatesPath,
			extName: ".hbs",
		}

		this.transporter.use("compile", hbs(handlebarOptions))

		// Verify connection
		this.transporter.verify((error) => {
			if (error) {
				logger.error("Email transporter verification failed", { error })
			} else {
				logger.info("Email service initialized successfully")
			}
		})
	}

	async sendEmail(options: EmailOptions): Promise<void> {
		if (!this.transporter) {
			logger.warn("Email service not configured. Email not sent.", {
				to: options.to,
				template: options.template,
			})
			return
		}

		try {
			const emailFrom =
				process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@memory.com"
			const emailFromName = process.env.EMAIL_FROM_NAME || "Memory"

			await this.transporter.sendMail({
				from: `"${emailFromName}" <${emailFrom}>`,
				to: options.to,
				subject: options.subject,
				template: options.template,
				context: options.context,
			})

			logger.info("Email sent successfully", {
				to: options.to,
				template: options.template,
			})
		} catch (error) {
			logger.error("Failed to send email", {
				error: error instanceof Error ? error.message : "Unknown error",
				to: options.to,
				template: options.template,
			})
			throw error
		}
	}

	async sendPasswordResetEmail(
		email: string,
		resetToken: string,
		userName?: string
	): Promise<void> {
		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
		const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`
		const currentYear = new Date().getFullYear()

		await this.sendEmail({
			to: email,
			subject: "Reset Your Password - Memory",
			template: "password-reset",
			context: {
				userName: userName || "there",
				resetUrl,
				expiresIn: "1 hour",
				supportEmail: process.env.SUPPORT_EMAIL || "support@memory.com",
				currentYear,
			},
		})
	}

	async sendWelcomeEmail(
		email: string,
		userName: string,
		trialEndDate: Date
	): Promise<void> {
		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
		const dashboardUrl = `${frontendUrl}/dashboard`
		const currentYear = new Date().getFullYear()
		const formattedTrialEndDate = trialEndDate.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		})

		await this.sendEmail({
			to: email,
			subject: "Welcome to Memory!",
			template: "welcome",
			context: {
				userName: userName || "there",
				dashboardUrl,
				trialEndDate: formattedTrialEndDate,
				supportEmail: process.env.SUPPORT_EMAIL || "support@memory.com",
				currentYear,
			},
		})
	}

	async sendSubscriptionConfirmationEmail(
		email: string,
		userName: string,
		planName: string,
		billingCycle: string,
		amount: string,
		storageLimit: string,
		photoLimit: string,
		videoLimit: string,
		albumLimit: string,
		nextBillingDate?: Date
	): Promise<void> {
		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
		const dashboardUrl = `${frontendUrl}/dashboard`
		const currentYear = new Date().getFullYear()
		const formattedNextBillingDate = nextBillingDate
			? nextBillingDate.toLocaleDateString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric",
				})
			: undefined

		await this.sendEmail({
			to: email,
			subject: "Subscription Confirmed - Memory",
			template: "subscription-confirmation",
			context: {
				userName: userName || "there",
				planName,
				billingCycle,
				amount,
				storageLimit,
				photoLimit,
				videoLimit,
				albumLimit,
				nextBillingDate: formattedNextBillingDate,
				dashboardUrl,
				supportEmail: process.env.SUPPORT_EMAIL || "support@memory.com",
				currentYear,
			},
		})
	}

	async sendTrialEndingEmail(
		email: string,
		userName: string,
		trialEndDate: Date
	): Promise<void> {
		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
		const subscriptionUrl = `${frontendUrl}/subscription`
		const currentYear = new Date().getFullYear()
		const formattedTrialEndDate = trialEndDate.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		})

		await this.sendEmail({
			to: email,
			subject: "Your Memory Trial is Ending Soon",
			template: "trial-ending",
			context: {
				userName: userName || "there",
				trialEndDate: formattedTrialEndDate,
				subscriptionUrl,
				supportEmail: process.env.SUPPORT_EMAIL || "support@memory.com",
				currentYear,
			},
		})
	}

	async sendPasswordResetSuccessEmail(
		email: string,
		userName?: string
	): Promise<void> {
		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
		const loginUrl = `${frontendUrl}/login`
		const currentYear = new Date().getFullYear()

		await this.sendEmail({
			to: email,
			subject: "Password Reset Successful - Memory",
			template: "password-reset-success",
			context: {
				userName: userName || "there",
				loginUrl,
				supportEmail: process.env.SUPPORT_EMAIL || "support@memory.com",
				currentYear,
			},
		})
	}
}

export default new EmailService()
