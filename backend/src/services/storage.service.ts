import { StorageProvider } from "./storage/storage.provider"
import { LocalStorageProvider } from "./storage/local.provider"
import { S3StorageProvider } from "./storage/s3.provider"
import { CloudinaryStorageProvider } from "./storage/cloudinary.provider"
import { s3Config } from "../config/s3.config"
import { cloudinaryConfig } from "../config/cloudinary.config"
import logger from "../utils/logger"

class StorageService {
	private provider: StorageProvider

	constructor() {
		if (cloudinaryConfig.enabled) {
			this.provider = new CloudinaryStorageProvider()
			logger.info("Using Cloudinary storage provider")
		} else if (s3Config.enabled) {
			this.provider = new S3StorageProvider()
			logger.info("Using S3 storage provider")
		} else {
			this.provider = new LocalStorageProvider()
			logger.info("Using local storage provider")
		}
	}

	getUploadUrl(key: string, contentType: string): Promise<string> {
		return this.provider.getUploadUrl(key, contentType)
	}

	getDownloadUrl(key: string): Promise<string> {
		return this.provider.getDownloadUrl(key)
	}

	deleteFile(key: string): Promise<void> {
		return this.provider.deleteFile(key)
	}

	async uploadFile(
		buffer: Buffer,
		key: string,
		contentType: string,
		metadata?: Record<string, string>
	): Promise<string> {
		if (this.provider instanceof S3StorageProvider) {
			return this.provider.uploadFile(buffer, key, contentType, metadata)
		}
		if (this.provider instanceof CloudinaryStorageProvider) {
			return this.provider.uploadFile(buffer, key, contentType, metadata)
		}
		throw new Error("Direct file upload not supported for local storage")
	}

	getProviderType(): "s3" | "cloudinary" | "local" {
		if (this.provider instanceof CloudinaryStorageProvider) {
			return "cloudinary"
		}
		if (this.provider instanceof S3StorageProvider) {
			return "s3"
		}
		return "local"
	}
}

export default new StorageService()
