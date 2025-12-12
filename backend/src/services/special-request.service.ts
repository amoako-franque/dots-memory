import prisma from "../config/db"
import { CreateSpecialRequestInput } from "../validators/special-request.validator"
import logger from "../utils/logger"
import { sanitizeText } from "../utils/sanitize"

export class SpecialRequestService {
	async createRequest(
		data: CreateSpecialRequestInput,
		userId?: string,
		ipAddress?: string,
		userAgent?: string
	) {
		try {
			// Calculate price if not provided
			let calculatedPrice = data.calculatedPrice

			if (!calculatedPrice) {
				calculatedPrice = this.calculatePrice(data)
			}

			const request = await prisma.specialRequest.create({
				data: {
					userId: userId || null,
					userEmail: sanitizeText(data.email),
					firstName: sanitizeText(data.firstName),
					lastName: sanitizeText(data.lastName),
					organizationName: data.organizationName
						? sanitizeText(data.organizationName)
						: null,
					phoneNumber: data.phoneNumber
						? sanitizeText(data.phoneNumber)
						: null,
					requestType: data.requestType,
					eventName: data.eventName ? sanitizeText(data.eventName) : null,
					eventDate: data.eventDate ? new Date(data.eventDate) : null,
					eventLocation: data.eventLocation
						? sanitizeText(data.eventLocation)
						: null,
					expectedAttendees: data.expectedAttendees || null,
					expectedAlbums: data.expectedAlbums || null,
					expectedPhotos: data.expectedPhotos || null,
					expectedVideos: data.expectedVideos || null,
					storageNeededGB: data.storageNeededGB || null,
					customFeatures: data.customFeatures || [],
					specialRequirements: data.specialRequirements
						? sanitizeText(data.specialRequirements)
						: null,
					budget: data.budget || null,
					calculatedPrice: calculatedPrice || null,
					ipAddress: ipAddress || null,
					userAgent: userAgent || null,
					status: "PENDING",
				},
			})

			logger.info("Special request created", {
				requestId: request.id,
				userId,
				requestType: data.requestType,
				calculatedPrice,
			})

			return request
		} catch (error) {
			logger.error("Failed to create special request", {
				error: error instanceof Error ? error.message : "Unknown error",
				userId,
			})
			throw error
		}
	}

	private calculatePrice(data: CreateSpecialRequestInput): number {
		let basePrice = 0

		// Base price by request type
		if (data.requestType === "EVENT") {
			basePrice = 99.99
		} else if (data.requestType === "PROJECT") {
			basePrice = 149.99
		} else if (data.requestType === "ENTERPRISE") {
			basePrice = 299.99
		}

		// Add pricing for albums
		const albumPrice = (data.expectedAlbums || 0) * 9.99

		// Add pricing for storage (per GB)
		const storagePrice = (data.storageNeededGB || 0) * 2.99

		// Add pricing for attendees (bulk discount)
		let attendeePrice = 0
		if (data.expectedAttendees) {
			if (data.expectedAttendees <= 100) {
				attendeePrice = data.expectedAttendees * 0.5
			} else if (data.expectedAttendees <= 500) {
				attendeePrice = 100 * 0.5 + (data.expectedAttendees - 100) * 0.3
			} else {
				attendeePrice =
					100 * 0.5 + 400 * 0.3 + (data.expectedAttendees - 500) * 0.2
			}
		}

		// Add pricing for photos (bulk discount)
		let photoPrice = 0
		if (data.expectedPhotos) {
			if (data.expectedPhotos <= 1000) {
				photoPrice = data.expectedPhotos * 0.05
			} else if (data.expectedPhotos <= 5000) {
				photoPrice = 1000 * 0.05 + (data.expectedPhotos - 1000) * 0.03
			} else {
				photoPrice =
					1000 * 0.05 + 4000 * 0.03 + (data.expectedPhotos - 5000) * 0.02
			}
		}

		// Add pricing for videos
		const videoPrice = (data.expectedVideos || 0) * 2.99

		const totalPrice =
			basePrice + albumPrice + storagePrice + attendeePrice + photoPrice + videoPrice

		return Math.round(totalPrice * 100) / 100 // Round to 2 decimal places
	}

	async getRequests(userId?: string, status?: string) {
		const where: any = {}

		if (userId) {
			where.userId = userId
		}

		if (status) {
			where.status = status
		}

		return await prisma.specialRequest.findMany({
			where,
			orderBy: {
				createdAt: "desc",
			},
		})
	}

	async getRequest(id: string, userId?: string) {
		const where: any = {
			id,
		}

		if (userId) {
			where.userId = userId
		}

		return await prisma.specialRequest.findFirst({
			where,
		})
	}
}

export default new SpecialRequestService()

