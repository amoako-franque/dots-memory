import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import { sanitizeText, sanitizeFileName } from "../utils/sanitize"

export const securityHeaders = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	res.setHeader("X-Frame-Options", "DENY")

	res.setHeader("X-Content-Type-Options", "nosniff")

	res.setHeader("X-XSS-Protection", "1; mode=block")

	res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")

	res.setHeader(
		"Permissions-Policy",
		"geolocation=(), microphone=(), camera=()"
	)

	res.setHeader(
		"Content-Security-Policy",
		"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
	)

	next()
}

export const sanitizeInput = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const sanitizeObject = (obj: any): any => {
		if (typeof obj === "string") {
			return sanitizeText(obj)
		}
		if (Array.isArray(obj)) {
			return obj.map((item) => sanitizeObject(item))
		}
		if (typeof obj === "object" && obj !== null) {
			const sanitized: any = {}
			for (const key in obj) {
				if (
					key === "fileName" ||
					(key === "name" && typeof obj[key] === "string")
				) {
					sanitized[key] = sanitizeFileName(obj[key])
				} else {
					sanitized[key] = sanitizeObject(obj[key])
				}
			}
			return sanitized
		}
		return obj
	}

	if (req.body) {
		req.body = sanitizeObject(req.body)
	}
	if (req.query) {
		req.query = sanitizeObject(req.query)
	}
	if (req.params) {
		req.params = sanitizeObject(req.params)
	}

	next()
}

export const detectSuspiciousActivity = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const suspiciousPatterns = [
		/(\.\.|\/etc\/|\/proc\/|\/sys\/)/i, // Path traversal
		/(union.*select|insert.*into|drop.*table)/i, // SQL injection
		/(<script|javascript:|onerror=|onload=)/i, // XSS
		/(\.\.\\|\.\.\/)/g, // Directory traversal
	]

	const checkString = (str: string): boolean => {
		return suspiciousPatterns.some((pattern) => pattern.test(str))
	}

	const checkObject = (obj: any): boolean => {
		if (typeof obj === "string") {
			return checkString(obj)
		}
		if (typeof obj === "object" && obj !== null) {
			return Object.values(obj).some(checkObject)
		}
		return false
	}

	const isSuspicious =
		checkObject(req.body) ||
		checkObject(req.query) ||
		checkObject(req.params) ||
		checkString(req.url)

	if (isSuspicious) {
		logger.warn("Suspicious activity detected", {
			ip: req.ip,
			url: req.url,
			method: req.method,
			userAgent: req.get("user-agent"),
			correlationId: req.correlationId,
		})
	}

	next()
}
