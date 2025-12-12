import { Request, Response, NextFunction } from "express"
import analyticsService from "../services/analytics.service"
import { NotFoundError } from "../utils/errors"
import logger from "../utils/logger"
import prisma from "../config/db"

class AnalyticsController {
	async getAlbumAnalytics(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const days = parseInt(req.query.days as string) || 30

			const album = await prisma.album.findUnique({
				where: { id },
				select: { id: true, ownerId: true, privacy: true, expiresAt: true },
			})

			if (!album) {
				throw new NotFoundError("Album")
			}

			const isOwner = album.ownerId === req.user?.userId
			if (!isOwner && album.privacy !== "PUBLIC") {
				throw new NotFoundError("Album")
			}

			if (
				!isOwner &&
				album.expiresAt &&
				new Date(album.expiresAt) < new Date()
			) {
				throw new NotFoundError("Album")
			}

			const stats = await analyticsService.getAlbumStats(id, days)

			res.json({
				success: true,
				data: { stats },
			})
		} catch (error) {
			next(error)
		}
	}

	async getAlbumStats(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params

			const album = await prisma.album.findUnique({
				where: { id },
				select: {
					id: true,
					ownerId: true,
					privacy: true,
					expiresAt: true,
					viewCount: true,
					downloadCount: true,
					mediaCount: true,
					uniqueContributors: true,
					totalSizeBytes: true,
				},
			})

			if (!album) {
				throw new NotFoundError("Album")
			}

			const isOwner = album.ownerId === req.user?.userId
			if (!isOwner && album.privacy !== "PUBLIC") {
				throw new NotFoundError("Album")
			}

			if (
				!isOwner &&
				album.expiresAt &&
				new Date(album.expiresAt) < new Date()
			) {
				throw new NotFoundError("Album")
			}

			res.json({
				success: true,
				data: {
					stats: {
						views: album.viewCount,
						downloads: album.downloadCount,
						mediaCount: album.mediaCount,
						uniqueContributors: album.uniqueContributors,
						totalSizeBytes: album.totalSizeBytes.toString(),
						totalSizeMB: Math.round(Number(album.totalSizeBytes) / 1024 / 1024),
					},
				},
			})
		} catch (error) {
			next(error)
		}
	}

	async getRecentActivity(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const limit = parseInt(req.query.limit as string) || 50

			const album = await prisma.album.findUnique({
				where: { id },
				select: { id: true, ownerId: true, privacy: true, expiresAt: true },
			})

			if (!album) {
				throw new NotFoundError("Album")
			}

			const isOwner = album.ownerId === req.user?.userId
			if (!isOwner && album.privacy !== "PUBLIC") {
				throw new NotFoundError("Album")
			}

			if (
				!isOwner &&
				album.expiresAt &&
				new Date(album.expiresAt) < new Date()
			) {
				throw new NotFoundError("Album")
			}

			const activity = await analyticsService.getRecentActivity(id, limit)

			res.json({
				success: true,
				data: { activity },
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new AnalyticsController()
