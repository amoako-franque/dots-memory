import { StorageProvider } from "./storage.provider"
import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { s3Config, getS3Client } from "../../config/s3.config"
import logger from "../../utils/logger"
import FileValidator from "../../utils/file-validator"

export class S3StorageProvider implements StorageProvider {
	private client: S3Client | null

	constructor() {
		this.client = getS3Client()
		if (!this.client && s3Config.enabled) {
			logger.warn("S3 client initialization failed")
		}
	}

	async getUploadUrl(key: string, contentType: string): Promise<string> {
		if (!s3Config.enabled || !this.client) {
			throw new Error("S3 is not enabled or client is not initialized")
		}

		const validation = FileValidator.validateMimeType(
			contentType,
			s3Config.allowedMimeTypes
		)
		if (!validation.valid) {
			throw new Error(validation.error || "Invalid MIME type")
		}

		try {
			const command = new PutObjectCommand({
				Bucket: s3Config.bucket,
				Key: key,
				ContentType: contentType,
				...(s3Config.encryption.enabled && {
					ServerSideEncryption: s3Config.encryption.algorithm || "AES256",
				}),
			})

			const url = await getSignedUrl(this.client, command, {
				expiresIn: s3Config.presignedUrlExpiration,
			})

			return url
		} catch (error) {
			logger.error("Failed to generate S3 upload URL", {
				key,
				contentType,
				error: error instanceof Error ? error.message : "Unknown error",
			})
			throw new Error("Failed to generate upload URL")
		}
	}

	async getDownloadUrl(key: string): Promise<string> {
		if (!s3Config.enabled || !this.client) {
			throw new Error("S3 is not enabled or client is not initialized")
		}

		if (s3Config.cdnUrl) {
			return `${s3Config.cdnUrl}/${key}`
		}

		return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`
	}

	async getPresignedDownloadUrl(
		key: string,
		expiresIn?: number
	): Promise<string> {
		if (!s3Config.enabled || !this.client) {
			throw new Error("S3 is not enabled or client is not initialized")
		}

		try {
			const command = new GetObjectCommand({
				Bucket: s3Config.bucket,
				Key: key,
			})

			const url = await getSignedUrl(this.client, command, {
				expiresIn: expiresIn || s3Config.presignedUrlExpiration,
			})

			return url
		} catch (error) {
			logger.error("Failed to generate S3 presigned URL", {
				key,
				error: error instanceof Error ? error.message : "Unknown error",
			})
			throw new Error("Failed to generate presigned URL")
		}
	}

	async deleteFile(key: string): Promise<void> {
		if (!s3Config.enabled || !this.client) {
			throw new Error("S3 is not enabled or client is not initialized")
		}

		try {
			const command = new DeleteObjectCommand({
				Bucket: s3Config.bucket,
				Key: key,
			})

			await this.client.send(command)
			logger.info("File deleted from S3", { key })
		} catch (error) {
			logger.error("Failed to delete file from S3", {
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
		if (!s3Config.enabled || !this.client) {
			throw new Error("S3 is not enabled or client is not initialized")
		}

		const validation = FileValidator.validateMimeType(
			contentType,
			s3Config.allowedMimeTypes
		)
		if (!validation.valid) {
			throw new Error(validation.error || "Invalid MIME type")
		}

		try {
			const command = new PutObjectCommand({
				Bucket: s3Config.bucket,
				Key: key,
				Body: buffer,
				ContentType: contentType,
				Metadata: metadata,
				...(s3Config.encryption.enabled && {
					ServerSideEncryption: s3Config.encryption.algorithm || "AES256",
				}),
			})

			await this.client.send(command)
			return await this.getDownloadUrl(key)
		} catch (error) {
			logger.error("Failed to upload file to S3", {
				key,
				contentType,
				error: error instanceof Error ? error.message : "Unknown error",
			})
			throw new Error("Failed to upload file")
		}
	}
}
