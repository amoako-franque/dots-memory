import winston from "winston"
import DailyRotateFile from "winston-daily-rotate-file"
import path from "path"

const logDir = path.join(process.cwd(), "logs")

const levels = {
	error: 0,
	warn: 1,
	info: 2,
	http: 3,
	debug: 4,
}

const colors = {
	error: "red",
	warn: "yellow",
	info: "green",
	http: "magenta",
	debug: "white",
}

winston.addColors(colors)

const sanitizeData = winston.format((info) => {
	if (info.body || info.query || info.params) {
		const sanitized = { ...info }

		const sensitiveFields = [
			"password",
			"passwordHash",
			"token",
			"accessToken",
			"refreshToken",
			"authorization",
			"apiKey",
			"secret",
			"creditCard",
			"cvv",
		]

		const sanitizeObject = (obj: any): any => {
			if (!obj || typeof obj !== "object") return obj

			const sanitized = Array.isArray(obj) ? [...obj] : { ...obj }

			for (const key in sanitized) {
				const lowerKey = key.toLowerCase()
				if (sensitiveFields.some((field) => lowerKey.includes(field))) {
					sanitized[key] = "[REDACTED]"
				} else if (typeof sanitized[key] === "object") {
					sanitized[key] = sanitizeObject(sanitized[key])
				}
			}

			return sanitized
		}

		if (sanitized.body) sanitized.body = sanitizeObject(sanitized.body)
		if (sanitized.query) sanitized.query = sanitizeObject(sanitized.query)
		if (sanitized.params) sanitized.params = sanitizeObject(sanitized.params)

		return sanitized
	}
	return info
})

const format = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
	winston.format.errors({ stack: true }),
	winston.format.splat(),
	sanitizeData(),
	winston.format.json()
)

const consoleFormat = winston.format.combine(
	winston.format.colorize({ all: true }),
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	winston.format.printf((info) => {
		const {
			timestamp,
			level,
			message,
			correlationId,
			method,
			url,
			statusCode,
			duration,
			errorName,
			errorMessage,
			errorCode,
			email,
			userId,
			...meta
		} = info

		let logMessage = `${timestamp} ${level}: ${message}`

		if (level.includes("error") || level.includes("warn")) {
			logMessage = `\n${"=".repeat(
				80
			)}\n${timestamp} ${level.toUpperCase()}: ${message}\n${"-".repeat(80)}`

			if (errorName || errorMessage) {
				logMessage += `\n  Error: ${errorName || "Unknown"}`
				if (errorMessage) {
					logMessage += ` - ${errorMessage}`
				}
			}

			if (errorCode) {
				logMessage += `\n  Code: ${errorCode}`
			}

			if (correlationId) {
				logMessage += `\n  Request ID: ${correlationId}`
			}

			if (method && url) {
				logMessage += `\n  ${method} ${url}`
				if (statusCode) {
					logMessage += ` → ${statusCode}`
				}
			}

			if (email) {
				logMessage += `\n  Email: ${email}`
			}
			if (userId) {
				logMessage += `\n  User ID: ${userId}`
			}

			if (meta.ip) {
				logMessage += `\n  IP: ${meta.ip}`
			}
			if (meta.userAgent) {
				logMessage += `\n  User-Agent: ${meta.userAgent}`
			}

			if (duration) {
				logMessage += `\n  Duration: ${duration}`
			}

			if (
				info.stack &&
				typeof info.stack === "string" &&
				level.includes("error")
			) {
				const stackStr = info.stack as string
				logMessage += `\n  Stack:\n${stackStr
					.split("\n")
					.map((line: string) => `    ${line}`)
					.join("\n")}`
			}

			logMessage += `\n${"=".repeat(80)}\n`
		} else {
			if (method && url) {
				logMessage = `${timestamp} ${level}: ${method} ${url}`

				if (statusCode) {
					logMessage += ` → ${statusCode}`
				}

				if (duration) {
					logMessage += ` (${duration})`
				}

				if (correlationId) {
					logMessage += ` [${(correlationId as string).substring(0, 8)}]`
				}

				if (userId) {
					logMessage += ` userId=${userId}`
				}
				if (meta.ip) {
					logMessage += ` ip=${meta.ip}`
				}

				const importantKeys = ["email", "albumId", "operation", "path"]
				const importantMeta = Object.keys(meta)
					.filter(
						(key) => importantKeys.includes(key) && meta[key] !== undefined
					)
					.map((key) => `${key}=${meta[key]}`)
					.join(" ")

				if (importantMeta) {
					logMessage += ` ${importantMeta}`
				}
			} else {
				if (correlationId) {
					logMessage += ` [${correlationId}]`
				}

				const importantKeys = ["userId", "email", "albumId", "operation"]
				const importantMeta = Object.keys(meta)
					.filter(
						(key) => importantKeys.includes(key) && meta[key] !== undefined
					)
					.map((key) => `${key}=${meta[key]}`)
					.join(" ")

				if (importantMeta) {
					logMessage += ` ${importantMeta}`
				}
			}
		}

		return logMessage
	})
)

