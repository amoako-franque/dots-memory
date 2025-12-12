import express from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import swaggerUi from "swagger-ui-express"
import swaggerSpec from "./config/swagger.config"
import authRoutes from "./routes/auth.routes"
import userRoutes from "./routes/user.routes"
import albumRoutes from "./routes/album.routes"
import mediaRoutes from "./routes/media.routes"
import healthRoutes from "./routes/health.routes"
import publicRoutes from "./routes/public.routes"
import subscriptionRoutes from "./routes/subscription.routes"
import contactRoutes from "./routes/contact.routes"
import specialRequestRoutes from "./routes/special-request.routes"
import webhookRoutes from "./routes/webhook.routes"
import { errorHandler } from "./middleware/error"
import { limiter, authLimiter } from "./middleware/rateLimit"
import { requestLogger } from "./middleware/requestLogger"
import {
	securityHeaders,
	sanitizeInput,
	detectSuspiciousActivity,
} from "./middleware/security"
import { seedSubscriptionPlans } from "./utils/seed-plans"
import { initializeCloudinary } from "./config/cloudinary.config"
import logger from "./utils/logger"

dotenv.config()
;(BigInt.prototype as any).toJSON = function () {
	return this.toString()
}

const app = express()
const PORT = process.env.PORT || 30700

const allowedOrigins = [
	process.env.FRONTEND_URL,
	"http://localhost:5173",
	"http://localhost:3000",
].filter((origin): origin is string => Boolean(origin))

logger.info("CORS allowed origins", { allowedOrigins })

const corsOptions = {
	origin: (
		origin: string | undefined,
		callback: (err: Error | null, origin?: string | boolean) => void
	) => {
		if (!origin) {
			const fallbackOrigin = "http://localhost:5173"
			if (
				process.env.NODE_ENV !== "production" &&
				allowedOrigins.includes(fallbackOrigin)
			) {
				callback(null, fallbackOrigin)
			} else {
				callback(new Error("Not allowed by CORS - no origin provided"))
			}
			return
		}

		if (allowedOrigins.includes(origin)) {
			callback(null, origin)
		} else {
			logger.warn("CORS blocked origin", { origin, allowedOrigins })
			callback(new Error(`Not allowed by CORS - origin: ${origin}`))
		}
	},
	credentials: true,
	optionsSuccessStatus: 200,
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	allowedHeaders: [
		"Content-Type",
		"Authorization",
		"X-Requested-With",
		"x-session-token",
		"X-Session-Token",
		"x-device-id",
		"X-Device-Id",
	],
	exposedHeaders: ["X-New-Access-Token", "X-Session-Token", "x-session-token"],
	preflightContinue: false,
}

app.use(
	helmet({
		crossOriginResourcePolicy: { policy: "cross-origin" },
	})
)

app.use(cors(corsOptions))
app.use(securityHeaders)
app.use(cookieParser())
app.use(express.json())
app.use(sanitizeInput)
app.use(detectSuspiciousActivity)
app.use(requestLogger)
app.use(limiter)

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
	customCss: ".swagger-ui .topbar { display: none }",
	customSiteTitle: "Memory API Documentation",
}))

// Swagger JSON endpoint
app.get("/api-docs.json", (req, res) => {
	res.setHeader("Content-Type", "application/json")
	res.send(swaggerSpec)
})

app.use(healthRoutes)
app.use("/api/v1/public", publicRoutes)
app.use("/api/v1/auth", authLimiter, authRoutes)
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/albums", albumRoutes)
app.use("/api/v1/media", mediaRoutes)
app.use("/api/v1/subscriptions", subscriptionRoutes)
app.use("/api/v1/contact", contactRoutes)
app.use("/api/v1/special-request", specialRequestRoutes)
app.use("/api/v1/webhooks", webhookRoutes)

app.use("/uploads", express.static("uploads"))

app.use(errorHandler)

initializeCloudinary()

seedSubscriptionPlans().catch((error) => {
	logger.error("Failed to seed subscription plans", { error })
})

app.listen(PORT, () => {
	logger.info(`🚀 Server running on port ${PORT}`)
	logger.info(`📝 Environment: ${process.env.NODE_ENV || "development"}`)
	logger.info(`🔗 Health check: http://localhost:${PORT}/health`)
	logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`)
})

process.on("unhandledRejection", (reason: Error) => {
	if (
		reason?.message?.includes("EPIPE") &&
		reason?.stack?.includes("ts-node-dev")
	) {
		return
	}

	logger.error("Unhandled Rejection", {
		message: reason.message,
		stack: reason.stack,
	})
	process.exit(1)
})

process.on("uncaughtException", (error: Error) => {
	if (
		error?.message?.includes("EPIPE") &&
		error?.stack?.includes("ts-node-dev")
	) {
		return
	}

	logger.error("Uncaught Exception", {
		message: error.message,
		stack: error.stack,
	})
	process.exit(1)
})
