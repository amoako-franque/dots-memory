/**
 * Utility functions for JWT token management
 */

/**
 * Decode JWT token without verification
 * Returns the decoded payload or null if invalid
 */
export const decodeToken = (
	token: string
): { exp: number; userId: string; email: string; role: string } | null => {
	try {
		const base64Url = token.split(".")[1]
		if (!base64Url) return null

		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split("")
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join("")
		)

		return JSON.parse(jsonPayload)
	} catch {
		return null
	}
}

/**
 * Get access token from cookies
 */
export const getAccessToken = (): string | null => {
	/* TODO: Try to get from cookie (if accessible) - HttpOnly cookies can't be accessed via JavaScript. We'll need to check expiration via API or store a non-httpOnly copy. For now, we'll rely on the backend to handle token refresh */
	return null
}

/**
 * Check if token expires within the specified minutes
 */
export const isTokenExpiringSoon = (
	token: string,
	minutes: number = 1
): boolean => {
	const decoded = decodeToken(token)
	if (!decoded || !decoded.exp) return true

	const expirationTime = decoded.exp * 1000 // Convert to milliseconds
	const now = Date.now()
	const minutesInMs = minutes * 60 * 1000

	return expirationTime - now < minutesInMs
}

/**
 * Get time until token expires in milliseconds
 */
export const getTimeUntilExpiration = (token: string): number | null => {
	const decoded = decodeToken(token)
	if (!decoded || !decoded.exp) return null

	const expirationTime = decoded.exp * 1000
	const now = Date.now()
	return expirationTime - now
}
