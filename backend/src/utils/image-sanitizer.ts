import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import logger from './logger';
import FileValidator from './file-validator';

export interface ImageSanitizationResult {
	success: boolean;
	filePath?: string;
	error?: string;
	metadata?: {
		width: number;
		height: number;
		format: string;
		size: number;
	};
}

export class ImageSanitizer {
	static async sanitizeImage(
		inputPath: string,
		outputPath?: string
	): Promise<ImageSanitizationResult> {
		try {
			if (!(await fs.pathExists(inputPath))) {
				return {
					success: false,
					error: 'Input file does not exist',
				};
			}

			const stats = await fs.stat(inputPath);
			if (stats.size === 0) {
				return {
					success: false,
					error: 'Input file is empty',
				};
			}

			const metadata = await sharp(inputPath).metadata();

			if (!metadata.format) {
				return {
					success: false,
					error: 'Unable to determine image format',
				};
			}

			const allowedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
			if (!allowedFormats.includes(metadata.format.toLowerCase())) {
				return {
					success: false,
					error: `Image format '${metadata.format}' is not allowed`,
				};
			}

			const output = outputPath || inputPath;
			await fs.ensureDir(path.dirname(output));

			const sanitizedImage = sharp(inputPath)
				.rotate()
				.normalize()
				.jpeg({ quality: 90, progressive: true })
				.toBuffer();

			const buffer = await sanitizedImage;
			await fs.writeFile(output, buffer);

			const sanitizedStats = await fs.stat(output);
			const sanitizedMetadata = await sharp(output).metadata();

			return {
				success: true,
				filePath: output,
				metadata: {
					width: sanitizedMetadata.width || 0,
					height: sanitizedMetadata.height || 0,
					format: sanitizedMetadata.format || 'jpeg',
					size: sanitizedStats.size,
				},
			};
		} catch (error) {
			logger.error('Image sanitization failed', {
				inputPath,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Image sanitization failed',
			};
		}
	}

	static async validateImageIntegrity(filePath: string): Promise<boolean> {
		try {
			if (!(await fs.pathExists(filePath))) {
				return false;
			}

			const metadata = await sharp(filePath).metadata();

			if (!metadata.width || !metadata.height || metadata.width <= 0 || metadata.height <= 0) {
				return false;
			}

			if (!metadata.format || !FileValidator.isImage(`image/${metadata.format}`)) {
				return false;
			}

			return true;
		} catch (error) {
			logger.error('Image integrity validation failed', {
				filePath,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return false;
		}
	}

	static async stripMetadata(filePath: string, outputPath?: string): Promise<boolean> {
		try {
			const output = outputPath || filePath;
			await fs.ensureDir(path.dirname(output));

			await sharp(filePath)
				.rotate()
				.jpeg({ quality: 90, progressive: true })
				.toFile(output);

			return true;
		} catch (error) {
			logger.error('Failed to strip image metadata', {
				filePath,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return false;
		}
	}
}

export default ImageSanitizer;

