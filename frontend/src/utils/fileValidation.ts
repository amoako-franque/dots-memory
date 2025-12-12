/**
 * Allowed image MIME types
 */
const ALLOWED_IMAGE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/bmp",
	"image/svg+xml",
]

/**
 * Allowed video MIME types
 */
const ALLOWED_VIDEO_TYPES = [
	"video/mp4",
	"video/mpeg",
	"video/quicktime",
	"video/x-msvideo",
	"video/webm",
	"video/x-ms-wmv",
]

/**
 * Allowed file extensions
 */
const ALLOWED_IMAGE_EXTENSIONS = [
	".jpg",
	".jpeg",
	".png",
	".gif",
	".webp",
	".bmp",
	".svg",
]
const ALLOWED_VIDEO_EXTENSIONS = [
	".mp4",
	".mpeg",
	".mov",
	".avi",
	".webm",
	".wmv",
]

export interface FileValidationResult {
	valid: boolean
	error?: string
	isVideo: boolean
	isImage: boolean
}

/**
 * Validate file type
 */
export const validateFileType = (file: File): FileValidationResult => {
	const fileType = file.type.toLowerCase()
	const fileName = file.name.toLowerCase()
	const extension = fileName.substring(fileName.lastIndexOf("."))

	const isImage =
		ALLOWED_IMAGE_TYPES.includes(fileType) ||
		ALLOWED_IMAGE_EXTENSIONS.includes(extension)

	const isVideo =
		ALLOWED_VIDEO_TYPES.includes(fileType) ||
		ALLOWED_VIDEO_EXTENSIONS.includes(extension)

	if (!isImage && !isVideo) {
		return {
			valid: false,
			error: `File type not allowed. Allowed types: Images (${ALLOWED_IMAGE_EXTENSIONS.join(
				", "
			)}) or Videos (${ALLOWED_VIDEO_EXTENSIONS.join(", ")})`,
			isImage: false,
			isVideo: false,
		}
	}

	return {
		valid: true,
		isImage,
		isVideo,
	}
}

/**
 * Validate file size
 */
export const validateFileSize = (
	file: File,
	maxSizeMB: number = 100
): { valid: boolean; error?: string } => {
	const fileSizeMB = file.size / (1024 * 1024)

	if (fileSizeMB > maxSizeMB) {
		return {
			valid: false,
			error: `File size (${fileSizeMB.toFixed(
				2
			)}MB) exceeds maximum allowed size of ${maxSizeMB}MB`,
		}
	}

	return { valid: true }
}

/**
 * Validate file name (prevent path traversal and dangerous characters)
 */
export const validateFileName = (
	fileName: string
): { valid: boolean; error?: string; sanitized?: string } => {
	if (
		fileName.includes("..") ||
		fileName.includes("/") ||
		fileName.includes("\\")
	) {
		return {
			valid: false,
			error: "Invalid file name. File name cannot contain path separators.",
		}
	}

	const sanitized = fileName
		.split("")
		.filter((char) => {
			const code = char.charCodeAt(0)
			return (
				!(code >= 0 && code <= 31) &&
				!["<", ">", ":", '"', "|", "?", "*"].includes(char)
			)
		})
		.join("")

	if (sanitized.length === 0) {
		return {
			valid: false,
			error: "Invalid file name.",
		}
	}

	if (sanitized.length > 255) {
		return {
			valid: false,
			error: "File name is too long (maximum 255 characters).",
		}
	}

	return {
		valid: true,
		sanitized: sanitized !== fileName ? sanitized : undefined,
	}
}

/**
 * Comprehensive file validation
 */
export const validateFile = (
	file: File,
	maxSizeMB: number = 100,
	allowVideos: boolean = true
): FileValidationResult & {
	sizeError?: string
	nameError?: string
	sanitizedName?: string
} => {
	const nameValidation = validateFileName(file.name)
	if (!nameValidation.valid) {
		return {
			valid: false,
			error: nameValidation.error,
			isImage: false,
			isVideo: false,
			nameError: nameValidation.error,
		}
	}

	const typeValidation = validateFileType(file)
	if (!typeValidation.valid) {
		return {
			...typeValidation,
			sanitizedName: nameValidation.sanitized,
		}
	}

	if (typeValidation.isVideo && !allowVideos) {
		return {
			valid: false,
			error: "Videos are not allowed for this album",
			isImage: false,
			isVideo: true,
			sanitizedName: nameValidation.sanitized,
		}
	}

	const sizeValidation = validateFileSize(file, maxSizeMB)
	if (!sizeValidation.valid) {
		return {
			valid: false,
			error: sizeValidation.error,
			isImage: typeValidation.isImage,
			isVideo: typeValidation.isVideo,
			sizeError: sizeValidation.error,
			sanitizedName: nameValidation.sanitized,
		}
	}

	return {
		valid: true,
		isImage: typeValidation.isImage,
		isVideo: typeValidation.isVideo,
		sanitizedName: nameValidation.sanitized,
	}
}
