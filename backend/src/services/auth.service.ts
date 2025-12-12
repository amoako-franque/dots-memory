import prisma from "../config/db"
import { hashPassword, verifyPassword } from "../utils/password"
import { generateTokens, verifyRefreshToken } from "../utils/jwt"
import logger from "../utils/logger"
import {
	ConflictError,
	AuthenticationError,
	BadRequestError,
} from "../utils/errors"

interface RegisterInput {
	email: string
	password: string
	firstName?: string
	lastName?: string
}

interface LoginInput {
	email: string
	password: string
}

class AuthService {
	async register(data: RegisterInput) {
		const email = data.email.toLowerCase()

		const existingUser = await prisma.user.findUnique({
			where: { email },
		})

		if (existingUser) {
			throw new ConflictError(
				"Email is already in use",
				"EMAIL_IN_USE",
				"email"
			)
		}

		/* TODO: Check if email was previously deleted (to prevent trial abuse) - This feature requires a DeletedUserEmail model in Prisma schema */

		const passwordHash = await hashPassword(data.password)

		const trialStartedAt = new Date()
		const trialEndsAt = new Date()
		trialEndsAt.setDate(trialEndsAt.getDate() + 15)

		const user = await prisma.user.create({
			data: {
				email,
				passwordHash,
				firstName: data.firstName,
				lastName: data.lastName,
				trialStartedAt,
				trialEndsAt,
			},
		})

		const subscriptionService = require("./subscription.service").default
		await subscriptionService.createTrialSubscription(user.id)

		const tokens = generateTokens({
			userId: user.id,
			email: user.email,
			role: user.role,
		})

		await prisma.refreshToken.create({
			data: {
				token: tokens.refreshToken,
				userId: user.id,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			},
		})

		logger.info("User registered with trial", {
			userId: user.id,
			email: user.email,
			trialEndsAt,
		})

		return { user, tokens }
	}

	async login(data: LoginInput) {
		const startTime = Date.now()

		const user = await prisma.user.findUnique({
			where: { email: data.email.toLowerCase() },
		})

		const dummyHash =
			"$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS.sLm4CK"
		const passwordHash = user?.passwordHash || dummyHash

		const isValidPassword = await verifyPassword(data.password, passwordHash)

		if (!user || !isValidPassword) {
			const elapsed = Date.now() - startTime
			const minTime = 200 // 200ms minimum
			if (elapsed < minTime) {
				await new Promise((resolve) => setTimeout(resolve, minTime - elapsed))
			}

			logger.warn("Failed login attempt", {
				email: data.email,
				errorName: "AuthenticationError",
				errorMessage: "Invalid email or password",
				errorCode: "INVALID_CREDENTIALS",
			})
			throw new AuthenticationError(
				"Invalid email or password",
				"INVALID_CREDENTIALS"
			)
		}

		if (user.status !== "ACTIVE") {
			logger.warn("Login attempt for inactive user", { userId: user.id })
			throw new AuthenticationError("Account is not active", "ACCOUNT_INACTIVE")
		}

		const tokens = generateTokens({
			userId: user.id,
			email: user.email,
			role: user.role,
		})

		await prisma.refreshToken.deleteMany({
			where: { userId: user.id },
		})

		await prisma.refreshToken.create({
			data: {
				token: tokens.refreshToken,
				userId: user.id,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			},
		})

		await prisma.user.update({
			where: { id: user.id },
			data: { lastLoginAt: new Date() },
		})

		logger.info("User logged in", { userId: user.id })

		return { user, tokens }
	}

	async refresh(refreshToken: string) {
		try {
			const decoded = verifyRefreshToken(refreshToken)

			const storedToken = await prisma.refreshToken.findFirst({
				where: {
					token: refreshToken,
					userId: decoded.userId,
					expiresAt: {
						gt: new Date(),
					},
				},
			})

			if (!storedToken) {
				throw new AuthenticationError(
					"Invalid refresh token",
					"INVALID_REFRESH_TOKEN"
				)
			}

			const user = await prisma.user.findUnique({
				where: { id: decoded.userId },
			})

			if (!user || user.status !== "ACTIVE") {
				throw new AuthenticationError(
					"Invalid refresh token or inactive account",
					"INVALID_REFRESH_TOKEN"
				)
			}

			const tokens = generateTokens({
				userId: user.id,
				email: user.email,
				role: user.role,
			})

			await prisma.refreshToken.deleteMany({
				where: { id: storedToken.id },
			})

			await prisma.refreshToken.create({
				data: {
					token: tokens.refreshToken,
					userId: user.id,
					expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
				},
			})

			logger.info("Token refreshed", { userId: user.id })

			return {
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
			}
		} catch (error) {
			if (error instanceof Error && error.name === "TokenExpiredError") {
				throw new AuthenticationError(
					"Refresh token has expired",
					"REFRESH_TOKEN_EXPIRED"
				)
			}
			throw new AuthenticationError(
				"Invalid refresh token",
				"INVALID_REFRESH_TOKEN"
			)
		}
	}

	async logout(refreshToken: string) {
		try {
			await prisma.refreshToken.deleteMany({
				where: { token: refreshToken },
			})
			logger.info("User logged out", {
				refreshToken: refreshToken.substring(0, 10) + "...",
			})
		} catch (error) {
			logger.warn("Error during logout", { error })
		}
	}
}

export default new AuthService()
