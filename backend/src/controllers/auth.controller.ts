import { Request, Response, NextFunction } from "express"
import authService from "../services/auth.service"
import passwordResetService from "../services/password-reset.service"
import { ValidationError } from "../utils/errors"
import { registerSchema, loginSchema } from "../validators/auth.validator"

const REFRESH_TOKEN_COOKIE_NAME = "mem_rf_token"
const ACCESS_TOKEN_COOKIE_NAME = "mem_acc_token"
const COOKIE_OPTIONS = {
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

class AuthController {
	async register(req: Request, res: Response, next: NextFunction) {
		try {
			const validated = registerSchema.parse(req.body)
			const result = await authService.register(validated)

			const { passwordHash, ...userWithoutPassword } = result.user

			res.cookie(
				ACCESS_TOKEN_COOKIE_NAME,
				result.tokens.accessToken,
				ACCESS_TOKEN_COOKIE_OPTIONS
			)
			res.cookie(
				REFRESH_TOKEN_COOKIE_NAME,
				result.tokens.refreshToken,
				COOKIE_OPTIONS
			)

			res.status(201).json({
				success: true,
				data: {
					user: userWithoutPassword,
				},
			})
		} catch (error: any) {
			if (error.message === "EMAIL_IN_USE") {
				return res.status(409).json({
					success: false,
					error: {
						message: "This email is already registered",
						code: "EMAIL_IN_USE",
					},
				})
			}
			if (error.message === "EMAIL_BLOCKED") {
				return res.status(403).json({
					success: false,
					error: {
						message: "This email cannot be used to create a new account",
						code: "EMAIL_BLOCKED",
					},
				})
			}
			next(error)
		}
	}

	async login(req: Request, res: Response, next: NextFunction) {
		try {
			const validated = loginSchema.parse(req.body)
			const result = await authService.login(validated)

			const { passwordHash, ...userWithoutPassword } = result.user

			res.cookie(
				ACCESS_TOKEN_COOKIE_NAME,
				result.tokens.accessToken,
				ACCESS_TOKEN_COOKIE_OPTIONS
			)
			res.cookie(
				REFRESH_TOKEN_COOKIE_NAME,
				result.tokens.refreshToken,
				COOKIE_OPTIONS
			)

			res.json({
				success: true,
				data: {
					user: userWithoutPassword,
				},
			})
		} catch (error) {
			next(error)
		}
	}

	async refresh(req: Request, res: Response, next: NextFunction) {
		try {
			const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME]

			if (!refreshToken) {
				throw new ValidationError("Refresh token not found")
			}

			const result = await authService.refresh(refreshToken)

			res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS)

			res.cookie(
				ACCESS_TOKEN_COOKIE_NAME,
				result.accessToken,
				ACCESS_TOKEN_COOKIE_OPTIONS
			)

			res.json({
				success: true,
			})
		} catch (error) {
			next(error)
		}
	}

	async logout(req: Request, res: Response, next: NextFunction) {
		try {
			const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME]

			if (refreshToken) {
				await authService.logout(refreshToken)
			}

			res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				path: "/",
			})

			res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				path: "/",
			})

			res.json({
				success: true,
				data: { message: "Logged out successfully" },
			})
		} catch (error) {
			next(error)
		}
	}

	async forgotPassword(req: Request, res: Response, next: NextFunction) {
		try {
			const { email } = req.body

			if (!email) {
				throw new ValidationError("Email is required")
			}

			await passwordResetService.requestReset(email)

			res.json({
				success: true,
				data: {
					message: "If the email exists, a password reset link has been sent",
				},
			})
		} catch (error) {
			next(error)
		}
	}

	async resetPassword(req: Request, res: Response, next: NextFunction) {
		try {
			const { token, password } = req.body

			if (!token || !password) {
				throw new ValidationError("Token and password are required")
			}

			if (password.length < 8) {
				throw new ValidationError("Password must be at least 8 characters")
			}

			await passwordResetService.resetPassword(token, password)

			res.json({
				success: true,
				data: {
					message: "Password reset successful",
				},
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new AuthController()
