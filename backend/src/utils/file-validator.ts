import { z } from 'zod';
import path from 'path';
import logger from './logger';

export interface FileValidationResult {
	valid: boolean;
	error?: string;
	code?: string;
}

export interface FileValidationOptions {
	maxSizeBytes: number;
	allowedMimeTypes: string[];
	allowedExtensions: string[];
	requireImageSanitization?: boolean;
}

const ALLOWED_IMAGE_MIME_TYPES = [
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml',
];

const ALLOWED_VIDEO_MIME_TYPES = [
	'video/mp4',
	'video/webm',
	'video/quicktime',
	'video/x-msvideo',
	'video/x-matroska',
];

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

const DANGEROUS_EXTENSIONS = [
	'.exe',
	'.bat',
	'.cmd',
	'.com',
	'.pif',
	'.scr',
	'.vbs',
	'.js',
	'.jar',
	'.app',
	'.deb',
	'.pkg',
	'.dmg',
	'.sh',
	'.php',
	'.asp',
	'.aspx',
	'.jsp',
];

const DANGEROUS_MIME_TYPES = [
	'application/x-executable',
	'application/x-msdownload',
	'application/x-sh',
	'application/x-shellscript',
	'application/javascript',
	'application/x-javascript',
	'text/javascript',
];

export class FileValidator {
	static validateFileName(fileName: string): FileValidationResult {
		if (!fileName || fileName.trim().length === 0) {
			return {
				valid: false,
				error: 'File name is required',
				code: 'INVALID_FILE_NAME',
			};
		}

		if (fileName.length > 255) {
			return {
				valid: false,
				error: 'File name is too long (max 255 characters)',
				code: 'FILE_NAME_TOO_LONG',
			};
		}

		const sanitized = this.sanitizeFileName(fileName);
		if (sanitized !== fileName) {
			return {
				valid: false,
				error: 'File name contains invalid characters',
				code: 'INVALID_FILE_NAME_CHARS',
			};
		}

		const ext = path.extname(fileName).toLowerCase();
		if (DANGEROUS_EXTENSIONS.includes(ext)) {
			return {
				valid: false,
				error: 'File type is not allowed for security reasons',
				code: 'DANGEROUS_FILE_TYPE',
			};
		}

		return { valid: true };
	}

	static validateFileSize(fileSize: number, maxSizeBytes: number): FileValidationResult {
		if (fileSize <= 0) {
			return {
				valid: false,
				error: 'File size must be greater than 0',
				code: 'INVALID_FILE_SIZE',
			};
		}

		if (fileSize > maxSizeBytes) {
			const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
			const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
			return {
				valid: false,
				error: `File size (${fileSizeMB} MB) exceeds maximum allowed size (${maxSizeMB} MB)`,
				code: 'FILE_SIZE_EXCEEDED',
			};
		}

		return { valid: true };
	}

	static validateMimeType(mimeType: string, allowedMimeTypes: string[]): FileValidationResult {
		if (!mimeType || mimeType.trim().length === 0) {
			return {
				valid: false,
				error: 'MIME type is required',
				code: 'MISSING_MIME_TYPE',
			};
		}

		if (DANGEROUS_MIME_TYPES.includes(mimeType.toLowerCase())) {
			return {
				valid: false,
				error: 'MIME type is not allowed for security reasons',
				code: 'DANGEROUS_MIME_TYPE',
			};
		}

		if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
			return {
				valid: false,
				error: `MIME type '${mimeType}' is not allowed`,
				code: 'INVALID_MIME_TYPE',
			};
		}

		return { valid: true };
	}

	static validateFileExtension(fileName: string, allowedExtensions: string[]): FileValidationResult {
		const ext = path.extname(fileName).toLowerCase();

		if (!ext) {
			return {
				valid: false,
				error: 'File must have an extension',
				code: 'MISSING_EXTENSION',
			};
		}

		if (DANGEROUS_EXTENSIONS.includes(ext)) {
			return {
				valid: false,
				error: 'File extension is not allowed for security reasons',
				code: 'DANGEROUS_EXTENSION',
			};
		}

		if (!allowedExtensions.includes(ext)) {
			return {
				valid: false,
				error: `File extension '${ext}' is not allowed`,
				code: 'INVALID_EXTENSION',
			};
		}

		return { valid: true };
	}

	static validateFile(
		fileName: string,
		fileSize: number,
		mimeType: string,
		options: FileValidationOptions
	): FileValidationResult {
		const fileNameValidation = this.validateFileName(fileName);
		if (!fileNameValidation.valid) {
			return fileNameValidation;
		}

		const fileSizeValidation = this.validateFileSize(fileSize, options.maxSizeBytes);
		if (!fileSizeValidation.valid) {
			return fileSizeValidation;
		}

		const mimeTypeValidation = this.validateMimeType(mimeType, options.allowedMimeTypes);
		if (!mimeTypeValidation.valid) {
			return mimeTypeValidation;
		}

		const extensionValidation = this.validateFileExtension(fileName, options.allowedExtensions);
		if (!extensionValidation.valid) {
			return extensionValidation;
		}

		const ext = path.extname(fileName).toLowerCase();
		const isImage = ALLOWED_IMAGE_EXTENSIONS.includes(ext);
		const isVideo = ALLOWED_VIDEO_EXTENSIONS.includes(ext);

		if (!isImage && !isVideo) {
			return {
				valid: false,
				error: 'File must be an image or video',
				code: 'INVALID_FILE_TYPE',
			};
		}

		if (isImage && !ALLOWED_IMAGE_MIME_TYPES.includes(mimeType.toLowerCase())) {
			return {
				valid: false,
				error: 'MIME type does not match file extension',
				code: 'MIME_TYPE_MISMATCH',
			};
		}

		if (isVideo && !ALLOWED_VIDEO_MIME_TYPES.includes(mimeType.toLowerCase())) {
			return {
				valid: false,
				error: 'MIME type does not match file extension',
				code: 'MIME_TYPE_MISMATCH',
			};
		}

		return { valid: true };
	}

	static sanitizeFileName(fileName: string): string {
		return fileName
			.replace(/[^a-zA-Z0-9._-]/g, '_')
			.replace(/_{2,}/g, '_')
			.replace(/^_+|_+$/g, '')
			.substring(0, 255);
	}

	static isImage(mimeType: string): boolean {
		return ALLOWED_IMAGE_MIME_TYPES.includes(mimeType.toLowerCase());
	}

	static isVideo(mimeType: string): boolean {
		return ALLOWED_VIDEO_MIME_TYPES.includes(mimeType.toLowerCase());
	}
}

export default FileValidator;

