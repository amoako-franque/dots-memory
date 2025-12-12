import swaggerJsdoc from "swagger-jsdoc"
import { readFileSync } from "fs"
import { join } from "path"

const packageJson = JSON.parse(
	readFileSync(join(__dirname, "../../package.json"), "utf-8")
)

const options: swaggerJsdoc.Options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Memory API Documentation",
			version: packageJson.version || "1.0.0",
			description:
				"Comprehensive API documentation for the Memory collaborative media sharing platform. This API provides endpoints for user authentication, album management, media uploads, subscriptions, and more.",
			contact: {
				name: "Memory API Support",
				email: process.env.SUPPORT_EMAIL || "support@memory.com",
			},
			license: {
				name: "ISC",
			},
		},
		servers: [
			{
				url: process.env.API_URL || "http://localhost:30700",
				description: "Development server",
			},
			{
				url: "https://api.memory.com",
				description: "Production server",
			},
		],
		components: {
			securitySchemes: {
				cookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: "mem_acc_token",
					description:
						"JWT access token stored in HTTP-only cookie. Automatically set on login/register.",
				},
				refreshToken: {
					type: "apiKey",
					in: "cookie",
					name: "mem_rf_token",
					description:
						"JWT refresh token stored in HTTP-only cookie. Used for token refresh.",
				},
			},
			schemas: {
				// Common Response Wrapper
				ApiResponse: {
					type: "object",
					properties: {
						success: {
							type: "boolean",
							description: "Indicates if the request was successful",
						},
						data: {
							type: "object",
							description: "Response data (present when success is true)",
						},
						error: {
							type: "object",
							description: "Error details (present when success is false)",
							properties: {
								message: {
									type: "string",
									description: "Human-readable error message",
								},
								code: {
									type: "string",
									description: "Error code identifier",
								},
								correlationId: {
									type: "string",
									description: "Unique identifier for error tracking",
								},
								details: {
									type: "object",
									description: "Additional error details (development only)",
								},
							},
						},
					},
				},
				// User Schemas
				User: {
					type: "object",
					properties: {
						id: {
							type: "string",
							format: "uuid",
							description: "Unique user identifier",
						},
						email: {
							type: "string",
							format: "email",
							description: "User email address",
						},
						firstName: {
							type: "string",
							nullable: true,
							description: "User's first name",
						},
						lastName: {
							type: "string",
							nullable: true,
							description: "User's last name",
						},
						role: {
							type: "string",
							enum: ["FREE", "PREMIUM", "PRO", "ADMIN"],
							description: "User role/tier",
						},
						trialStartedAt: {
							type: "string",
							format: "date-time",
							nullable: true,
							description: "Trial start date",
						},
						trialEndsAt: {
							type: "string",
							format: "date-time",
							nullable: true,
							description: "Trial end date",
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Account creation timestamp",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
						},
					},
				},
				RegisterRequest: {
					type: "object",
					required: ["email", "password"],
					properties: {
						email: {
							type: "string",
							format: "email",
							description: "Valid email address",
							example: "user@example.com",
						},
						password: {
							type: "string",
							minLength: 8,
							description: "Password (minimum 8 characters)",
							example: "password123",
						},
						firstName: {
							type: "string",
							description: "First name (optional)",
							example: "John",
						},
						lastName: {
							type: "string",
							description: "Last name (optional)",
							example: "Doe",
						},
					},
				},
				LoginRequest: {
					type: "object",
					required: ["email", "password"],
					properties: {
						email: {
							type: "string",
							format: "email",
							description: "User email address",
							example: "user@example.com",
						},
						password: {
							type: "string",
							description: "User password",
							example: "password123",
						},
					},
				},
				ForgotPasswordRequest: {
					type: "object",
					required: ["email"],
					properties: {
						email: {
							type: "string",
							format: "email",
							description: "Email address to send reset link",
							example: "user@example.com",
						},
					},
				},
				ResetPasswordRequest: {
					type: "object",
					required: ["token", "password"],
					properties: {
						token: {
							type: "string",
							description: "Password reset token from email",
							example: "abc123def456",
						},
						password: {
							type: "string",
							minLength: 8,
							description: "New password (minimum 8 characters)",
							example: "newpassword123",
						},
					},
				},
				UpdateProfileRequest: {
					type: "object",
					properties: {
						firstName: {
							type: "string",
							description: "Updated first name",
							example: "John",
						},
						lastName: {
							type: "string",
							description: "Updated last name",
							example: "Doe",
						},
					},
				},
				// Album Schemas
				AlbumSettings: {
					type: "object",
					properties: {
						privacy: {
							type: "string",
							enum: ["PRIVATE", "PUBLIC"],
							default: "PRIVATE",
							description: "Album privacy setting",
						},
						maxFileSizeMB: {
							type: "number",
							minimum: 1,
							maximum: 500,
							default: 100,
							description: "Maximum file size in MB",
						},
						maxVideoLengthSec: {
							type: "number",
							minimum: 30,
							maximum: 600,
							default: 300,
							description: "Maximum video length in seconds",
						},
						allowVideos: {
							type: "boolean",
							default: true,
							description: "Whether videos are allowed",
						},
						requireContributorName: {
							type: "boolean",
							default: false,
							description: "Require contributor name on upload",
						},
						accessCode: {
							type: "string",
							minLength: 4,
							maxLength: 20,
							description: "Access code for private albums (optional)",
						},
						uploadDescription: {
							type: "string",
							maxLength: 500,
							description: "Description shown to contributors (optional)",
						},
					},
				},
				CreateAlbumRequest: {
					type: "object",
					required: ["name"],
					properties: {
						name: {
							type: "string",
							minLength: 3,
							maxLength: 100,
							description: "Album name",
							example: "My Wedding Album",
						},
						description: {
							type: "string",
							maxLength: 500,
							description: "Album description",
							example: "Beautiful memories from our special day",
						},
						eventDate: {
							type: "string",
							format: "date-time",
							description: "Event date (ISO 8601)",
							example: "2024-06-15T14:00:00Z",
						},
						eventLocation: {
							type: "string",
							maxLength: 200,
							description: "Event location",
							example: "Central Park, NYC",
						},
						expiresAt: {
							type: "string",
							format: "date-time",
							nullable: true,
							description: "Album expiration date (optional)",
						},
						settings: {
							$ref: "#/components/schemas/AlbumSettings",
						},
					},
				},
				UpdateAlbumRequest: {
					type: "object",
					properties: {
						name: {
							type: "string",
							minLength: 3,
							maxLength: 100,
							description: "Updated album name",
						},
						description: {
							type: "string",
							maxLength: 500,
							description: "Updated album description",
						},
						eventDate: {
							type: "string",
							format: "date-time",
							description: "Updated event date",
						},
						eventLocation: {
							type: "string",
							maxLength: 200,
							description: "Updated event location",
						},
						expiresAt: {
							type: "string",
							format: "date-time",
							nullable: true,
							description: "Updated expiration date",
						},
						settings: {
							$ref: "#/components/schemas/AlbumSettings",
						},
					},
				},
				Album: {
					type: "object",
					properties: {
						id: {
							type: "string",
							format: "uuid",
							description: "Album identifier",
						},
						name: {
							type: "string",
							description: "Album name",
						},
						description: {
							type: "string",
							nullable: true,
							description: "Album description",
						},
						status: {
							type: "string",
							enum: ["ACTIVE", "ARCHIVED", "DELETED"],
							description: "Album status",
						},
						privacy: {
							type: "string",
							enum: ["PRIVATE", "PUBLIC"],
							description: "Privacy setting",
						},
						eventDate: {
							type: "string",
							format: "date-time",
							nullable: true,
							description: "Event date",
						},
						eventLocation: {
							type: "string",
							nullable: true,
							description: "Event location",
						},
						expiresAt: {
							type: "string",
							format: "date-time",
							nullable: true,
							description: "Expiration date",
						},
						ownerId: {
							type: "string",
							format: "uuid",
							description: "Owner user ID",
						},
						viewerHash: {
							type: "string",
							description: "Public viewer hash",
						},
						qrCodeUrl: {
							type: "string",
							nullable: true,
							description: "QR code URL",
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Creation timestamp",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
						},
					},
				},
				AccessCode: {
					type: "object",
					properties: {
						id: {
							type: "string",
							format: "uuid",
							description: "Access code identifier",
						},
						code: {
							type: "string",
							description: "Plain access code (only shown to owner)",
						},
						isBlacklisted: {
							type: "boolean",
							description: "Whether code is blacklisted",
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Creation timestamp",
						},
					},
				},
				// Media Schemas
				InitiateUploadRequest: {
					type: "object",
					required: ["albumId", "fileName", "fileType", "fileSize"],
					properties: {
						albumId: {
							type: "string",
							format: "uuid",
							description: "Album ID to upload to",
							example: "123e4567-e89b-12d3-a456-426614174000",
						},
						fileName: {
							type: "string",
							description: "Original file name",
							example: "photo.jpg",
						},
						fileType: {
							type: "string",
							pattern: "^(image|video)/",
							description: "MIME type (image/* or video/*)",
							example: "image/jpeg",
						},
						fileSize: {
							type: "number",
							minimum: 1,
							description: "File size in bytes",
							example: 1024000,
						},
						width: {
							type: "number",
							description: "Image width in pixels (optional)",
							example: 1920,
						},
						height: {
							type: "number",
							description: "Image height in pixels (optional)",
							example: 1080,
						},
						duration: {
							type: "number",
							description: "Video duration in seconds (optional)",
							example: 120,
						},
						sessionToken: {
							type: "string",
							description: "Session token for public uploads (optional)",
						},
					},
				},
				Media: {
					type: "object",
					properties: {
						id: {
							type: "string",
							format: "uuid",
							description: "Media identifier",
						},
						fileName: {
							type: "string",
							description: "Original file name",
						},
						fileType: {
							type: "string",
							description: "MIME type",
						},
						fileSize: {
							type: "number",
							description: "File size in bytes",
						},
						width: {
							type: "number",
							nullable: true,
							description: "Image width",
						},
						height: {
							type: "number",
							nullable: true,
							description: "Image height",
						},
						duration: {
							type: "number",
							nullable: true,
							description: "Video duration in seconds",
						},
						url: {
							type: "string",
							description: "Media URL",
						},
						thumbnailUrl: {
							type: "string",
							nullable: true,
							description: "Thumbnail URL",
						},
						caption: {
							type: "string",
							nullable: true,
							description: "Media caption",
						},
						status: {
							type: "string",
							enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
							description: "Upload status",
						},
						albumId: {
							type: "string",
							format: "uuid",
							description: "Album ID",
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Creation timestamp",
						},
					},
				},
				UpdateCaptionRequest: {
					type: "object",
					properties: {
						caption: {
							type: "string",
							maxLength: 500,
							description: "Media caption",
							example: "Beautiful sunset at the beach",
						},
					},
				},
				// Subscription Schemas
				SubscriptionPlan: {
					type: "object",
					properties: {
						id: {
							type: "string",
							format: "uuid",
							description: "Plan identifier",
						},
						tier: {
							type: "string",
							enum: ["FREE", "BASIC", "PRO", "PREMIUM"],
							description: "Subscription tier",
						},
						name: {
							type: "string",
							description: "Plan name",
						},
						description: {
							type: "string",
							description: "Plan description",
						},
						priceMonthly: {
							type: "string",
							description: "Monthly price (decimal string)",
							example: "9.99",
						},
						priceYearly: {
							type: "string",
							nullable: true,
							description: "Yearly price (decimal string)",
							example: "99.99",
						},
						storageLimitGB: {
							type: "number",
							description: "Storage limit in GB",
						},
						photoLimit: {
							type: "number",
							description: "Maximum number of photos",
						},
						videoLimit: {
							type: "number",
							description: "Maximum number of videos",
						},
						albumLimit: {
							type: "number",
							description: "Maximum number of albums",
						},
						features: {
							type: "array",
							items: {
								type: "string",
							},
							description: "Plan features",
						},
					},
				},
				Subscription: {
					type: "object",
					properties: {
						id: {
							type: "string",
							format: "uuid",
							description: "Subscription identifier",
						},
						status: {
							type: "string",
							enum: ["TRIAL", "ACTIVE", "CANCELLED", "EXPIRED"],
							description: "Subscription status",
						},
						startDate: {
							type: "string",
							format: "date-time",
							description: "Subscription start date",
						},
						endDate: {
							type: "string",
							format: "date-time",
							nullable: true,
							description: "Subscription end date",
						},
						nextBillingDate: {
							type: "string",
							format: "date-time",
							nullable: true,
							description: "Next billing date",
						},
						plan: {
							$ref: "#/components/schemas/SubscriptionPlan",
						},
					},
				},
				UsageStats: {
					type: "object",
					properties: {
						photoCount: {
							type: "number",
							description: "Number of photos uploaded",
						},
						videoCount: {
							type: "number",
							description: "Number of videos uploaded",
						},
						albumCount: {
							type: "number",
							description: "Number of albums created",
						},
						storageUsedBytes: {
							type: "number",
							description: "Storage used in bytes",
						},
						storageLimitBytes: {
							type: "number",
							description: "Storage limit in bytes",
						},
					},
				},
				CreateCheckoutSessionRequest: {
					type: "object",
					required: ["planId", "paymentProvider"],
					properties: {
						planId: {
							type: "string",
							format: "uuid",
							description: "Subscription plan ID",
						},
						paymentProvider: {
							type: "string",
							enum: ["STRIPE", "PAYSTACK"],
							description: "Payment provider",
						},
						successUrl: {
							type: "string",
							format: "uri",
							description: "Success redirect URL",
							example: "https://memory.com/subscription/success",
						},
						cancelUrl: {
							type: "string",
							format: "uri",
							description: "Cancel redirect URL",
							example: "https://memory.com/subscription/cancel",
						},
					},
				},
				SwitchPlanRequest: {
					type: "object",
					required: ["planId"],
					properties: {
						planId: {
							type: "string",
							format: "uuid",
							description: "New subscription plan ID",
						},
					},
				},
				// Contact Schemas
				CreateContactMessageRequest: {
					type: "object",
					required: ["title", "description"],
					properties: {
						title: {
							type: "string",
							minLength: 3,
							maxLength: 200,
							description: "Message title",
							example: "Feature Request",
						},
						description: {
							type: "string",
							minLength: 10,
							maxLength: 5000,
							description: "Message description",
							example: "I would like to request a new feature...",
						},
						tags: {
							type: "array",
							items: {
								type: "string",
							},
							description: "Message tags",
							example: ["feature", "request"],
						},
						severity: {
							type: "string",
							enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
							default: "MEDIUM",
							description: "Message severity",
						},
					},
				},
				// Special Request Schemas
				CreateSpecialRequestRequest: {
					type: "object",
					required: ["firstName", "lastName", "email", "requestType"],
					properties: {
						firstName: {
							type: "string",
							minLength: 2,
							maxLength: 100,
							description: "First name",
						},
						lastName: {
							type: "string",
							minLength: 2,
							maxLength: 100,
							description: "Last name",
						},
						email: {
							type: "string",
							format: "email",
							description: "Email address",
						},
						organizationName: {
							type: "string",
							maxLength: 200,
							description: "Organization name (optional)",
						},
						phoneNumber: {
							type: "string",
							maxLength: 20,
							description: "Phone number (optional)",
						},
						requestType: {
							type: "string",
							enum: ["EVENT", "PROJECT", "ENTERPRISE"],
							description: "Type of special request",
						},
						eventName: {
							type: "string",
							maxLength: 200,
							description: "Event name (optional)",
						},
						eventDate: {
							type: "string",
							description: "Event date (optional)",
						},
						eventLocation: {
							type: "string",
							maxLength: 200,
							description: "Event location (optional)",
						},
						expectedAttendees: {
							type: "number",
							minimum: 1,
							description: "Expected number of attendees (optional)",
						},
						expectedAlbums: {
							type: "number",
							minimum: 1,
							description: "Expected number of albums (optional)",
						},
						expectedPhotos: {
							type: "number",
							minimum: 0,
							description: "Expected number of photos (optional)",
						},
						expectedVideos: {
							type: "number",
							minimum: 0,
							description: "Expected number of videos (optional)",
						},
						storageNeededGB: {
							type: "number",
							minimum: 1,
							description: "Storage needed in GB (optional)",
						},
						customFeatures: {
							type: "array",
							items: {
								type: "string",
							},
							description: "Custom features requested (optional)",
						},
						specialRequirements: {
							type: "string",
							maxLength: 5000,
							description: "Special requirements (optional)",
						},
						budget: {
							type: "number",
							minimum: 0,
							description: "Budget (optional)",
						},
						calculatedPrice: {
							type: "number",
							minimum: 0,
							description: "Calculated price (optional)",
						},
					},
				},
				// Public Album Access
				VerifyAccessRequest: {
					type: "object",
					required: ["accessCode"],
					properties: {
						accessCode: {
							type: "string",
							minLength: 4,
							maxLength: 20,
							description: "Album access code",
							example: "ABC123",
						},
					},
				},
				// Reaction Schemas
				AddReactionRequest: {
					type: "object",
					required: ["emoji"],
					properties: {
						emoji: {
							type: "string",
							description: "Emoji reaction",
							example: "👍",
						},
						contributorName: {
							type: "string",
							description: "Contributor name (optional)",
							example: "John Doe",
						},
					},
				},
				Reaction: {
					type: "object",
					properties: {
						emoji: {
							type: "string",
							description: "Emoji",
						},
						count: {
							type: "number",
							description: "Number of reactions",
						},
						userReacted: {
							type: "boolean",
							description: "Whether current user reacted",
						},
					},
				},
				// Health Check
				HealthCheck: {
					type: "object",
					properties: {
						status: {
							type: "string",
							enum: ["ok", "degraded"],
							description: "Service status",
						},
						timestamp: {
							type: "string",
							format: "date-time",
							description: "Check timestamp",
						},
						service: {
							type: "string",
							description: "Service name",
						},
						uptime: {
							type: "number",
							description: "Uptime in seconds",
						},
						checks: {
							type: "object",
							properties: {
								database: {
									type: "string",
									enum: ["healthy", "unhealthy", "unknown"],
								},
								memory: {
									type: "string",
									enum: ["healthy", "warning", "unknown"],
								},
							},
						},
						version: {
							type: "string",
							description: "Service version",
						},
						environment: {
							type: "string",
							description: "Environment name",
						},
					},
				},
			},
		},
		tags: [
			{
				name: "Authentication",
				description: "User authentication and authorization endpoints",
			},
			{
				name: "Users",
				description: "User profile and account management",
			},
			{
				name: "Albums",
				description: "Album creation, management, and access control",
			},
			{
				name: "Media",
				description: "Media upload, management, and reactions",
			},
			{
				name: "Subscriptions",
				description: "Subscription plans, usage, and billing",
			},
			{
				name: "Public",
				description: "Public album access endpoints",
			},
			{
				name: "Contact",
				description: "Contact and support messages",
			},
			{
				name: "Special Requests",
				description: "Special event and enterprise requests",
			},
			{
				name: "Webhooks",
				description: "Payment provider webhook endpoints",
			},
			{
				name: "Health",
				description: "Health check and monitoring endpoints",
			},
		],
	},
	apis: [
		"./src/routes/*.ts",
		"./src/controllers/*.ts",
		"./src/docs/swagger.docs.ts",
	],
}

const swaggerSpec = swaggerJsdoc(options)

export default swaggerSpec

