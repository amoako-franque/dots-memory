import prisma from "../config/db"
import storageService from "./storage.service"
import { s3Config } from "../config/s3.config"
import { getS3Client } from "../config/s3.config"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import logger from "../utils/logger"
import { NotFoundError, AuthorizationError } from "../utils/errors"

export interface MediaUrlInfo {
	id: string
	type: "IMAGE" | "VIDEO"
	url: string
	thumbnailUrl?: string | null
	fileName: string
	presignedUrl?: string
	expiresAt?: Date
}

export class MediaUrlService {
	async getAlbumMediaUrls(
		albumId: string,
		userId?: string,
		generatePresigned: boolean = false
	): Promise<MediaUrlInfo[]> {
		const album = await prisma.album.findUnique({
			where: { id: albumId },
			select: {
				id: true,
				ownerId: true,
				privacy: true,
			},
		})

		if (!album) {
			throw new NotFoundError("Album", "ALBUM_NOT_FOUND", albumId)
		}

		const isOwner = userId && album.ownerId === userId
		if (!isOwner && album.privacy !== "PUBLIC") {
			throw new AuthorizationError(
				"You do not have permission to access this album",
				"UNAUTHORIZED",
				"album"
			)
		}

		const media = await prisma.media.findMany({
			where: {
				albumId,
				status: "READY",
			},
			select: {
				id: true,
				type: true,
				cdnUrl: true,
				thumbnailUrl: true,
				fileName: true,
				s3Key: true,
				s3Bucket: true,
			},
			orderBy: { uploadedAt: "desc" },
		})

		const providerType = storageService.getProviderType()
		const urls: MediaUrlInfo[] = []

		for (const item of media) {
			if (!item.cdnUrl || item.cdnUrl.trim() === "") {
				continue
			}

			const urlInfo: MediaUrlInfo = {
				id: item.id,
				type: item.type,
				url: item.cdnUrl,
				thumbnailUrl: item.thumbnailUrl,
				fileName: item.fileName,
			}

			if (generatePresigned && providerType === "s3" && item.s3Key) {
				try {
					const client = getS3Client()
					if (client) {
						const command = new GetObjectCommand({
							Bucket: s3Config.bucket,
							Key: item.s3Key,
						})

						const presignedUrl = await getSignedUrl(client, command, {
							expiresIn: s3Config.presignedUrlExpiration,
						})

						urlInfo.presignedUrl = presignedUrl
						urlInfo.expiresAt = new Date(
							Date.now() + s3Config.presignedUrlExpiration * 1000
						)
					}
				} catch (error) {
					logger.warn("Failed to generate presigned URL", {
						mediaId: item.id,
						error: error instanceof Error ? error.message : "Unknown error",
					})
				}
			}

			urls.push(urlInfo)
		}

		return urls
	}

	async getMediaUrl(
		mediaId: string,
		userId?: string,
		generatePresigned: boolean = false
	): Promise<MediaUrlInfo> {
		const media = await prisma.media.findUnique({
			where: { id: mediaId },
			include: {
				album: {
					select: {
						id: true,
						ownerId: true,
						privacy: true,
					},
				},
			},
		})

		if (!media || media.status !== "READY") {
			throw new NotFoundError("Media", "MEDIA_NOT_FOUND", mediaId)
		}

		const isOwner = userId && media.album.ownerId === userId
		if (!isOwner && media.album.privacy !== "PUBLIC") {
			throw new AuthorizationError(
				"You do not have permission to access this media",
				"UNAUTHORIZED",
				"media"
			)
		}

		if (!media.cdnUrl || media.cdnUrl.trim() === "") {
			throw new NotFoundError("Media", "MEDIA_URL_NOT_FOUND", mediaId)
		}

		const urlInfo: MediaUrlInfo = {
			id: media.id,
			type: media.type,
			url: media.cdnUrl,
			thumbnailUrl: media.thumbnailUrl,
			fileName: media.fileName,
		}

		if (generatePresigned) {
			const providerType = storageService.getProviderType()

			if (providerType === "s3" && media.s3Key) {
				try {
					const client = getS3Client()
					if (client) {
						const command = new GetObjectCommand({
							Bucket: s3Config.bucket,
							Key: media.s3Key,
						})

						const presignedUrl = await getSignedUrl(client, command, {
							expiresIn: s3Config.presignedUrlExpiration,
						})

						urlInfo.presignedUrl = presignedUrl
						urlInfo.expiresAt = new Date(
							Date.now() + s3Config.presignedUrlExpiration * 1000
						)
					}
				} catch (error) {
					logger.warn("Failed to generate presigned URL", {
						mediaId,
						error: error instanceof Error ? error.message : "Unknown error",
					})
				}
			}
		}

		return urlInfo
	}

	async generatePresignedDownloadUrl(
		mediaId: string,
		userId?: string
	): Promise<{ url: string; expiresAt: Date }> {
		const media = await prisma.media.findUnique({
			where: { id: mediaId },
			include: {
				album: {
					select: {
						ownerId: true,
						privacy: true,
					},
				},
			},
		})

		if (!media || media.status !== "READY") {
			throw new NotFoundError("Media", "MEDIA_NOT_FOUND", mediaId)
		}

		const isOwner = userId && media.album.ownerId === userId
		if (!isOwner && media.album.privacy !== "PUBLIC") {
			throw new AuthorizationError(
				"You do not have permission to download this media",
				"UNAUTHORIZED",
				"media"
			)
		}

		const providerType = storageService.getProviderType()

		if (providerType === "s3" && media.s3Key) {
			const client = getS3Client()
			if (!client) {
				throw new Error("S3 client not available")
			}

			const command = new GetObjectCommand({
				Bucket: s3Config.bucket,
				Key: media.s3Key,
			})

			const presignedUrl = await getSignedUrl(client, command, {
				expiresIn: s3Config.presignedUrlExpiration,
			})

			return {
				url: presignedUrl,
				expiresAt: new Date(
					Date.now() + s3Config.presignedUrlExpiration * 1000
				),
			}
		}

		if (providerType === "cloudinary") {
			return {
				url: media.cdnUrl || "",
				expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
			}
		}

		return {
			url: media.cdnUrl || "",
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
		}
	}
}

export default new MediaUrlService()
