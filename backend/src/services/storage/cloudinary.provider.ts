import { StorageProvider } from "./storage.provider"
import {
	v2 as cloudinary,
	UploadApiResponse,
	UploadApiErrorResponse,
} from "cloudinary"
import {
	cloudinaryConfig,
	initializeCloudinary,
} from "../../config/cloudinary.config"
import logger from "../../utils/logger"
import FileValidator from "../../utils/file-validator"
import { Readable } from "stream"

export class CloudinaryStorageProvider implements StorageProvider {
	private initialized: boolean

	constructor() {
		this.initialized = false
		if (cloudinaryConfig.enabled) {
			initializeCloudinary()
			this.initialized = true
		}
	}

	async getUploadUrl(key: string, contentType: string): Promise<string> {
		if (!cloudinaryConfig.enabled || !this.initialized) {
			throw new Error("Cloudinary is not enabled or not initialized")
		}

		const validation = FileValidator.validateMimeType(
			contentType,
			cloudinaryConfig.allowedMimeTypes
		)
		if (!validation.valid) {
			throw new Error(validation.error || "Invalid MIME type")
		}

		const isImage = FileValidator.isImage(contentType)
		const resourceType = isImage ? "image" : "video"

		if (cloudinaryConfig.uploadPreset) {
			// For upload presets, return base URL without signature
			return `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`
		}

		const timestamp = Math.round(new Date().getTime() / 1000)
		const folder = `${cloudinaryConfig.folder}/${key.split("/")[0]}`

		// Parameters for signature calculation
		// Note: resource_type is in the URL path, not in query params for signature
		// Only folder and timestamp are used for signature
		const paramsForSignature: Record<string, any> = {
			folder,
			timestamp,
		}

		const signature = cloudinary.utils.api_sign_request(
			paramsForSignature,
			cloudinaryConfig.apiSecret
		)

		// Build query string manually to preserve order and ensure proper encoding
		// Order: api_key, folder, signature, timestamp
		// Note: resource_type is in the URL path (/image/upload or /video/upload)
		const queryParams = new URLSearchParams()
		queryParams.append("api_key", cloudinaryConfig.apiKey)
		queryParams.append("folder", folder)
		queryParams.append("signature", signature)
		queryParams.append("timestamp", String(timestamp))

		// Generate the base upload URL
		// Format: https://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/upload
		const baseUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`

		return `${baseUrl}?${queryParams.toString()}`
	}

	async getDownloadUrl(key: string): Promise<string> {
		if (!cloudinaryConfig.enabled || !this.initialized) {
			throw new Error("Cloudinary is not enabled or not initialized")
		}

		const publicId = key.replace(
			/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|avi)$/i,
			""
		)
		const isVideo = /\.(mp4|webm|mov|avi)$/i.test(key)
		const resourceType = isVideo ? "video" : "image"

		let url = cloudinary.url(publicId, {
			secure: cloudinaryConfig.secure,
			resource_type: resourceType,
		})

		if (resourceType === "image") {
			url = cloudinary.url(publicId, {
				secure: cloudinaryConfig.secure,
				resource_type: "image",
				quality: cloudinaryConfig.imageTransformation.quality,
				format: cloudinaryConfig.imageTransformation.format,
				width: cloudinaryConfig.imageTransformation.width,
				height: cloudinaryConfig.imageTransformation.height,
			})
		}

		return url
	}

	async deleteFile(key: string): Promise<void> {
		if (!cloudinaryConfig.enabled || !this.initialized) {
			throw new Error("Cloudinary is not enabled or not initialized")
		}

		try {
			// key can be either a file path or a public_id
			// If it contains a file extension, extract public_id, otherwise use as-is
			const publicId =
				key.includes(".") &&
				/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|avi)$/i.test(key)
					? key.replace(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|avi)$/i, "")
					: key

			const isVideo =
				/\.(mp4|webm|mov|avi)$/i.test(key) || /^video\//.test(publicId)
			const resourceType = isVideo ? "video" : "image"

			await cloudinary.uploader.destroy(publicId, {
				resource_type: resourceType,
			})

			logger.info("File deleted from Cloudinary", { key, publicId })
		} catch (error) {
			logger.error("Failed to delete file from Cloudinary", {
				key,
				error: error instanceof Error ? error.message : "Unknown error",
			})
			throw new Error("Failed to delete file")
		}
	}

	async uploadFile(
		buffer: Buffer,
		key: string,
		contentType: string,
		metadata?: Record<string, string>
	): Promise<string> {
		if (!cloudinaryConfig.enabled || !this.initialized) {
			throw new Error("Cloudinary is not enabled or not initialized")
		}

		const validation = FileValidator.validateMimeType(
			contentType,
			cloudinaryConfig.allowedMimeTypes
		)
		if (!validation.valid) {
			throw new Error(validation.error || "Invalid MIME type")
		}

		const isImage = FileValidator.isImage(contentType)
		const resourceType = isImage ? "image" : "video"
		const folder = `${cloudinaryConfig.folder}/${key.split("/")[0]}`
		const publicId = key.replace(
			/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|avi)$/i,
			""
		)

		try {
			const stream = Readable.from(buffer)
			const uploadOptions: Record<string, any> = {
				folder,
				public_id: publicId,
				resource_type: resourceType,
				...(metadata && { context: metadata }),
			}

			if (isImage) {
				uploadOptions.quality = cloudinaryConfig.imageTransformation.quality
				uploadOptions.format = cloudinaryConfig.imageTransformation.format
				if (cloudinaryConfig.imageTransformation.width) {
					uploadOptions.width = cloudinaryConfig.imageTransformation.width
				}
				if (cloudinaryConfig.imageTransformation.height) {
					uploadOptions.height = cloudinaryConfig.imageTransformation.height
				}
			} else {
				uploadOptions.quality = cloudinaryConfig.videoTransformation.quality
				uploadOptions.format = cloudinaryConfig.videoTransformation.format
			}

			return new Promise((resolve, reject) => {
				const uploadStream = cloudinary.uploader.upload_stream(
					uploadOptions,
					(
						error: UploadApiErrorResponse | undefined,
						result: UploadApiResponse | undefined
					) => {
						if (error) {
							logger.error("Cloudinary upload failed", {
								key,
								contentType,
								error: error.message,
							})
							reject(new Error(`Upload failed: ${error.message}`))
						} else if (result) {
							resolve(result.secure_url || result.url)
						} else {
							reject(new Error("Upload failed: No result returned"))
						}
					}
				)

				stream.pipe(uploadStream)
			})
		} catch (error) {
			logger.error("Failed to upload file to Cloudinary", {
				key,
				contentType,
				error: error instanceof Error ? error.message : "Unknown error",
			})
			throw new Error("Failed to upload file")
		}
	}
}
