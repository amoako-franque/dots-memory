import { PrismaClient, Prisma } from "@prisma/client"
import logger from "../utils/logger"

declare global {
	var __prisma: PrismaClient | undefined
}

function createClient() {
	const client = new PrismaClient({
		errorFormat: "pretty",
		log: [
			{ level: "query", emit: "event" },
			{ level: "warn", emit: "event" },
			{ level: "error", emit: "event" },
		],
	})

	if (process.env.NODE_ENV !== "production") {
		client.$on("query", (e: Prisma.QueryEvent) => {
			logger.debug("Prisma Query", {
				query: e.query,
				params: e.params,
				duration: `${e.duration}ms`,
			})
		})
	}

	client.$on("warn", (e: Prisma.LogEvent) => {
		logger.warn("Prisma Warning", { warning: e })
	})

	client.$on("error", (e: Prisma.LogEvent) => {
		const errorCode = (e as any)?.code || (e as any)?.meta?.code
		const errorMessage = e.message || ""

		const expectedErrors = ["P2002", "P2021"]
		if (expectedErrors.includes(errorCode)) return

		if (
			errorMessage.includes("Unique constraint failed") ||
			errorMessage.includes("Unique constraint") ||
			errorCode === "P2002"
		) {
			return
		}

		logger.error("Prisma Error", {
			message: e.message,
			target: (e as any)?.target,
			code: errorCode,
			meta: (e as any)?.meta,
			fullError: e,
		})

		if (e.message?.includes("connection") || e.message?.includes("closed")) {
			logger.warn("Database connection issue detected, auto-reconnecting...")
		}
	})

	return client
}

export const prisma = global.__prisma ?? (global.__prisma = createClient())

prisma
	.$connect()
	.then(() => logger.info("✅ Database connected successfully"))
	.catch((err) => {
		logger.error("❌ Database connection failed", { err })
		if (process.env.NODE_ENV === "production") process.exit(1)
	})

async function shutdown(reason: string) {
	logger.info(`Shutting down due to ${reason}...`)
	try {
		await prisma.$disconnect()
		logger.info("Database disconnected gracefully")
	} catch (err) {
		logger.error("Database disconnect error", { err })
	} finally {
		process.exit(0)
	}
}

process.removeAllListeners("SIGINT")
process.removeAllListeners("SIGTERM")

process.once("SIGINT", () => shutdown("SIGINT"))
process.once("SIGTERM", () => shutdown("SIGTERM"))

if (process.env.NODE_ENV !== "production") {
	process.removeAllListeners("uncaughtException")

	process.on("uncaughtException", (err) => {
		if (err.message?.includes("EPIPE") && err.stack?.includes("ts-node-dev")) {
			return
		}

		logger.error("Uncaught Exception", {
			message: err.message,
			stack: err.stack,
		})

		if (process.env.NODE_ENV === "production") {
			shutdown("uncaughtException")
		}
	})
}

export default prisma
