import DOMPurify from "dompurify"

/**
 * Sanitize HTML string to prevent XSS attacks
 */
export const sanitizeHtml = (dirty: string): string => {
	return DOMPurify.sanitize(dirty, {
		ALLOWED_TAGS: [],
		ALLOWED_ATTR: [],
	})
}

/**
 * Sanitize text input (removes HTML tags and dangerous characters)
 */
export const sanitizeText = (text: string): string => {
	if (!text) return ""
	return text.replace(/<[^>]*>/g, "").trim()
}

/**
 * Sanitize user input for display (allows safe HTML)
 */
export const sanitizeForDisplay = (dirty: string): string => {
	return DOMPurify.sanitize(dirty, {
		ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
		ALLOWED_ATTR: [],
	})
}
