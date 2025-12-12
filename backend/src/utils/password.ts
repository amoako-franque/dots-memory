import bcrypt from "bcrypt"
import crypto from "crypto"
import logger from "./logger"
import { InternalServerError } from "./errors"

const BCRYPT_ROUNDS = 12

function preHashPassword(password: string): string {
	return crypto.createHash("sha256").update(password).digest("hex")
}

export async function hashPassword(password: string): Promise<string> {
	try {
		const preHashed = preHashPassword(password)
		const hashed = await bcrypt.hash(preHashed, BCRYPT_ROUNDS)
		return hashed
	} catch (error) {
		logger.error("Password hashing failed", {
			error: error instanceof Error ? error.message : "Unknown error",
		})
		throw new InternalServerError(
			"Password hashing failed",
			"PASSWORD_HASH_FAILED",
			error as Error
		)
	}
}

export async function verifyPassword(
	password: string,
	hashedPassword: string
): Promise<boolean> {
	try {
		const preHashed = preHashPassword(password)

		const isValid = await bcrypt.compare(preHashed, hashedPassword)

		return isValid
	} catch (error) {
		logger.error("Password verification failed", { error })

		await bcrypt.compare("dummy", hashedPassword).catch(() => false)

		return false
	}
}

export function constantTimeCompare(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false
	}

	return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export function generateSecureToken(bytes: number = 32): string {
	return crypto.randomBytes(bytes).toString("hex")
}

export function hashSensitiveData(data: string): string {
	return crypto.createHash("sha256").update(data).digest("hex")
}

/**
 * Hash an access code for storage (using same method as passwords for security)
 */
export async function hashAccessCode(accessCode: string): Promise<string> {
	return hashPassword(accessCode)
}

/**
 * Verify an access code against a hash
 */
export async function verifyAccessCode(
	accessCode: string,
	hash: string
): Promise<boolean> {
	return verifyPassword(accessCode, hash)
}

/**
 * Encrypt access code for storage (reversible, so owner can view it)
 * Uses AES-256-GCM encryption
 */
export function encryptAccessCode(accessCode: string): string {
	const algorithm = "aes-256-gcm"
	const key = Buffer.from(
		process.env.ENCRYPTION_KEY ||
			process.env.JWT_SECRET ||
			"default-key-must-be-32-chars-long!!",
		"utf8"
	).slice(0, 32)
	const iv = crypto.randomBytes(16)

	const cipher = crypto.createCipheriv(algorithm, key, iv)

	let encrypted = cipher.update(accessCode, "utf8", "hex")
	encrypted += cipher.final("hex")

	const authTag = cipher.getAuthTag()

	return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`
}

/**
 * Decrypt access code for display to owner
 */
export function decryptAccessCode(encrypted: string): string {
	try {
		const algorithm = "aes-256-gcm"
		const key = Buffer.from(
			process.env.ENCRYPTION_KEY ||
				process.env.JWT_SECRET ||
				"default-key-must-be-32-chars-long!!",
			"utf8"
		).slice(0, 32)

		const parts = encrypted.split(":")
		if (parts.length !== 3) {
			throw new Error("Invalid encrypted format")
		}

		const iv = Buffer.from(parts[0], "hex")
		const authTag = Buffer.from(parts[1], "hex")
		const encryptedData = parts[2]

		const decipher = crypto.createDecipheriv(algorithm, key, iv)
		decipher.setAuthTag(authTag)

		let decrypted = decipher.update(encryptedData, "hex", "utf8")
		decrypted += decipher.final("utf8")

		return decrypted
	} catch (error) {
		logger.error("Access code decryption failed", { error })
		throw new InternalServerError(
			"Failed to decrypt access code",
			"DECRYPTION_FAILED"
		)
	}
}
