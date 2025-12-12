import crypto from "crypto"

/**
 * Generate a hash to identify a unique viewer
 * Combines IP address, User Agent, and optional session ID
 */
export function generateViewerHash(
	ipAddress: string | undefined,
	userAgent: string | undefined,
	sessionId?: string | null
): string {
	const components = [
		ipAddress || "unknown",
		userAgent || "unknown",
		sessionId || "",
	].join("|")

	return crypto
		.createHash("sha256")
		.update(components)
		.digest("hex")
		.substring(0, 64)
}

/**
 * Get the start of the day for a given date (for deduplication)
 */
export function getStartOfDay(date: Date = new Date()): Date {
	const start = new Date(date)
	start.setHours(0, 0, 0, 0)
	return start
}
