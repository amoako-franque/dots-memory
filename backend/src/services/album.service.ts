import prisma from "../config/db"
import { generateQRCode } from "../utils/qrcode"
import { v4 as uuidv4 } from "uuid"
import {
	createAlbumSchema,
	updateAlbumSchema,
} from "../validators/album.validator"
import { z } from "zod"
import {
	NotFoundError,
	QuotaExceededError,
	ValidationError,
} from "../utils/errors"
import {
	hashAccessCode,
	encryptAccessCode,
	decryptAccessCode,
} from "../utils/password"

type CreateAlbumInput = z.infer<typeof createAlbumSchema>
type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>

export class AlbumService {
	private generateShortUrl(): string {
		return Math.random().toString(36).substring(2, 8)
	}

	async createAlbum(userId: string, data: CreateAlbumInput) {
		const usageService = require("./usage.service").default
		const canCreate = await usageService.canCreateAlbum(userId)

		if (!canCreate.allowed) {
			throw new QuotaExceededError(
				canCreate.reason || "Album limit reached. Please upgrade your plan.",
				"ALBUM",
				0, // We don't have current count here easily
				1, // Limit from the error message
				"ALBUM_LIMIT_REACHED"
			)
		}

		const shortUrl = this.generateShortUrl()
		const qrCodeId = uuidv4()
		const nfcId = uuidv4()

		const accessUrl = `${
			process.env.FRONTEND_URL || "http://localhost:5173"
		}/public/albums/${shortUrl}`
		const qrCodeDataUrl = await generateQRCode(accessUrl)

		let accessCode: string | null = null
		let accessCodeHash: string | null = null
		let accessCodeEncrypted: string | null = null

		const isPrivate = data.settings?.privacy === "PRIVATE"
		if (isPrivate) {
			const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Excluding confusing characters
			accessCode = Array.from(
				{ length: 8 },
				() => chars[Math.floor(Math.random() * chars.length)]
			).join("")
			accessCodeHash = await hashAccessCode(accessCode)
			accessCodeEncrypted = encryptAccessCode(accessCode) // Store encrypted for owner to view
		} else if (data.settings?.accessCode) {
			accessCode = data.settings.accessCode
			accessCodeHash = await hashAccessCode(accessCode)
			accessCodeEncrypted = encryptAccessCode(accessCode)
		}

		const { sanitizeText } = require("../utils/sanitize")

		const album = await prisma.album.create({
			data: {
				ownerId: userId,
				name: sanitizeText(data.name),
				description: data.description ? sanitizeText(data.description) : null,
				eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
				eventLocation: data.eventLocation
					? sanitizeText(data.eventLocation)
					: null,
				slug: shortUrl, // Using shortUrl as slug for now
				shortUrl,
				qrCodeId,
				nfcId,
				privacy: data.settings?.privacy || "PRIVATE",
				maxFileSizeMB: data.settings?.maxFileSizeMB || 100,
				maxVideoLengthSec: data.settings?.maxVideoLengthSec || 300,
				allowVideos: data.settings?.allowVideos ?? true,
				requireContributorName: data.settings?.requireContributorName ?? false,
				accessCodeHash,
				accessCodeEncrypted,
				uploadDescription: data.settings?.uploadDescription
					? sanitizeText(data.settings.uploadDescription)
					: null,
			},
		})

		try {
			await usageService.incrementAlbumCount(userId)
		} catch (error) {
			const logger = require("../utils/logger").default
			logger.error("Failed to update album count", {
				userId,
				error: error instanceof Error ? error.message : "Unknown error",
			})
		}

		return {
			album: {
				...album,
				accessCode: isPrivate ? accessCode : undefined, // Return plain access code for private albums
			},
			qrCode: {
				url: accessUrl,
				dataUrl: qrCodeDataUrl,
			},
			nfc: {
				url: accessUrl,
				ndefMessage: `dots:album:${nfcId}`,
			},
		}
	}

	async getAlbums(userId: string) {
		const userAlbums = await prisma.album.findMany({
			where: { ownerId: userId, status: "ACTIVE" },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				name: true,
				privacy: true,
				ownerId: true,
				shortUrl: true,
				createdAt: true,
				_count: {
					select: { media: true },
				},
			},
		})

