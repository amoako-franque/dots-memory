import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"

const window = new JSDOM("").window
const purify = DOMPurify(window as any)

/**
 * Sanitize HTML string to prevent XSS attacks
 */
export const sanitizeHtml = (dirty: string): string => {
	if (!dirty) return ""
	return purify.sanitize(dirty, {
		ALLOWED_TAGS: [],
		ALLOWED_ATTR: [],
	})
}

/**
 * Sanitize text input (removes HTML tags and dangerous characters)
 */
export const sanitizeText = (text: string): string => {
	if (!text) return ""
	const sanitized = text.replace(/<[^>]*>/g, "").trim()
	return sanitized.replace(/[\x00-\x1F\x7F]/g, "")
}

/**
 * Sanitize user input for display (allows safe HTML)
 */
export const sanitizeForDisplay = (dirty: string): string => {
	if (!dirty) return ""
	return purify.sanitize(dirty, {
		ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
		ALLOWED_ATTR: [],
	})
}

/**
 * Sanitize file name (prevent path traversal)
 */
export const sanitizeFileName = (fileName: string): string => {
	if (!fileName) return ""
	let sanitized = fileName.replace(/\.\./g, "").replace(/[\/\\]/g, "")
	sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, "")
	if (sanitized.length > 255) {
		sanitized = sanitized.substring(0, 255)
	}
	return sanitized
}
