import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger';

export interface CloudinaryConfig {
	enabled: boolean;
	cloudName: string;
	apiKey: string;
	apiSecret: string;
	secure: boolean;
	folder: string;
	maxFileSizeMB: number;
	allowedMimeTypes: string[];
	allowedExtensions: string[];
	imageTransformation: {
		quality: string;
		format: string;
		width?: number;
		height?: number;
	};
	videoTransformation: {
		quality: string;
		format: string;
		resourceType: string;
	};
	uploadPreset?: string;
	signatureAlgorithm: string;
}

const getCloudinaryConfig = (): CloudinaryConfig => {
	const enabled = process.env.CLOUDINARY_ENABLED === 'true';

	if (!enabled) {
		return {
			enabled: false,
			cloudName: '',
			apiKey: '',
			apiSecret: '',
			secure: true,
			folder: '',
			maxFileSizeMB: 0,
			allowedMimeTypes: [],
			allowedExtensions: [],
			imageTransformation: {
				quality: 'auto',
				format: 'auto',
			},
			videoTransformation: {
				quality: 'auto',
				format: 'auto',
				resourceType: 'video',
			},
			signatureAlgorithm: 'sha1',
		};
	}

	const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
	const missingVars = requiredVars.filter(varName => !process.env[varName]);

	if (missingVars.length > 0) {
		logger.warn('Cloudinary is enabled but missing required environment variables', {
			missing: missingVars,
		});
	}

	const allowedMimeTypes = process.env.CLOUDINARY_ALLOWED_MIME_TYPES
		? process.env.CLOUDINARY_ALLOWED_MIME_TYPES.split(',').map(t => t.trim())
		: [
				'image/jpeg',
				'image/png',
				'image/gif',
				'image/webp',
				'image/svg+xml',
				'video/mp4',
				'video/webm',
				'video/quicktime',
				'video/x-msvideo',
			];

	const allowedExtensions = process.env.CLOUDINARY_ALLOWED_EXTENSIONS
		? process.env.CLOUDINARY_ALLOWED_EXTENSIONS.split(',').map(e => e.trim().toLowerCase())
		: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm', '.mov', '.avi'];

	return {
		enabled,
		cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
		apiKey: process.env.CLOUDINARY_API_KEY || '',
		apiSecret: process.env.CLOUDINARY_API_SECRET || '',
		secure: process.env.CLOUDINARY_SECURE !== 'false',
		folder: process.env.CLOUDINARY_FOLDER || 'memory',
		maxFileSizeMB: parseInt(process.env.CLOUDINARY_MAX_FILE_SIZE_MB || '100', 10),
		allowedMimeTypes,
		allowedExtensions,
		imageTransformation: {
			quality: process.env.CLOUDINARY_IMAGE_QUALITY || 'auto',
			format: process.env.CLOUDINARY_IMAGE_FORMAT || 'auto',
			width: process.env.CLOUDINARY_IMAGE_WIDTH
				? parseInt(process.env.CLOUDINARY_IMAGE_WIDTH, 10)
				: undefined,
			height: process.env.CLOUDINARY_IMAGE_HEIGHT
				? parseInt(process.env.CLOUDINARY_IMAGE_HEIGHT, 10)
				: undefined,
		},
		videoTransformation: {
			quality: process.env.CLOUDINARY_VIDEO_QUALITY || 'auto',
			format: process.env.CLOUDINARY_VIDEO_FORMAT || 'auto',
			resourceType: 'video',
		},
		uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
		signatureAlgorithm: process.env.CLOUDINARY_SIGNATURE_ALGORITHM || 'sha1',
	};
};

export const cloudinaryConfig = getCloudinaryConfig();

export const initializeCloudinary = (): void => {
	if (!cloudinaryConfig.enabled) {
		return;
	}

	cloudinary.config({
		cloud_name: cloudinaryConfig.cloudName,
		api_key: cloudinaryConfig.apiKey,
		api_secret: cloudinaryConfig.apiSecret,
		secure: cloudinaryConfig.secure,
	});

	logger.info('Cloudinary initialized', {
		cloudName: cloudinaryConfig.cloudName,
		folder: cloudinaryConfig.folder,
	});
};

