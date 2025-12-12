import { Request, Response, NextFunction } from "express"
import {
	verifyAccessToken,
	TokenPayload,
	isTokenExpiringSoon,
} from "../utils/jwt"
import { AuthenticationError } from "../utils/errors"
import logger from "../utils/logger"
import authService from "../services/auth.service"

const REFRESH_TOKEN_COOKIE_NAME = "mem_rf_token"
const REFRESH_TOKEN_COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "strict" as const,
	maxAge: 7 * 24 * 60 * 60 * 1000,
	path: "/",
}

const ACCESS_TOKEN_COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "strict" as const,
	maxAge: 15 * 60 * 1000,
	path: "/",
}

declare global {
	namespace Express {
		interface Request {
			user?: TokenPayload
			correlationId?: string
		}
	}
}

const ACCESS_TOKEN_COOKIE_NAME = "mem_acc_token"

export const authenticate = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		let token: string | undefined
		const authHeader = req.headers.authorization

		if (authHeader && authHeader.startsWith("Bearer ")) {
			token = authHeader.substring(7)
		} else {
			token = req.cookies[ACCESS_TOKEN_COOKIE_NAME]
		}

		if (!token) {
			throw new AuthenticationError("No token provided")
		}

		try {
			const payload = verifyAccessToken(token)
			req.user = payload

			if (isTokenExpiringSoon(token, 1)) {
				const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME]

				if (refreshToken) {
					try {
						logger.debug("Auto-refreshing token", {
							userId: payload.userId,
							correlationId: req.correlationId,
						})

						const newTokens = await authService.refresh(refreshToken)

						res.cookie(
							ACCESS_TOKEN_COOKIE_NAME,
							newTokens.accessToken,
							ACCESS_TOKEN_COOKIE_OPTIONS
						)
						res.cookie(
							REFRESH_TOKEN_COOKIE_NAME,
							newTokens.refreshToken,
							REFRESH_TOKEN_COOKIE_OPTIONS
						)

						logger.debug("Token auto-refreshed", {
							userId: payload.userId,
							correlationId: req.correlationId,
						})
					} catch (refreshError) {
						logger.warn("Failed to auto-refresh token", {
							userId: payload.userId,
							correlationId: req.correlationId,
							error:
								refreshError instanceof Error
									? refreshError.message
									: "Unknown error",
						})
					}
				}
			}

			logger.debug("User authenticated", {
				userId: payload.userId,
				correlationId: req.correlationId,
			})

			next()
		} catch (error) {
			if (error instanceof Error) {
				if (error.name === "TokenExpiredError") {
					logger.warn("Access token expired", {
						correlationId: req.correlationId,
						path: req.path,
						method: req.method,
					})

					throw new AuthenticationError(
						"Token expired. Please login again.",
						"TOKEN_EXPIRED"
					)
				}
				if (error.name === "JsonWebTokenError") {
					logger.warn("Invalid JWT token", {
						correlationId: req.correlationId,
						path: req.path,
						method: req.method,
					})
					throw new AuthenticationError("Invalid token", "INVALID_TOKEN")
				}
			}
			logger.error("Authentication error", {
				correlationId: req.correlationId,
				error: error instanceof Error ? error.message : "Unknown error",
				path: req.path,
				method: req.method,
			})
			throw new AuthenticationError("Authentication failed")
		}
	} catch (error) {
		next(error)
	}
}
