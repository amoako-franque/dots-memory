import prisma from "../config/db"
import crypto from "crypto"
import logger from "../utils/logger"
import { NotFoundError, BadRequestError } from "../utils/errors"
import emailService from "./email.service"

class PasswordResetService {
	async requestReset(email: string): Promise<{ token: string }> {
		const user = await prisma.user.findUnique({
			where: { email },
			select: { id: true, email: true, firstName: true, lastName: true },
		})

		if (!user) {
			logger.warn("Password reset requested for non-existent email", { email })
			// Don't reveal if email exists - return success anyway
			return { token: "dummy-token" }
		}

		const token = crypto.randomBytes(32).toString("hex")
		const expiresAt = new Date(Date.now() + 3600000) // 1 hour

		await prisma.passwordReset.updateMany({
			where: {
				userId: user.id,
				usedAt: null,
			},
			data: {
				usedAt: new Date(),
			},
		})

		await prisma.passwordReset.create({
			data: {
				userId: user.id,
				token,
				expiresAt,
			},
		})

		logger.info("Password reset token created", { userId: user.id })

		// Send password reset email
		try {
			const userName = user.firstName || user.email.split("@")[0]
			await emailService.sendPasswordResetEmail(user.email, token, userName)
			logger.info("Password reset email sent", {
				userId: user.id,
				email: user.email,
			})
		} catch (error) {
			logger.error("Failed to send password reset email", {
				error: error instanceof Error ? error.message : "Unknown error",
				userId: user.id,
				email: user.email,
			})
			// Don't throw - token is still created, user can request again if needed
		}

		return { token }
	}

	async validateToken(token: string): Promise<boolean> {
		const resetRecord = await prisma.passwordReset.findUnique({
			where: { token },
		})

		if (!resetRecord) {
			return false
		}

		if (resetRecord.usedAt) {
			return false
		}

		if (resetRecord.expiresAt < new Date()) {
			return false
		}

		return true
	}

	async resetPassword(token: string, newPassword: string): Promise<void> {
		const resetRecord = await prisma.passwordReset.findUnique({
			where: { token },
			include: { user: true },
		})

		if (!resetRecord) {
			throw new NotFoundError("Reset token")
		}

		if (resetRecord.usedAt) {
			throw new BadRequestError(
				"Password reset token has already been used",
				"TOKEN_ALREADY_USED"
			)
		}

		if (resetRecord.expiresAt < new Date()) {
			throw new BadRequestError(
				"Password reset token has expired",
				"TOKEN_EXPIRED"
			)
		}

		const { hashPassword } = require("../utils/password")
		const passwordHash = await hashPassword(newPassword)

		await prisma.user.update({
			where: { id: resetRecord.userId },
			data: { passwordHash },
		})

		await prisma.passwordReset.update({
			where: { id: resetRecord.id },
			data: { usedAt: new Date() },
		})

		await prisma.refreshToken.deleteMany({
			where: { userId: resetRecord.userId },
		})

		logger.info("Password reset successful", { userId: resetRecord.userId })
	}
}

export default new PasswordResetService()
