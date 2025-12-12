import { Request, Response, NextFunction } from "express"
import albumService from "../services/album.service"
import analyticsService from "../services/analytics.service"
import { NotFoundError, ValidationError } from "../utils/errors"
import {
	createAlbumSchema,
	updateAlbumSchema,
} from "../validators/album.validator"
import logger from "../utils/logger"
import prisma from "../config/db"
import accessCodeSecurityService from "../services/access-code-security.service"

class AlbumController {
	async create(req: Request, res: Response, next: NextFunction) {
		try {
			const validated = createAlbumSchema.parse(req.body)
			const result = await albumService.createAlbum(req.user!.userId, validated)

			res.status(201).json({
				success: true,
				data: result,
			})
		} catch (error) {
			next(error)
		}
	}

	async list(req: Request, res: Response, next: NextFunction) {
		try {
			const albums = await albumService.getAlbums(req.user!.userId)

			res.json({
				success: true,
				data: { albums },
			})
		} catch (error) {
			next(error)
		}
	}

	async get(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const album = await albumService.getAlbum(req.user!.userId, id)

			if (!album) {
				throw new NotFoundError("Album")
			}

			const ipAddress = req.ip
			const userAgent = req.get("user-agent")
			analyticsService
				.trackAlbumView({
					albumId: id,
					ipAddress,
					userAgent,
					sessionId: req.headers["x-session-token"] as string | undefined,
				})
				.catch((err) =>
					logger.error("Failed to track album view", {
						error: err,
						albumId: id,
					})
				)

			res.json({
				success: true,
				data: { album },
			})
		} catch (error) {
			next(error)
		}
	}

	async getMediaUrls(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const generatePresigned = req.query.presigned === "true"

			const mediaUrlService = require("../services/media-url.service").default
			const urls = await mediaUrlService.getAlbumMediaUrls(
				id,
				req.user!.userId,
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

	async update(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const validated = updateAlbumSchema.parse(req.body)
			const album = await albumService.updateAlbum(
				req.user!.userId,
				id,
				validated
			)

			res.json({
				success: true,
				data: { album },
			})
		} catch (error) {
			next(error)
		}
	}

	async delete(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			await albumService.deleteAlbum(req.user!.userId, id)

			res.json({
				success: true,
				data: { message: "Album deleted successfully" },
			})
		} catch (error) {
			next(error)
		}
	}

	async archive(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params

			const album = await prisma.album.findUnique({
				where: { id },
				select: { id: true, ownerId: true },
			})

			if (!album || album.ownerId !== req.user?.userId) {
				throw new NotFoundError("Album")
			}

			await prisma.album.update({
				where: { id },
				data: { status: "ARCHIVED" },
			})

			res.json({
				success: true,
				data: { message: "Album archived successfully" },
			})
		} catch (error) {
			next(error)
		}
	}

	async restore(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params

			const album = await prisma.album.findUnique({
				where: { id },
				select: { id: true, ownerId: true, status: true },
			})

			if (!album || album.ownerId !== req.user?.userId) {
				throw new NotFoundError("Album")
			}

			if (album.status !== "ARCHIVED") {
				throw new ValidationError("Album is not archived")
			}

			await prisma.album.update({
				where: { id },
				data: { status: "ACTIVE" },
			})

			res.json({
				success: true,
				data: { message: "Album restored successfully" },
			})
		} catch (error) {
			next(error)
		}
	}

	async getContributors(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params

			const album = await prisma.album.findUnique({
				where: { id },
				select: { id: true, ownerId: true },
			})

			if (!album || album.ownerId !== req.user?.userId) {
				throw new NotFoundError("Album")
			}

			const contributors = await prisma.media.findMany({
				where: { albumId: id, status: "READY" },
				select: {
					contributorName: true,
					contributorDeviceId: true,
					uploadedAt: true,
				},
				distinct: ["contributorDeviceId"],
				orderBy: { uploadedAt: "desc" },
			})

			const contributorStats = contributors.map((c: any) => ({
				name: c.contributorName || "Anonymous",
				deviceId: c.contributorDeviceId,
				firstUpload: c.uploadedAt,
			}))

			res.json({
				success: true,
				data: {
					contributors: contributorStats,
					total: contributors.length,
				},
			})
		} catch (error) {
			next(error)
		}
	}

	async generateAccessCode(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const { note } = req.body
			const result = await albumService.generateAccessCode(
				req.user!.userId,
				id,
				note
			)

			res.json({
				success: true,
				data: { accessCode: result },
			})
		} catch (error) {
			next(error)
		}
	}

	async listAccessCodes(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const result = await albumService.listAccessCodes(req.user!.userId, id)

			res.json({
				success: true,
				data: { accessCodes: result },
			})
		} catch (error) {
			next(error)
		}
	}

	async blacklistAccessCode(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const { accessCodeId } = req.body
			const result = await albumService.blacklistAccessCode(
				req.user!.userId,
				id,
				accessCodeId
			)

			res.json({
				success: true,
				data: result,
			})
		} catch (error) {
			next(error)
		}
	}

	async unblacklistAccessCode(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const { accessCodeId } = req.body
			const result = await albumService.unblacklistAccessCode(
				req.user!.userId,
				id,
				accessCodeId
			)

			res.json({
				success: true,
				data: result,
			})
		} catch (error) {
			next(error)
		}
	}

	async deleteAccessCode(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const { accessCodeId } = req.body
			const result = await albumService.deleteAccessCode(
				req.user!.userId,
				id,
				accessCodeId
			)

			res.json({
				success: true,
				data: result,
			})
		} catch (error) {
			next(error)
		}
	}

	async listSessions(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const sessions = await accessCodeSecurityService.listSessions(id)

			const album = await prisma.album.findUnique({
				where: { id },
				select: { ownerId: true },
			})

			if (!album || album.ownerId !== req.user!.userId) {
				throw new NotFoundError("Album")
			}

			res.json({
				success: true,
				data: { sessions },
			})
		} catch (error) {
			next(error)
		}
	}

	async revokeSession(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const { sessionId } = req.body

			const album = await prisma.album.findUnique({
				where: { id },
				select: { ownerId: true },
			})

			if (!album || album.ownerId !== req.user!.userId) {
				throw new NotFoundError("Album")
			}

			const session = await prisma.accessCodeSession.findFirst({
				where: { id: sessionId, albumId: id },
			})

			if (!session) {
				throw new NotFoundError("Session")
			}

			await accessCodeSecurityService.revokeSession(session.sessionToken)

			logger.info("Session revoked by owner", {
				albumId: id,
				sessionId,
				userId: req.user!.userId,
			})

			res.json({
				success: true,
				data: { message: "Session revoked successfully" },
			})
		} catch (error) {
			next(error)
		}
	}

	async blacklistSession(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const { sessionId } = req.body

			const album = await prisma.album.findUnique({
				where: { id },
				select: { ownerId: true },
			})

			if (!album || album.ownerId !== req.user!.userId) {
				throw new NotFoundError("Album")
			}

			await accessCodeSecurityService.blacklistSession(sessionId, id)

			res.json({
				success: true,
				data: { message: "Session blacklisted successfully" },
			})
		} catch (error) {
			next(error)
		}
	}

	async unblacklistSession(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const { sessionId } = req.body

			const album = await prisma.album.findUnique({
				where: { id },
				select: { ownerId: true },
			})

			if (!album || album.ownerId !== req.user!.userId) {
				throw new NotFoundError("Album")
			}

			await accessCodeSecurityService.unblacklistSession(sessionId, id)

			res.json({
				success: true,
				data: { message: "Session unblacklisted successfully" },
			})
		} catch (error) {
			next(error)
		}
	}

	async regenerateIdentifiers(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const result = await albumService.regenerateIdentifiers(
				req.user!.userId,
				id
			)

			res.json({
				success: true,
				data: result,
			})
		} catch (error) {
			if (error instanceof Error && error.message === "NOT_FOUND") {
				return res.status(404).json({
					success: false,
					error: { message: "Album not found" },
				})
			}
			next(error)
		}
	}
}

export default new AlbumController()
