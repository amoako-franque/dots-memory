import prisma from "../config/db"
import { generateSecureToken } from "../utils/password"
import logger from "../utils/logger"

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export class AccessCodeSecurityService {
	/**
	 * Check if IP/device is locked out due to too many failed attempts
	 */
	async isLockedOut(
		albumId: string,
		identifier: string,
		ipAddress: string,
		deviceId?: string
	): Promise<{ locked: boolean; unlockAt?: Date }> {
		const lockoutWindow = new Date(Date.now() - LOCKOUT_DURATION_MS)

		const failedAttempts = await prisma.accessCodeAttempt.count({
			where: {
				albumId,
				identifier,
				ipAddress,
				success: false,
				attemptedAt: {
					gte: lockoutWindow,
				},
			},
		})

		if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
			const oldestAttempt = await prisma.accessCodeAttempt.findFirst({
				where: {
					albumId,
					identifier,
					ipAddress,
					success: false,
					attemptedAt: {
						gte: lockoutWindow,
					},
				},
				orderBy: {
					attemptedAt: "asc",
				},
			})

			const unlockAt = oldestAttempt
				? new Date(oldestAttempt.attemptedAt.getTime() + LOCKOUT_DURATION_MS)
				: new Date(Date.now() + LOCKOUT_DURATION_MS)

			return { locked: true, unlockAt }
		}

		return { locked: false }
	}

	/**
	 * Record an access code attempt (success or failure)
	 */
	async recordAttempt(
		albumId: string,
		identifier: string,
		ipAddress: string,
		success: boolean,
		deviceId?: string
	): Promise<void> {
		try {
			await prisma.accessCodeAttempt.create({
				data: {
					albumId,
					identifier,
					ipAddress,
					deviceId,
					success,
				},
			})

			const cleanupDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
			await prisma.accessCodeAttempt.deleteMany({
				where: {
					attemptedAt: {
						lt: cleanupDate,
					},
				},
			})
		} catch (error) {
			logger.error("Failed to record access code attempt", {
				albumId,
				error: error instanceof Error ? error.message : "Unknown error",
			})
		}
	}

	/**
	 * Create a session token after successful access code verification
	 */
	async createSession(
		albumId: string,
		identifier: string,
		ipAddress: string,
		deviceId?: string,
		userAgent?: string
	): Promise<string> {
		const sessionToken = generateSecureToken(32)
		const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

		await prisma.accessCodeSession.create({
			data: {
				albumId,
				identifier,
				sessionToken,
				deviceId,
				ipAddress,
				userAgent,
				expiresAt,
			},
		})

		await this.cleanupExpiredSessions()

		return sessionToken
	}

	/**
	 * Verify a session token
	 */
	async verifySession(
		albumId: string,
		identifier: string,
		sessionToken: string
	): Promise<{ valid: boolean; reason?: string }> {
		const session = await prisma.accessCodeSession.findFirst({
			where: {
				albumId,
				identifier,
				sessionToken,
				expiresAt: {
					gt: new Date(),
				},
			},
		})

		if (!session) {
			return { valid: false, reason: "Session not found or expired" }
		}

		if (session.isBlacklisted) {
			logger.warn("Blacklisted session attempt", {
				albumId,
				sessionId: session.id,
				sessionToken: sessionToken.substring(0, 8) + "...",
				ipAddress: session.ipAddress,
				deviceId: session.deviceId,
			})
			return { valid: false, reason: "Session has been blacklisted" }
		}

		if (session.revokedAt) {
			logger.warn("Revoked session attempt", {
				albumId,
				sessionId: session.id,
				sessionToken: sessionToken.substring(0, 8) + "...",
				ipAddress: session.ipAddress,
				deviceId: session.deviceId,
			})
			return { valid: false, reason: "Session has been revoked" }
		}

		await prisma.accessCodeSession.update({
			where: { id: session.id },
			data: { lastUsedAt: new Date() },
		})

		return { valid: true }
	}

	/**
	 * Revoke a session (logout)
	 */
	async revokeSession(sessionToken: string): Promise<void> {
		await prisma.accessCodeSession.updateMany({
			where: { sessionToken, revokedAt: null },
			data: { revokedAt: new Date() },
		})
	}

	/**
	 * Revoke all sessions for an album/identifier
	 */
	async revokeAllSessions(albumId: string, identifier: string): Promise<void> {
		await prisma.accessCodeSession.updateMany({
			where: {
				albumId,
				identifier,
				revokedAt: null,
			},
			data: { revokedAt: new Date() },
		})
	}

	/**
	 * List all sessions for an album
	 */
	async listSessions(albumId: string): Promise<any[]> {
		const sessions = await prisma.accessCodeSession.findMany({
			where: { albumId },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				identifier: true,
				sessionToken: true,
				deviceId: true,
				ipAddress: true,
				userAgent: true,
				expiresAt: true,
				isBlacklisted: true,
				blacklistedAt: true,
				revokedAt: true,
				createdAt: true,
				lastUsedAt: true,
			},
		})

		return sessions.map((session) => ({
			...session,
			sessionToken: session.sessionToken.substring(0, 8) + "...",
			isActive:
				!session.isBlacklisted &&
				!session.revokedAt &&
				session.expiresAt > new Date(),
		}))
	}

	/**
	 * Blacklist a session (prevents uploads and access)
	 */
	async blacklistSession(sessionId: string, albumId: string): Promise<void> {
		const session = await prisma.accessCodeSession.findFirst({
			where: { id: sessionId, albumId },
		})

		if (!session) {
			throw new Error("Session not found")
		}

		await prisma.accessCodeSession.update({
			where: { id: sessionId },
			data: {
				isBlacklisted: true,
				blacklistedAt: new Date(),
			},
		})

		logger.info("Session blacklisted", {
			albumId,
			sessionId,
			ipAddress: session.ipAddress,
			deviceId: session.deviceId,
			identifier: session.identifier,
		})
	}

	/**
	 * Unblacklist a session
	 */
	async unblacklistSession(sessionId: string, albumId: string): Promise<void> {
		const session = await prisma.accessCodeSession.findFirst({
			where: { id: sessionId, albumId },
		})

		if (!session) {
			throw new Error("Session not found")
		}

		await prisma.accessCodeSession.update({
			where: { id: sessionId },
			data: {
				isBlacklisted: false,
				blacklistedAt: null,
			},
		})

		logger.info("Session unblacklisted", {
			albumId,
			sessionId,
			ipAddress: session.ipAddress,
			deviceId: session.deviceId,
		})
	}

	/**
	 * Check if session is blacklisted or revoked
	 */
	async isSessionBlocked(sessionToken: string): Promise<boolean> {
		const session = await prisma.accessCodeSession.findFirst({
			where: { sessionToken },
			select: {
				isBlacklisted: true,
				revokedAt: true,
				expiresAt: true,
			},
		})

		if (!session) {
			return true
		}

		if (session.expiresAt <= new Date()) {
			return true
		}

		return session.isBlacklisted || !!session.revokedAt
	}

	/**
	 * Clean up expired sessions
	 */
	async cleanupExpiredSessions(): Promise<void> {
		try {
			await prisma.accessCodeSession.deleteMany({
				where: {
					expiresAt: {
						lt: new Date(),
					},
				},
			})
		} catch (error) {
			logger.error("Failed to cleanup expired sessions", {
				error: error instanceof Error ? error.message : "Unknown error",
			})
		}
	}

	/**
	 * Get remaining attempts before lockout
	 */
	async getRemainingAttempts(
		albumId: string,
		identifier: string,
		ipAddress: string
	): Promise<number> {
		const lockoutWindow = new Date(Date.now() - LOCKOUT_DURATION_MS)

		const failedAttempts = await prisma.accessCodeAttempt.count({
			where: {
				albumId,
				identifier,
				ipAddress,
				success: false,
				attemptedAt: {
					gte: lockoutWindow,
				},
			},
		})

		return Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts)
	}
}

export default new AccessCodeSecurityService()