		const publicAlbums = await prisma.album.findMany({
			where: {
				privacy: "PUBLIC",
				status: "ACTIVE",
				ownerId: { not: userId },
				OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
			},
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				name: true,
				privacy: true,
				ownerId: true,
				shortUrl: true,
				createdAt: true,
				_count: {
					select: { media: true },
				},
			},
		})

		const allAlbums = [...userAlbums, ...publicAlbums]

		const albumsWithUrls = await Promise.all(
			allAlbums.map(async (album) => {
				const mediaUrls = await prisma.media.findMany({
					where: {
						albumId: album.id,
						status: "READY",
						cdnUrl: {
							not: "",
						},
					},
					select: {
						id: true,
						type: true,
						cdnUrl: true,
						thumbnailUrl: true,
						fileName: true,
					},
					orderBy: { uploadedAt: "desc" },
					take: 10,
				})

				return {
					...album,
					mediaUrls: mediaUrls
						.filter((m) => m.cdnUrl && m.cdnUrl.trim() !== "")
						.map((m) => ({
							id: m.id,
							type: m.type,
							url: m.cdnUrl!,
							thumbnailUrl: m.thumbnailUrl,
							fileName: m.fileName,
						})),
				}
			})
		)

		return albumsWithUrls
	}

	/**
	 * Get all public albums (discoverable by other users)
	 */
	async getPublicAlbums() {
		return prisma.album.findMany({
			where: {
				privacy: "PUBLIC",
				status: "ACTIVE",
				OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
			},
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				name: true,
				description: true,
				shortUrl: true,
				eventDate: true,
				eventLocation: true,
				createdAt: true,
				viewCount: true,
				uniqueContributors: true,
				_count: {
					select: { media: true },
				},
				owner: {
					select: {
						id: true,
						email: true,
					},
				},
			},
		})
	}

	async getAlbum(userId: string, albumId: string) {
		try {
		const album = await prisma.album.findUnique({
			where: { id: albumId },
			include: {
				_count: {
					select: { media: true },
				},
				media: {
					where: {
						status: { not: "DELETED" },
					},
					select: {
						id: true,
						type: true,
						fileName: true,
						cdnUrl: true,
						thumbnailUrl: true,
					},
					orderBy: { uploadedAt: "desc" },
				},
			},
		})

			if (!album) {
				throw new NotFoundError("Album", "ALBUM_NOT_FOUND", albumId)
			}

			const isOwner = album.ownerId === userId
			if (!isOwner && album.privacy !== "PUBLIC") {
				throw new NotFoundError("Album", "ALBUM_NOT_FOUND", albumId)
			}

			if (
				!isOwner &&
				album.expiresAt &&
				new Date(album.expiresAt) < new Date()
			) {
			throw new NotFoundError("Album", "ALBUM_NOT_FOUND", albumId)
		}

		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
		const accessUrl = `${frontendUrl}/public/albums/${album.shortUrl}`
		const qrCodeDataUrl = await generateQRCode(accessUrl)

			let accessCode: string | undefined = undefined
			if (isOwner && album.accessCodeEncrypted) {
				try {
					accessCode = decryptAccessCode(album.accessCodeEncrypted)
				} catch (error) {
					const logger = require("../utils/logger").default
					logger.warn("Failed to decrypt access code", { albumId, error })
				}
			}

			const mediaUrls = album.media
				.filter((m) => m.cdnUrl && m.cdnUrl.trim() !== "")
				.map((m) => ({
					id: m.id,
					type: m.type,
					url: m.cdnUrl,
					thumbnailUrl: m.thumbnailUrl,
					fileName: m.fileName,
				}))

			const baseData = {
			...album,
				mediaUrls,
			shareInfo: {
				shortUrl: album.shortUrl,
				qrCodeId: album.qrCodeId,
				nfcId: album.nfcId,
				accessUrl,
				qrCodeDataUrl,
				nfcMessage: `dots:album:${album.nfcId}`,
			},
			}

			if (isOwner) {
				return {
					...baseData,
					accessCode,
				}
			} else {
				return {
					...baseData,
				}
			}
		} catch (error: any) {
			const logger = require("../utils/logger").default
			logger.error("Error in getAlbum", {
				albumId,
				userId,
				error: error?.message,
				code: error?.code,
				meta: error?.meta,
			})
			throw error
		}
	}

	async updateAlbum(userId: string, albumId: string, data: UpdateAlbumInput) {
		const album = await prisma.album.findUnique({
			where: { id: albumId },
		})

		if (!album || album.ownerId !== userId) {
			throw new NotFoundError("Album", "ALBUM_NOT_FOUND", albumId)
		}

		const updateData: any = {}

		if (data.name !== undefined) updateData.name = data.name
		if (data.description !== undefined)
			updateData.description = data.description
		if (data.eventLocation !== undefined)
			updateData.eventLocation = data.eventLocation

		if (data.eventDate !== undefined) {
			updateData.eventDate = data.eventDate ? new Date(data.eventDate) : null
		}

		if (data.expiresAt !== undefined) {
			updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
		}

		if (data.settings) {
			if (data.settings.privacy !== undefined) {
				updateData.privacy = data.settings.privacy

				if (album.privacy === "PUBLIC" && data.settings.privacy === "PRIVATE") {
					const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Excluding confusing characters
					const accessCode = Array.from(
						{ length: 8 },
						() => chars[Math.floor(Math.random() * chars.length)]
					).join("")
					updateData.accessCodeHash = await hashAccessCode(accessCode)
					updateData.accessCodeEncrypted = encryptAccessCode(accessCode)
					updateData._generatedAccessCode = accessCode
				} else if (
					data.settings.privacy === "PUBLIC" &&
					album.privacy === "PRIVATE"
				) {
					updateData.accessCodeHash = null
					updateData.accessCodeEncrypted = null
				}
			}

			if (data.settings.maxFileSizeMB !== undefined) {
				updateData.maxFileSizeMB = data.settings.maxFileSizeMB
			}
			if (data.settings.maxVideoLengthSec !== undefined) {
				updateData.maxVideoLengthSec = data.settings.maxVideoLengthSec
			}
			if (data.settings.allowVideos !== undefined) {
				updateData.allowVideos = data.settings.allowVideos
			}
			if (data.settings.requireContributorName !== undefined) {
				updateData.requireContributorName = data.settings.requireContributorName
			}
			if (data.settings.uploadDescription !== undefined) {
				updateData.uploadDescription = data.settings.uploadDescription
			}

			if (data.settings.accessCode !== undefined) {
			if (data.settings.accessCode) {
					updateData.accessCodeHash = await hashAccessCode(
						data.settings.accessCode
					)
					updateData.accessCodeEncrypted = encryptAccessCode(
						data.settings.accessCode
					)
			} else {
					updateData.accessCodeHash = null
					updateData.accessCodeEncrypted = null
				}
			}
		}

		const updatedAlbum = await prisma.album.update({
			where: { id: albumId },
			data: updateData,
		})

		let accessCode: string | undefined = undefined
		if (updatedAlbum.accessCodeEncrypted) {
			try {
				accessCode = decryptAccessCode(updatedAlbum.accessCodeEncrypted)
			} catch (error) {
				if (updateData._generatedAccessCode) {
					accessCode = updateData._generatedAccessCode
				}
			}
		} else if (updateData._generatedAccessCode) {
			accessCode = updateData._generatedAccessCode
		}

		if (accessCode) {
			return {
				...updatedAlbum,
				accessCode,
			}
		}

		return updatedAlbum
	}

	async deleteAlbum(userId: string, albumId: string) {
		const album = await prisma.album.findUnique({
			where: { id: albumId },
		})

		if (!album || album.ownerId !== userId) {
			throw new NotFoundError("Album", "ALBUM_NOT_FOUND", albumId)
		}

		const deletedAlbum = await prisma.album.update({
			where: { id: albumId },
			data: { status: "DELETED" },
		})

		try {
			const usageService = require("./usage.service").default
			await usageService.decrementAlbumCount(userId)
		} catch (error) {
			const logger = require("../utils/logger").default
			logger.error("Failed to update album count", {
				userId,
				error: error instanceof Error ? error.message : "Unknown error",
			})
		}

		return deletedAlbum
	}

	/**
	 * Generate a new access code for a private album
	 */
	async generateAccessCode(userId: string, albumId: string, note?: string) {
		const album = await prisma.album.findUnique({
			where: { id: albumId },
		})

		if (!album || album.ownerId !== userId) {
			throw new NotFoundError("Album", "ALBUM_NOT_FOUND", albumId)
		}

		if (album.privacy !== "PRIVATE") {
			throw new ValidationError(
				"Access code can only be generated for private albums"
			)
		}

		const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
		const newAccessCode = Array.from(
			{ length: 8 },
			() => chars[Math.floor(Math.random() * chars.length)]
		).join("")

		const accessCodeEntry = await prisma.albumAccessCode.create({
			data: {
				albumId,
				accessCodeHash: await hashAccessCode(newAccessCode),
				accessCodeEncrypted: encryptAccessCode(newAccessCode),
				note: note || null,
			},
		})

		return {
			id: accessCodeEntry.id,
			accessCode: newAccessCode,
			note: accessCodeEntry.note,
			createdAt: accessCodeEntry.createdAt,
			isBlacklisted: false,
		}
	}

	/**
	 * List all access codes for an album
	 */
	async listAccessCodes(userId: string, albumId: string) {
		const album = await prisma.album.findUnique({
			where: { id: albumId },
		})

		if (!album || album.ownerId !== userId) {
			throw new NotFoundError("Album", "ALBUM_NOT_FOUND", albumId)
		}

		const accessCodes = await prisma.albumAccessCode.findMany({
			where: { albumId },
			orderBy: { createdAt: "desc" },
		})

		return accessCodes.map((code) => {
			let accessCode: string | undefined = undefined
			if (code.accessCodeEncrypted) {
				try {
					accessCode = decryptAccessCode(code.accessCodeEncrypted)
				} catch (error) {}
			}

			return {
				id: code.id,
				accessCode,
				note: code.note,
				isBlacklisted: code.isBlacklisted,
				blacklistedAt: code.blacklistedAt,
				createdAt: code.createdAt,
			}
		})
	}

	/**
	 * Blacklist (revoke) an access code
	 */
	async blacklistAccessCode(
		userId: string,
		albumId: string,
		accessCodeId: string
	) {
		const album = await prisma.album.findUnique({
			where: { id: albumId },
		})

		if (!album || album.ownerId !== userId) {
			throw new NotFoundError("Album", "ALBUM_NOT_FOUND", albumId)
		}

		const accessCode = await prisma.albumAccessCode.findFirst({
			where: {
				id: accessCodeId,
				albumId,
			},
		})

		if (!accessCode) {
			throw new NotFoundError("Access Code", "ACCESS_CODE_NOT_FOUND")
		}

		if (accessCode.isBlacklisted) {
			throw new ValidationError("Access code is already blacklisted")
		}

		const updated = await prisma.albumAccessCode.update({
			where: { id: accessCodeId },
			data: {
				isBlacklisted: true,
				blacklistedAt: new Date(),
			},
		})

		return {
			id: updated.id,
			isBlacklisted: updated.isBlacklisted,
			blacklistedAt: updated.blacklistedAt,
		}
	}

	/**
	 * Unblacklist (restore) an access code
	 */
	async unblacklistAccessCode(
		userId: string,
		albumId: string,
		accessCodeId: string
	) {
		const album = await prisma.album.findUnique({
			where: { id: albumId },
		})

		if (!album || album.ownerId !== userId) {
			throw new NotFoundError("Album", "ALBUM_NOT_FOUND", albumId)
		}

		const accessCode = await prisma.albumAccessCode.findFirst({
			where: {
				id: accessCodeId,
				albumId,
			},
		})

		if (!accessCode) {
			throw new NotFoundError("Access Code", "ACCESS_CODE_NOT_FOUND")
		}

		if (!accessCode.isBlacklisted) {
			throw new ValidationError("Access code is not blacklisted")
		}

		const updated = await prisma.albumAccessCode.update({
			where: { id: accessCodeId },
			data: {
				isBlacklisted: false,
				blacklistedAt: null,
			},
		})

		return {
			id: updated.id,
			isBlacklisted: updated.isBlacklisted,
			blacklistedAt: updated.blacklistedAt,
		}
	}

	/**
	 * Delete an access code permanently
	 */
	async deleteAccessCode(
		userId: string,
		albumId: string,
		accessCodeId: string
	) {
		const album = await prisma.album.findUnique({
			where: { id: albumId },
		})

		if (!album || album.ownerId !== userId) {
			throw new NotFoundError("Album", "ALBUM_NOT_FOUND", albumId)
		}

		const accessCode = await prisma.albumAccessCode.findFirst({
			where: {
				id: accessCodeId,
				albumId,
			},
		})

		if (!accessCode) {
			throw new NotFoundError("Access Code", "ACCESS_CODE_NOT_FOUND")
		}

		await prisma.albumAccessCode.delete({
			where: { id: accessCodeId },
		})

		return { success: true }
	}

	/**
	 * Regenerate QR code, NFC ID, and short URL for an album
	 */
	async regenerateIdentifiers(userId: string, albumId: string) {
		const album = await prisma.album.findUnique({
			where: { id: albumId },
		})

		if (!album || album.ownerId !== userId) {
			throw new NotFoundError("Album", "ALBUM_NOT_FOUND", albumId)
		}

		const newShortUrl = this.generateShortUrl()
		const newQrCodeId = uuidv4()
		const newNfcId = uuidv4()

		const accessUrl = `${
			process.env.FRONTEND_URL || "http://localhost:5173"
		}/public/albums/${newShortUrl}`
		const qrCodeDataUrl = await generateQRCode(accessUrl)

		const updatedAlbum = await prisma.album.update({
			where: { id: albumId },
			data: {
				shortUrl: newShortUrl,
				qrCodeId: newQrCodeId,
				nfcId: newNfcId,
				slug: newShortUrl,
			},
		})

		return {
			album: updatedAlbum,
			qrCode: {
				url: accessUrl,
				dataUrl: qrCodeDataUrl,
			},
			nfc: {
				url: accessUrl,
				ndefMessage: `dots:album:${newNfcId}`,
			},
		}
	}
}

export default new AlbumService()
