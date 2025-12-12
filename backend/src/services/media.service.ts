import prisma from "../config/db"
import storageService from "./storage.service"
import { v4 as uuidv4 } from "uuid"
import { z } from "zod"
import { initiateUploadSchema } from "../validators/media.validator"
import imageProcessor from "../utils/image-processor"
import path from "path"
import fs from "fs-extra"
import {
	NotFoundError,
	AuthorizationError,
	QuotaExceededError,
	FileSizeError,
	ValidationError,
} from "../utils/errors"
import logger from "../utils/logger"
import subscriptionService from "./subscription.service"
import FileValidator from "../utils/file-validator"
import ImageSanitizer from "../utils/image-sanitizer"
import { s3Config } from "../config/s3.config"
import { cloudinaryConfig } from "../config/cloudinary.config"
import { v2 as cloudinary } from "cloudinary"

type InitiateUploadInput = z.infer<typeof initiateUploadSchema>

export class MediaService {
	async initiateUpload(userId: string, data: InitiateUploadInput) {
		const album = await prisma.album.findUnique({
			where: { id: data.albumId },
		})

		if (!album) {
			throw new NotFoundError("Album", "ALBUM_NOT_FOUND", data.albumId)
		}

		const isOwner = userId && album.ownerId === userId

		if (!isOwner) {
			if (album.privacy !== "PUBLIC") {
				throw new AuthorizationError(
					"You do not have permission to upload to this album",
					"UNAUTHORIZED",
					"album"
				)
			}

			const sessionToken = data.sessionToken
			if (!sessionToken) {
				throw new AuthorizationError(
					"Session token required for public album uploads",
					"UNAUTHORIZED",
					"album"
				)
			}

			const accessCodeSecurityService =
				require("./access-code-security.service").default
			const sessionResult = await accessCodeSecurityService.verifySession(
				album.id,
				album.shortUrl || album.id,
				sessionToken
			)

			if (!sessionResult.valid) {
				logger.warn("Blocked upload attempt - invalid session", {
					albumId: album.id,
					reason: sessionResult.reason,
				})
				throw new AuthorizationError(
					sessionResult.reason || "Invalid or expired session",
					"UNAUTHORIZED",
					"album"
				)
			}

			const isBlocked = await accessCodeSecurityService.isSessionBlocked(
				sessionToken
			)
			if (isBlocked) {
				logger.warn("Blocked upload attempt - session blacklisted/revoked", {
					albumId: album.id,
					sessionToken: sessionToken.substring(0, 8) + "...",
				})
				throw new AuthorizationError(
					"Your session has been revoked. Please enter the access code again.",
					"SESSION_REVOKED",
					"album"
				)
			}
		}

		const usageService = require("./usage.service").default
		const isVideo = data.fileType.startsWith("video/")

		const canUpload = isVideo
			? await usageService.canUploadVideo(userId)
			: await usageService.canUploadPhoto(userId)

		if (!canUpload.allowed) {
			const resourceType = isVideo ? "VIDEO" : "PHOTO"
			throw new QuotaExceededError(
				canUpload.reason || "Upload limit reached. Please upgrade your plan.",
				resourceType,
				0, // Current count not easily available here
				0, // Limit not easily available here
				"UPLOAD_LIMIT_REACHED"
			)
		}

		const fileSizeValidation = await usageService.validateFileSize(
			userId,
			data.fileSize,
			isVideo
		)
		if (!fileSizeValidation.valid) {
			const limits = await subscriptionService.getSubscriptionLimits(userId)
			const maxSizeMB = isVideo
				? limits?.maxVideoSizeMB || 100
				: limits?.maxPhotoSizeMB || 10

			throw new FileSizeError(
				fileSizeValidation.reason || "File size exceeds limit",
				data.fileSize,
				maxSizeMB * 1024 * 1024,
				"FILE_SIZE_EXCEEDED"
			)
		}

		const providerType = storageService.getProviderType()
		const maxFileSizeMB =
			providerType === "cloudinary"
				? cloudinaryConfig.maxFileSizeMB
				: providerType === "s3"
				? s3Config.maxFileSizeMB
				: 100

		const allowedMimeTypes =
			providerType === "cloudinary"
				? cloudinaryConfig.allowedMimeTypes
				: providerType === "s3"
				? s3Config.allowedMimeTypes
				: [
						"image/jpeg",
						"image/png",
						"image/gif",
						"image/webp",
						"video/mp4",
						"video/webm",
				  ]

		const allowedExtensions =
			providerType === "cloudinary"
				? cloudinaryConfig.allowedExtensions
				: providerType === "s3"
				? s3Config.allowedExtensions
				: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm"]

		const sanitizedFileName = FileValidator.sanitizeFileName(data.fileName)
		const validation = FileValidator.validateFile(
			sanitizedFileName,
			data.fileSize,
			data.fileType,
			{
				maxSizeBytes: maxFileSizeMB * 1024 * 1024,
				allowedMimeTypes,
				allowedExtensions,
				requireImageSanitization: isVideo ? false : true,
			}
		)

		if (!validation.valid) {
			throw new ValidationError(
				validation.error || "File validation failed",
				validation.code || "FILE_VALIDATION_FAILED",
				"file"
			)
		}

		const mediaId = uuidv4()
		const key = `${data.albumId}/${mediaId}-${sanitizedFileName}`

		const media = await prisma.media.create({
			data: {
				id: mediaId,
				albumId: data.albumId,
				type: data.fileType.startsWith("image/") ? "IMAGE" : "VIDEO",
				status: "UPLOADING",
				fileName: sanitizedFileName,
				originalFileName: data.fileName,
				mimeType: data.fileType,
				fileSizeBytes: data.fileSize,
				s3Key: key,
				s3Bucket: storageService.getProviderType(),
				cdnUrl: "",
			},
		})

		const uploadUrl = await storageService.getUploadUrl(key, data.fileType)

		return {
			media,
			uploadUrl,
			providerType,
		}
	}