const transports = [
	new winston.transports.Console({
		format: consoleFormat,
	}),

	new DailyRotateFile({
		filename: path.join(logDir, "combined-%DATE%.log"),
		datePattern: "YYYY-MM-DD",
		maxSize: "20m",
		maxFiles: "14d",
		format,
	}),

	new DailyRotateFile({
		level: "error",
		filename: path.join(logDir, "error-%DATE%.log"),
		datePattern: "YYYY-MM-DD",
		maxSize: "20m",
		maxFiles: "30d",
		format,
	}),

	new DailyRotateFile({
		level: "http",
		filename: path.join(logDir, "access-%DATE%.log"),
		datePattern: "YYYY-MM-DD",
		maxSize: "20m",
		maxFiles: "14d",
		format,
	}),

	new DailyRotateFile({
		level: "warn",
		filename: path.join(logDir, "performance-%DATE%.log"),
		datePattern: "YYYY-MM-DD",
		maxSize: "20m",
		maxFiles: "7d",
		format,
	}),
]

const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || "info",
	levels,
	format,
	transports,
	exitOnError: false,
	exceptionHandlers: [
		new DailyRotateFile({
			filename: path.join(logDir, "exceptions-%DATE%.log"),
			datePattern: "YYYY-MM-DD",
			maxSize: "20m",
			maxFiles: "30d",
			format,
		}),
	],
	rejectionHandlers: [
		new DailyRotateFile({
			filename: path.join(logDir, "rejections-%DATE%.log"),
			datePattern: "YYYY-MM-DD",
			maxSize: "20m",
			maxFiles: "30d",
			format,
		}),
	],
})

export const logRequest = (req: any, additionalData?: Record<string, any>) => {
	logger.info("Incoming request", {
		correlationId: req.correlationId,
		method: req.method,
		url: req.url,
		path: req.path,
		ip: req.ip,
		userAgent: req.get("user-agent"),
		userId: req.user?.id || req.user?.userId,
		...additionalData,
	})
}

export const logResponse = (
	req: any,
	res: any,
	additionalData?: Record<string, any>
) => {
	const duration = req.startTime ? Date.now() - req.startTime : undefined
	const isSlow = duration && duration > 1000 // Log as warning if > 1s

	const logData = {
		correlationId: req.correlationId,
		method: req.method,
		url: req.url,
		statusCode: res.statusCode,
		duration: duration ? `${duration}ms` : undefined,
		userId: req.user?.id || req.user?.userId,
		...additionalData,
	}

	if (isSlow) {
		logger.warn("Slow request detected", logData)
	} else {
		logger.info("Request completed", logData)
	}
}

export const logError = (error: Error, context?: Record<string, any>) => {
	logger.error("Error occurred", {
		errorName: error.name,
		errorMessage: error.message,
		stack: error.stack,
		...context,
	})
}

export const logPerformance = (
	operation: string,
	duration: number,
	context?: Record<string, any>
) => {
	const level = duration > 1000 ? "warn" : "info"
	logger[level]("Performance metric", {
		operation,
		duration: `${duration}ms`,
		...context,
	})
}

export const stream = {
	write: (message: string) => {
		logger.http(message.trim())
	},
}

export default logger
