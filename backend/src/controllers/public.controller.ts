import { Request, Response, NextFunction } from "express"
import prisma from "../config/db"
import {
	NotFoundError,
	ValidationError,
	AuthenticationError,
} from "../utils/errors"
import { verifyAccessCode } from "../utils/password"
import accessCodeSecurityService from "../services/access-code-security.service"
import albumService from "../services/album.service"
import logger from "../utils/logger"

const MAX_FAILED_ATTEMPTS = 5

class PublicController {
	/**
	 * Get album by identifier (shortUrl) - public endpoint
	 * Returns album metadata, but requires access code for private albums
	 */
	async getAlbum(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params // This is the shortUrl
			const sessionToken = req.headers["x-session-token"] as string | undefined
			const deviceId = req.headers["x-device-id"] as string | undefined

			const album = await prisma.album.findUnique({
				where: { shortUrl: id },
				select: {
					id: true,
					name: true,
					description: true,
					privacy: true,
					accessCodeHash: true,
					eventDate: true,
					eventLocation: true,
					expiresAt: true,
					allowVideos: true,
					requireContributorName: true,
					uploadDescription: true,
					maxFileSizeMB: true,
					maxVideoLengthSec: true,
					viewCount: true,
					downloadCount: true,
					uniqueContributors: true,
					createdAt: true,
					status: true,
				},
			})

			if (!album) {
				throw new NotFoundError("Album")
			}

			if (album.status !== "ACTIVE") {
				throw new NotFoundError("Album")
			}

			if (album.expiresAt && new Date() > album.expiresAt) {
				throw new ValidationError("This album has expired")
			}

			const isPrivate = album.privacy === "PRIVATE"

			const hasLegacyCode = !!album.accessCodeHash
			const hasNewCodes = await prisma.albumAccessCode.count({
				where: {
					albumId: album.id,
					isBlacklisted: false,
				},
			})

			const requiresAccessCode = isPrivate && (hasLegacyCode || hasNewCodes > 0)

			if (requiresAccessCode) {
				let hasAccess = false

				if (sessionToken) {
					const sessionResult = await accessCodeSecurityService.verifySession(
						album.id,
						id,
						sessionToken
					)
					if (sessionResult.valid) {
						hasAccess = true
					}
				}

				if (!hasAccess) {
					/* TODO: Return album metadata but indicate access code is required */
					const lockoutInfo = await accessCodeSecurityService.isLockedOut(
						album.id,
						id,
						req.ip || "unknown",
						deviceId
					)

					return res.json({
						success: true,
						data: {
							album: {
								id: album.id,
								name: album.name,
								description: album.description,
								privacy: album.privacy,
								eventDate: album.eventDate,
								eventLocation: album.eventLocation,
								expiresAt: album.expiresAt,
								createdAt: album.createdAt,
							},
							requiresAccessCode: true,
							remainingAttempts: lockoutInfo.locked ? 0 : MAX_FAILED_ATTEMPTS,
							locked: lockoutInfo.locked,
							unlockAt: lockoutInfo.unlockAt,
						},
					})
				}
			}

			res.json({
				success: true,
				data: {
					album: {
						...album,
						accessCodeHash: undefined, // Never expose the hash
					},
					requiresAccessCode: false,
				},
			})
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Verify access code for a private album
	 */
	async verifyAccess(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params // shortUrl
			const { accessCode } = req.body
			const deviceId = req.headers["x-device-id"] as string | undefined
			const ipAddress = req.ip || "unknown"
			const userAgent = req.get("user-agent")

			if (!accessCode || typeof accessCode !== "string") {
				throw new ValidationError("Access code is required")
			}

			const album = await prisma.album.findUnique({
				where: { shortUrl: id },
				select: {
					id: true,
					privacy: true,
					accessCodeHash: true,
					status: true,
				},
			})

			if (!album || album.status !== "ACTIVE") {
				throw new NotFoundError("Album")
			}

			if (album.privacy !== "PRIVATE") {
				throw new ValidationError("This album does not require an access code")
			}

			const hasLegacyCode = !!album.accessCodeHash
			const hasNewCodes = await prisma.albumAccessCode.count({
				where: {
					albumId: album.id,
					isBlacklisted: false,
				},
			})

			if (!hasLegacyCode && hasNewCodes === 0) {
				throw new ValidationError("This album does not require an access code")
			}

			const lockoutInfo = await accessCodeSecurityService.isLockedOut(
				album.id,
				id,
				ipAddress,
				deviceId
			)

			if (lockoutInfo.locked) {
				return res.status(429).json({
					success: false,
					error: {
						message: "Too many failed attempts. Please try again later.",
						code: "ACCESS_CODE_LOCKED",
						unlockAt: lockoutInfo.unlockAt,
					},
				})
			}

			let isValid = false

			if (album.accessCodeHash) {
				isValid = await verifyAccessCode(accessCode, album.accessCodeHash)
			}

			if (!isValid) {
				const accessCodes = await prisma.albumAccessCode.findMany({
					where: {
						albumId: album.id,
						isBlacklisted: false,
					},
				})

				for (const codeEntry of accessCodes) {
					const codeValid = await verifyAccessCode(
						accessCode,
						codeEntry.accessCodeHash
					)
					if (codeValid) {
						isValid = true
						break
					}
				}
			}

			await accessCodeSecurityService.recordAttempt(
				album.id,
				id,
				ipAddress,
				isValid,
				deviceId
			)

			if (!isValid) {
				const remainingAttempts = await this.calculateRemainingAttempts(
					album.id,
					id,
					ipAddress,
					deviceId
				)

				return res.status(401).json({
					success: false,
					error: {
						message: "Invalid access code",
						code: "INVALID_ACCESS_CODE",
						remainingAttempts,
					},
				})
			}

			const sessionToken = await accessCodeSecurityService.createSession(
				album.id,
				id,
				ipAddress,
				deviceId,
				userAgent
			)

			res.setHeader("X-Session-Token", sessionToken)

			res.json({
				success: true,
				data: {
					valid: true,
					sessionToken,
				},
			})
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get media URLs for a public album
	 */
	async getMediaUrls(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const sessionToken = req.headers["x-session-token"] as string | undefined
			const generatePresigned = req.query.presigned === "true"

			const album = await prisma.album.findUnique({
				where: { shortUrl: id },
				select: {
					id: true,
					privacy: true,
					accessCodeHash: true,
					status: true,
				},
			})

			if (!album || album.status !== "ACTIVE") {
				throw new NotFoundError("Album")
			}

			if (album.privacy === "PRIVATE" && album.accessCodeHash) {
				if (!sessionToken) {
					throw new AuthenticationError("Access code required")
				}

				const sessionResult = await accessCodeSecurityService.verifySession(
					album.id,
					id,
					sessionToken
				)

				if (!sessionResult.valid) {
					throw new AuthenticationError(
						sessionResult.reason || "Invalid or expired session"
					)
				}
			}

			const mediaUrlService = require("../services/media-url.service").default
			const urls = await mediaUrlService.getAlbumMediaUrls(
				album.id,
				undefined,
				generatePresigned
			)

			res.json({
				success: true,
				data: { mediaUrls: urls },
			})
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get media for a public album
	 */
	async getMedia(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params // shortUrl
			const sessionToken = req.headers["x-session-token"] as string | undefined

			const album = await prisma.album.findUnique({
				where: { shortUrl: id },
				select: {
					id: true,
					privacy: true,
					accessCodeHash: true,
					status: true,
				},
			})

			if (!album || album.status !== "ACTIVE") {
				throw new NotFoundError("Album")
			}

			if (album.privacy === "PRIVATE" && album.accessCodeHash) {
				if (!sessionToken) {
					throw new AuthenticationError("Access code required")
				}

				const sessionResult = await accessCodeSecurityService.verifySession(
					album.id,
					id,
					sessionToken
				)

				if (!sessionResult.valid) {
					throw new AuthenticationError(
						sessionResult.reason || "Invalid or expired session"
					)
				}
			}

			const media = await prisma.media.findMany({
				where: {
					albumId: album.id,
					status: "READY",
				},
				select: {
					id: true,
					type: true,
					fileName: true,
					cdnUrl: true,
					thumbnailUrl: true,
					width: true,
					height: true,
					aspectRatio: true,
					durationSeconds: true,
					uploadedAt: true,
					caption: true,
					viewCount: true,
					downloadCount: true,
				},
				orderBy: {
					uploadedAt: "desc",
				},
			})

			const mediaUrls = media
				.filter((m) => m.cdnUrl && m.cdnUrl.trim() !== "")
				.map((m) => ({
					id: m.id,
					type: m.type,
					url: m.cdnUrl!,
					thumbnailUrl: m.thumbnailUrl,
					fileName: m.fileName,
				}))

			res.json({
				success: true,
				data: {
					media,
					mediaUrls,
					pagination: {
						page: 1,
						limit: media.length,
						total: media.length,
						totalPages: 1,
					},
				},
			})
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Helper to calculate remaining attempts
	 */
	private async calculateRemainingAttempts(
		albumId: string,
		identifier: string,
		ipAddress: string,
		deviceId?: string
	): Promise<number> {
		const lockoutWindow = new Date(Date.now() - 15 * 60 * 1000) // 15 minutes

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

	/**
	 * Get all public albums (discoverable by anyone)
	 */
	async getPublicAlbums(req: Request, res: Response, next: NextFunction) {
		try {
			const albums = await albumService.getPublicAlbums()

			res.json({
				success: true,
				data: { albums },
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new PublicController()