	async confirmUpload(mediaId: string, cloudinaryResponse?: any) {
		const media = await prisma.media.findUnique({
			where: { id: mediaId },
			include: { album: true },
		})

		if (!media) {
			throw new NotFoundError("Media", "MEDIA_NOT_FOUND", mediaId)
		}

		let thumbnailUrl = null
		let thumbnailS3Key = null
		let width = null
		let height = null
		let cloudinaryData = null

		// If Cloudinary response is provided, extract data from it
		if (
			cloudinaryResponse &&
			storageService.getProviderType() === "cloudinary"
		) {
			try {
				// Store full Cloudinary response data
				cloudinaryData = {
					public_id: cloudinaryResponse.public_id,
					secure_url: cloudinaryResponse.secure_url,
					url: cloudinaryResponse.url,
					width: cloudinaryResponse.width,
					height: cloudinaryResponse.height,
					format: cloudinaryResponse.format,
					resource_type: cloudinaryResponse.resource_type,
					bytes: cloudinaryResponse.bytes,
					created_at: cloudinaryResponse.created_at,
					etag: cloudinaryResponse.etag,
					version: cloudinaryResponse.version,
					signature: cloudinaryResponse.signature,
				}

				if (media.type === "IMAGE") {
					width = cloudinaryResponse.width || null
					height = cloudinaryResponse.height || null

					// Generate thumbnail URL from Cloudinary
					const publicId = cloudinaryResponse.public_id
					thumbnailUrl = cloudinary.url(publicId, {
						secure: cloudinaryConfig.secure,
						resource_type: "image",
						width: 300,
						height: 300,
						crop: "fill",
						quality: "auto",
						format: "auto",
					})
				}
			} catch (error) {
				logger.warn("Failed to process Cloudinary response", {
					mediaId,
					error: error instanceof Error ? error.message : "Unknown error",
				})
			}
		}

		if (media.type === "IMAGE" && !cloudinaryData) {
			try {
				const providerType = storageService.getProviderType()

				if (providerType === "local") {
					const uploadDir = path.join(process.cwd(), "uploads")
					const inputPath = path.join(uploadDir, media.s3Key)

					if (await fs.pathExists(inputPath)) {
						const sanitizationResult = await ImageSanitizer.sanitizeImage(
							inputPath
						)

						if (!sanitizationResult.success) {
							logger.warn("Image sanitization failed, using original", {
								mediaId,
								error: sanitizationResult.error,
							})
						}

						const metadata = await imageProcessor.getMetadata(
							sanitizationResult.filePath || inputPath
						)
						width = metadata.width || undefined
						height = metadata.height || undefined

						const thumbKey = media.s3Key.replace(
							path.extname(media.s3Key),
							"-thumb.jpg"
						)
						const outputPath = path.join(uploadDir, thumbKey)

						await imageProcessor.generateThumbnail(
							sanitizationResult.filePath || inputPath,
							outputPath
						)

						thumbnailS3Key = thumbKey
						thumbnailUrl = await storageService.getDownloadUrl(thumbKey)
					}
				} else {
					const cdnUrl = await storageService.getDownloadUrl(media.s3Key)

					if (providerType === "cloudinary") {
						const publicId = media.s3Key.replace(
							/\.(jpg|jpeg|png|gif|webp)$/i,
							""
						)

						try {
							const info = await cloudinary.api.resource(publicId, {
								resource_type: "image",
							})
							width = info.width || undefined
							height = info.height || undefined
							thumbnailUrl = cloudinary.url(publicId, {
								secure: cloudinaryConfig.secure,
								resource_type: "image",
								width: 300,
								height: 300,
								crop: "fill",
								quality: "auto",
								format: "auto",
							})
						} catch (error) {
							logger.warn("Failed to get Cloudinary image info", {
								mediaId,
								publicId,
								error: error instanceof Error ? error.message : "Unknown error",
							})
							thumbnailUrl = cdnUrl
						}
					} else {
						try {
							const metadata = await imageProcessor.getMetadata(cdnUrl)
							width = metadata.width || undefined
							height = metadata.height || undefined
						} catch (error) {
							logger.warn("Failed to get image metadata from CDN", {
								mediaId,
								error: error instanceof Error ? error.message : "Unknown error",
							})
						}

						const thumbKey = media.s3Key.replace(
							path.extname(media.s3Key),
							"-thumb.jpg"
						)
						thumbnailUrl = await storageService.getDownloadUrl(thumbKey)
					}
				}
			} catch (error) {
				logger.error("Image processing failed", {
					mediaId,
					error: error instanceof Error ? error.message : "Unknown error",
				})
			}
		}

		const providerType = storageService.getProviderType()
		let permanentUrl: string
		let cloudinaryPublicId: string | null = null

		// If we have Cloudinary response data, use it directly
		if (cloudinaryData && cloudinaryData.secure_url) {
			permanentUrl = cloudinaryData.secure_url
			cloudinaryPublicId = cloudinaryData.public_id
		} else if (providerType === "cloudinary") {
			// Extract public_id from s3Key (which contains the path)
			const publicId = media.s3Key.replace(
				/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|avi)$/i,
				""
			)
			cloudinaryPublicId = publicId
			const isVideo = media.type === "VIDEO"
			permanentUrl = cloudinary.url(publicId, {
				secure: cloudinaryConfig.secure,
				resource_type: isVideo ? "video" : "image",
			})
		} else if (providerType === "s3") {
			if (s3Config.cdnUrl) {
				permanentUrl = `${s3Config.cdnUrl}/${media.s3Key}`
			} else {
				permanentUrl = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${media.s3Key}`
			}
		} else {
			permanentUrl = await storageService.getDownloadUrl(media.s3Key)
		}

		// Prepare update data
		const updateData: any = {
			status: "READY",
			cdnUrl: permanentUrl,
			cloudinaryPublicId,
			thumbnailUrl,
			thumbnailS3Key,
			width: width || undefined,
			height: height || undefined,
		}

		// Store Cloudinary response data in exifData field
		if (cloudinaryData) {
			updateData.exifData = cloudinaryData
		}

		const updatedMedia = await prisma.media.update({
			where: { id: mediaId },
			data: updateData,
		})

		// Update album mediaCount and totalSizeBytes when media is confirmed
		// Only increment if status was UPLOADING (first time confirmation)
		if (media.status === "UPLOADING") {
			try {
				await prisma.album.update({
					where: { id: media.albumId },
					data: {
						mediaCount: { increment: 1 },
						totalSizeBytes: { increment: media.fileSizeBytes },
					},
				})
			} catch (error) {
				logger.error("Failed to update album media count", {
					mediaId,
					albumId: media.albumId,
					error: error instanceof Error ? error.message : "Unknown error",
				})
			}
		}

		try {
			const usageService = require("./usage.service").default
			const ownerId = media.album.ownerId

			if (media.type === "IMAGE") {
				await usageService.incrementPhotoCount(ownerId, media.fileSizeBytes)
			} else if (media.type === "VIDEO") {
				await usageService.incrementVideoCount(ownerId, media.fileSizeBytes)
			}
		} catch (error) {
			logger.error("Failed to update usage stats", {
				mediaId,
				ownerId: media.album.ownerId,
				error: error instanceof Error ? error.message : "Unknown error",
			})
		}

		return updatedMedia
	}
}

export default new MediaService()
