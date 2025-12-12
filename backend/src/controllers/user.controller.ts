import { Request, Response, NextFunction } from "express"
import prisma from "../config/db"
import { NotFoundError } from "../utils/errors"

class UserController {
	async getProfile(req: Request, res: Response, next: NextFunction) {
		try {
			const user = await prisma.user.findUnique({
				where: { id: req.user!.userId },
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
					role: true,
					status: true,
					emailVerified: true,
					storageUsedBytes: true,
					albumCount: true,
					createdAt: true,
					lastLoginAt: true,
				},
			})

			if (!user) {
				throw new NotFoundError("User")
			}

			res.json({
				success: true,
				data: { user },
			})
		} catch (error) {
			next(error)
		}
	}

	async updateProfile(req: Request, res: Response, next: NextFunction) {
		try {
			const { firstName, lastName } = req.body

			const user = await prisma.user.update({
				where: { id: req.user!.userId },
				data: {
					firstName,
					lastName,
				},
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
					role: true,
					status: true,
				},
			})

			res.json({
				success: true,
				data: { user },
			})
		} catch (error) {
			next(error)
		}
	}

	async getStats(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.userId

			const [user, albumCount, mediaCount, totalSize] = await Promise.all([
				prisma.user.findUnique({
					where: { id: userId },
					select: {
						storageUsedBytes: true,
						albumCount: true,
						createdAt: true,
					},
				}),
				prisma.album.count({
					where: { ownerId: userId, status: { not: "DELETED" } },
				}),
				prisma.media.count({
					where: {
						album: { ownerId: userId },
						status: "READY",
					},
				}),
				prisma.media.aggregate({
					where: {
						album: { ownerId: userId },
						status: "READY",
					},
					_sum: {
						fileSizeBytes: true,
					},
				}),
			])

			if (!user) {
				throw new NotFoundError("User")
			}

			const stats = {
				albumCount,
				mediaCount,
				storageUsedBytes: totalSize._sum.fileSizeBytes?.toString() || "0",
				storageUsedMB: Math.round(
					Number(totalSize._sum.fileSizeBytes || 0) / 1024 / 1024
				),
				memberSince: user.createdAt,
			}

			res.json({
				success: true,
				data: { stats },
			})
		} catch (error) {
			next(error)
		}
	}

	async deleteAccount(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.userId

			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: {
					email: true,
					trialEndsAt: true,
					trialStartedAt: true,
				},
			})

			if (!user) {
				throw new NotFoundError("User")
			}

			const trialEnded = user.trialEndsAt && new Date() > user.trialEndsAt

			/* TODO: Store email if trial ended (to prevent reuse) - This feature requires a DeletedUserEmail model in Prisma schema */

			await prisma.user.update({
				where: { id: userId },
				data: { status: "DELETED" },
			})

			await prisma.refreshToken.deleteMany({
				where: { userId },
			})

			res.json({
				success: true,
				data: { message: "Account deleted successfully" },
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new UserController()
