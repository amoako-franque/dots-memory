import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3"
import logger from "../utils/logger"

export interface S3Config {
	enabled: boolean
	region: string
	bucket: string
	accessKeyId: string
	secretAccessKey: string
	endpoint?: string
	forcePathStyle?: boolean
	cdnUrl?: string
	maxFileSizeMB: number
	allowedMimeTypes: string[]
	allowedExtensions: string[]
	presignedUrlExpiration: number
	encryption: {
		enabled: boolean
		algorithm?: string
	}
	cors: {
		allowedOrigins: string[]
		allowedMethods: string[]
		allowedHeaders: string[]
		maxAgeSeconds: number
	}
}

const getS3Config = (): S3Config => {
	const enabled = process.env.S3_ENABLED === "true"

	if (!enabled) {
		return {
			enabled: false,
			region: "",
			bucket: "",
			accessKeyId: "",
			secretAccessKey: "",
			maxFileSizeMB: 0,
			allowedMimeTypes: [],
			allowedExtensions: [],
			presignedUrlExpiration: 3600,
			encryption: { enabled: false },
			cors: {
				allowedOrigins: [],
				allowedMethods: [],
				allowedHeaders: [],
				maxAgeSeconds: 3600,
			},
		}
	}

	const requiredVars = [
		"S3_REGION",
		"S3_BUCKET",
		"AWS_ACCESS_KEY_ID",
		"AWS_SECRET_ACCESS_KEY",
	]
	const missingVars = requiredVars.filter((varName) => !process.env[varName])

	if (missingVars.length > 0) {
		logger.warn("S3 is enabled but missing required environment variables", {
			missing: missingVars,
		})
	}

	const allowedMimeTypes = process.env.S3_ALLOWED_MIME_TYPES
		? process.env.S3_ALLOWED_MIME_TYPES.split(",").map((t) => t.trim())
		: [
				"image/jpeg",
				"image/png",
				"image/gif",
				"image/webp",
				"image/svg+xml",
				"video/mp4",
				"video/webm",
				"video/quicktime",
				"video/x-msvideo",
		  ]

	const allowedExtensions = process.env.S3_ALLOWED_EXTENSIONS
		? process.env.S3_ALLOWED_EXTENSIONS.split(",").map((e) =>
				e.trim().toLowerCase()
		  )
		: [
				".jpg",
				".jpeg",
				".png",
				".gif",
				".webp",
				".svg",
				".mp4",
				".webm",
				".mov",
				".avi",
		  ]

	return {
		enabled,
		region: process.env.S3_REGION || "us-east-1",
		bucket: process.env.S3_BUCKET || "",
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
		endpoint: process.env.S3_ENDPOINT,
		forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
		cdnUrl: process.env.S3_CDN_URL,
		maxFileSizeMB: parseInt(process.env.S3_MAX_FILE_SIZE_MB || "100", 10),
		allowedMimeTypes,
		allowedExtensions,
		presignedUrlExpiration: parseInt(
			process.env.S3_PRESIGNED_URL_EXPIRATION || "3600",
			10
		),
		encryption: {
			enabled: process.env.S3_ENCRYPTION_ENABLED === "true",
			algorithm: process.env.S3_ENCRYPTION_ALGORITHM || "AES256",
		},
		cors: {
			allowedOrigins: process.env.S3_CORS_ORIGINS
				? process.env.S3_CORS_ORIGINS.split(",").map((o) => o.trim())
				: ["*"],
			allowedMethods: process.env.S3_CORS_METHODS
				? process.env.S3_CORS_METHODS.split(",").map((m) => m.trim())
				: ["GET", "PUT", "POST", "DELETE", "HEAD"],
			allowedHeaders: process.env.S3_CORS_HEADERS
				? process.env.S3_CORS_HEADERS.split(",").map((h) => h.trim())
				: ["*"],
			maxAgeSeconds: parseInt(process.env.S3_CORS_MAX_AGE || "3600", 10),
		},
	}
}

export const s3Config = getS3Config()

export const getS3Client = (): S3Client | null => {
	if (!s3Config.enabled) {
		return null
	}

	const clientConfig: S3ClientConfig = {
		region: s3Config.region,
		credentials: {
			accessKeyId: s3Config.accessKeyId,
			secretAccessKey: s3Config.secretAccessKey,
		},
	}

	if (s3Config.endpoint) {
		clientConfig.endpoint = s3Config.endpoint
		clientConfig.forcePathStyle = s3Config.forcePathStyle ?? true
	}

	return new S3Client(clientConfig)
}
