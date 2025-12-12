import prisma from "../config/db"
import { CreateContactMessageInput } from "../validators/contact.validator"
import logger from "../utils/logger"
import { sanitizeText } from "../utils/sanitize"

export class ContactService {
	async createMessage(
		data: CreateContactMessageInput,
		userId?: string,
		userEmail?: string,
		ipAddress?: string,
		userAgent?: string
	) {
		try {
			const sanitizedTags = (data.tags || []).map((tag) => sanitizeText(tag))

			const message = await prisma.contactMessage.create({
				data: {
					title: sanitizeText(data.title),
					description: sanitizeText(data.description),
					tags: sanitizedTags,
					severity: data.severity,
					userId: userId || null,
					userEmail: userEmail || null,
					ipAddress: ipAddress || null,
					userAgent: userAgent || null,
					status: "NEW",
				},
			})

			logger.info("Contact message created", {
				messageId: message.id,
				userId,
				severity: data.severity,
			})

			return message
		} catch (error) {
			logger.error("Failed to create contact message", {
				error: error instanceof Error ? error.message : "Unknown error",
				userId,
			})
			throw error
		}
	}

	async getMessages(userId?: string, status?: string) {
		const where: any = {}

		if (userId) {
			where.userId = userId
		}

		if (status) {
			where.status = status
		}

		return prisma.contactMessage.findMany({
			where,
			orderBy: { createdAt: "desc" },
			include: {
				user: {
					select: {
						id: true,
						email: true,
						firstName: true,
						lastName: true,
					},
				},
			},
		})
	}

	async getMessageById(messageId: string, userId?: string) {
		const where: any = { id: messageId }

		if (userId) {
			where.userId = userId
		}

		return prisma.contactMessage.findFirst({
			where,
			include: {
				user: {
					select: {
						id: true,
						email: true,
						firstName: true,
						lastName: true,
					},
				},
			},
		})
	}

	async updateStatus(messageId: string, status: string, userId?: string) {
		const where: any = { id: messageId }

		if (userId) {
			where.userId = userId
		}

		return prisma.contactMessage.update({
			where,
			data: {
				status: status as any,
				resolvedAt:
					status === "RESOLVED" || status === "CLOSED" ? new Date() : null,
			},
		})
	}
}

export default new ContactService()
