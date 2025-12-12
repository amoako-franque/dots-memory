import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "supersecret"
const ACCESS_TOKEN_EXPIRES_IN = "15m"
const REFRESH_TOKEN_EXPIRES_IN = "7d"

export interface TokenPayload {
	userId: string
	email: string
	role: string
}

export const generateTokens = (payload: TokenPayload) => {
	const accessToken = jwt.sign(payload, JWT_SECRET, {
		expiresIn: ACCESS_TOKEN_EXPIRES_IN,
	})

	const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
		expiresIn: REFRESH_TOKEN_EXPIRES_IN,
	})

	return { accessToken, refreshToken }
}

export const verifyToken = (token: string): TokenPayload => {
	return jwt.verify(token, JWT_SECRET) as TokenPayload
}

export const verifyAccessToken = verifyToken

export const verifyRefreshToken = (token: string): TokenPayload => {
	return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload
}

/**
 * Decode token without verification to check expiration
 * Returns the decoded payload and expiration time
 */
export const decodeToken = (
	token: string
): { payload: TokenPayload; exp: number } | null => {
	try {
		const decoded = jwt.decode(token, { complete: true })
		if (!decoded || typeof decoded === "string") {
			return null
		}
		return {
			payload: decoded.payload as TokenPayload,
			exp: (decoded.payload as any).exp,
		}
	} catch {
		return null
	}
}

/**
 * Check if token expires within the specified minutes
 */
export const isTokenExpiringSoon = (
	token: string,
	minutes: number = 1
): boolean => {
	const decoded = decodeToken(token)
	if (!decoded) return true

	const expirationTime = decoded.exp * 1000
	const now = Date.now()
	const minutesInMs = minutes * 60 * 1000

	return expirationTime - now < minutesInMs
}
