import { Request, Response, NextFunction } from "express"
import mediaService from "../services/media.service"
import analyticsService from "../services/analytics.service"
import { NotFoundError } from "../utils/errors"
import logger from "../utils/logger"
import prisma from "../config/db"

class MediaController {
	async initiateUpload(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user?.userId
			const sessionToken = req.headers["x-session-token"] as string | undefined

			const uploadData = {
				...req.body,
				sessionToken: sessionToken || req.body.sessionToken,
			}

			const result = await mediaService.initiateUpload(userId || "", uploadData)
			res.json({ success: true, data: result })
		} catch (error) {
			next(error)
		}
	}

	async confirmUpload(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const { cloudinaryResponse } = req.body
			const media = await mediaService.confirmUpload(id, cloudinaryResponse)

			if (media.albumId) {
				analyticsService
					.trackEvent({
						albumId: media.albumId,
						eventType: "MEDIA_UPLOAD",
						metadata: { mediaId: id },
					})
					.catch((err) =>
						logger.error("Failed to track upload", { error: err })
					)
			}

			res.json({ success: true, data: { media } })
		} catch (error) {
			next(error)
		}
	}

	async listByAlbum(req: Request, res: Response, next: NextFunction) {
		try {
			const { albumId } = req.params
			const page = parseInt(req.query.page as string) || 1
			const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
			const skip = (page - 1) * limit

			const album = await prisma.album.findUnique({
				where: { id: albumId },
				select: { id: true, ownerId: true },
			})

			if (!album || album.ownerId !== req.user?.userId) {
				throw new NotFoundError("Album")
			}

			const [media, total] = await Promise.all([
				prisma.media.findMany({
					where: { albumId, status: { not: "DELETED" } },
					select: {
						id: true,
						type: true,
						status: true,
						fileName: true,
						cdnUrl: true,
						thumbnailUrl: true,
						width: true,
						height: true,
						aspectRatio: true,
						durationSeconds: true,
						fileSizeBytes: true,
						caption: true,
						contributorName: true,
						uploadedAt: true,
						viewCount: true,
						downloadCount: true,
						reactionCount: true,
					},
					orderBy: { uploadedAt: "desc" },
					skip,
					take: limit,
				}),
				prisma.media.count({
					where: { albumId, status: { not: "DELETED" } },
				}),
			])

			res.json({
				success: true,
				data: {
					media,
					pagination: {
						page,
						limit,
						total,
						totalPages: Math.ceil(total / limit),
					},
				},
			})
		} catch (error) {
			next(error)
		}
	}

	async get(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params

			const media = await prisma.media.findUnique({
				where: { id },
				include: {
					album: {
						select: {
							id: true,
							ownerId: true,
							name: true,
						},
					},
				},
			})

			if (!media || media.status === "DELETED") {
				throw new NotFoundError("Media")
			}

			if (media.album.ownerId !== req.user?.userId) {
				throw new NotFoundError("Media")
			}

			analyticsService
				.incrementMediaViews(id)
				.catch((err) =>
					logger.error("Failed to track media view", { error: err })
				)

			res.json({
				success: true,
				data: { media },
			})
		} catch (error) {
			next(error)
		}
	}

	async delete(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params

			const media = await prisma.media.findUnique({
				where: { id },
				include: {
					album: {
						select: {
							id: true,
							ownerId: true,
						},
					},
				},
			})

			if (!media || media.status === "DELETED") {
				throw new NotFoundError("Media")
			}

			if (media.album.ownerId !== req.user?.userId) {
				throw new NotFoundError("Media")
			}

			// Delete from storage
			const storageService = require("../services/storage.service").default
			const providerType = storageService.getProviderType()

			try {
				if (providerType === "cloudinary" && media.cloudinaryPublicId) {
					// Use public_id for Cloudinary deletion
					await storageService.deleteFile(media.cloudinaryPublicId)
				} else if (media.s3Key) {
					// Use s3Key for S3 or local deletion
					await storageService.deleteFile(media.s3Key)
				}

				// Delete thumbnail if exists
				if (media.thumbnailS3Key) {
					try {
						await storageService.deleteFile(media.thumbnailS3Key)
					} catch (error) {
						logger.warn("Failed to delete thumbnail", { mediaId: id, error })
					}
				}
			} catch (error) {
				logger.error("Failed to delete file from storage", {
					mediaId: id,
					error: error instanceof Error ? error.message : "Unknown error",
				})
				// Continue with DB deletion even if storage deletion fails
			}

            await prisma.media.update({
                where: { id },
				data: { status: "DELETED" },
			})

            // Get current album to check mediaCount before decrementing
            const album = await prisma.album.findUnique({
                where: { id: media.albumId },
                select: { mediaCount: true, totalSizeBytes: true },
            })

            if (album) {
                // Only decrement if count is greater than 0
                const newMediaCount = Math.max(0, album.mediaCount - 1)
                const newTotalSize = album.totalSizeBytes > media.fileSizeBytes
                    ? album.totalSizeBytes - media.fileSizeBytes
                    : BigInt(0)

                await prisma.album.update({
                    where: { id: media.albumId },
                    data: {
                        mediaCount: newMediaCount,
                        totalSizeBytes: newTotalSize,
                    },
                })
            }

			res.json({
				success: true,
				data: { message: "Media deleted successfully" },
			})
		} catch (error) {
			next(error)
		}
	}

	async cancelUpload(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const userId = req.user?.userId

			const media = await prisma.media.findUnique({
				where: { id },
				include: {
					album: {
						select: {
							id: true,
							ownerId: true,
						},
					},
				},
			})

			if (!media) {
				throw new NotFoundError("Media")
			}

			// Only allow canceling if status is UPLOADING
			if (media.status !== "UPLOADING") {
				return res.status(400).json({
					success: false,
					error: { message: "Can only cancel uploads in progress" },
				})
			}

			// Check ownership
			if (media.album.ownerId !== userId) {
				throw new NotFoundError("Media")
			}

			// Try to delete from storage if file was partially uploaded
			const storageService = require("../services/storage.service").default
			const providerType = storageService.getProviderType()

			try {
				if (providerType === "cloudinary" && media.cloudinaryPublicId) {
					await storageService.deleteFile(media.cloudinaryPublicId)
				} else if (media.s3Key) {
					await storageService.deleteFile(media.s3Key)
				}
			} catch (error) {
				logger.warn("Failed to delete partial upload from storage", {
					mediaId: id,
					error: error instanceof Error ? error.message : "Unknown error",
				})
			}

			// Delete from database
			await prisma.media.delete({
				where: { id },
			})

			res.json({
				success: true,
				data: { message: "Upload cancelled successfully" },
			})
		} catch (error) {
			next(error)
		}
	}

	async updateCaption(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const { caption } = req.body

			if (caption !== undefined && typeof caption !== "string") {
				return res.status(400).json({
					success: false,
					error: { message: "Caption must be a string" },
				})
			}

			const media = await prisma.media.findUnique({
				where: { id },
				include: {
					album: {
						select: {
							id: true,
							ownerId: true,
						},
					},
				},
			})

			if (!media || media.status === "DELETED") {
				throw new NotFoundError("Media")
			}

			if (media.album.ownerId !== req.user?.userId) {
				throw new NotFoundError("Media")
			}

			const updatedMedia = await prisma.media.update({
				where: { id },
				data: { caption: caption || null },
				select: {
					id: true,
					caption: true,
				},
			})

			res.json({
				success: true,
				data: { media: updatedMedia },
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new MediaController()
