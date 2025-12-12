import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/Card"
import { useNotifications } from "../../components/notifications/NotificationSystem"
import { Calendar, Users, Image, Video, HardDrive, DollarSign, Send, Calculator } from "lucide-react"
import api from "../../lib/api"
import { Link } from "react-router-dom"

const specialRequestSchema = z.object({
	firstName: z.string().min(2, "First name must be at least 2 characters"),
	lastName: z.string().min(2, "Last name must be at least 2 characters"),
	email: z.string().email("Invalid email address"),
	organizationName: z.string().optional(),
	phoneNumber: z.string().optional(),
	requestType: z.enum(["EVENT", "PROJECT", "ENTERPRISE"]),
	eventName: z.string().optional(),
	eventDate: z.string().optional(),
	eventLocation: z.string().optional(),
	expectedAttendees: z.number().min(1, "Expected attendees is required").optional(),
	expectedAlbums: z.number().min(1, "Expected albums is required").optional(),
	expectedPhotos: z.number().min(0).optional(),
	expectedVideos: z.number().min(0).optional(),
	storageNeededGB: z.number().min(1, "Storage needed is required").optional(),
	customFeatures: z.array(z.string()).optional(),
	specialRequirements: z.string().optional(),
	budget: z.number().min(0).optional(),
})

type SpecialRequestForm = z.infer<typeof specialRequestSchema>

export default function SpecialRequestPage() {
	const { showSuccess, showError } = useNotifications()
	const [error, setError] = useState<string | null>(null)
	const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)
	const [isCalculating, setIsCalculating] = useState(false)

	const {
		register,
		handleSubmit,
		control,
		watch,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<SpecialRequestForm>({
		resolver: zodResolver(specialRequestSchema),
		defaultValues: {
			requestType: "EVENT",
			expectedPhotos: 0,
			expectedVideos: 0,
		},
	})

	const requestType = watch("requestType")
	const expectedAlbums = watch("expectedAlbums")
	const expectedPhotos = watch("expectedPhotos")
	const expectedVideos = watch("expectedVideos")
	const storageNeededGB = watch("storageNeededGB")
	const expectedAttendees = watch("expectedAttendees")

	// Pricing calculation function
	const calculatePrice = () => {
		setIsCalculating(true)
		setError(null)

		try {
			// Get current form values
			const formData = {
				requestType: requestType || "EVENT",
				expectedAlbums: expectedAlbums || 0,
				expectedPhotos: expectedPhotos || 0,
				expectedVideos: expectedVideos || 0,
				storageNeededGB: storageNeededGB || 0,
				expectedAttendees: expectedAttendees || 0,
			}

			// Base pricing logic
			let basePrice = 0

			// Base price by request type
			if (formData.requestType === "EVENT") {
				basePrice = 99.99
			} else if (formData.requestType === "PROJECT") {
				basePrice = 149.99
			} else if (formData.requestType === "ENTERPRISE") {
				basePrice = 299.99
			}

			// Add pricing for albums
			const albumPrice = formData.expectedAlbums * 9.99

			// Add pricing for storage (per GB)
			const storagePrice = formData.storageNeededGB * 2.99

			// Add pricing for attendees (bulk discount)
			let attendeePrice = 0
			if (formData.expectedAttendees > 0) {
				if (formData.expectedAttendees <= 100) {
					attendeePrice = formData.expectedAttendees * 0.50
				} else if (formData.expectedAttendees <= 500) {
					attendeePrice = 100 * 0.50 + (formData.expectedAttendees - 100) * 0.30
				} else {
					attendeePrice = 100 * 0.50 + 400 * 0.30 + (formData.expectedAttendees - 500) * 0.20
				}
			}

			// Add pricing for photos (bulk discount)
			let photoPrice = 0
			if (formData.expectedPhotos > 0) {
				if (formData.expectedPhotos <= 1000) {
					photoPrice = formData.expectedPhotos * 0.05
				} else if (formData.expectedPhotos <= 5000) {
					photoPrice = 1000 * 0.05 + (formData.expectedPhotos - 1000) * 0.03
				} else {
					photoPrice = 1000 * 0.05 + 4000 * 0.03 + (formData.expectedPhotos - 5000) * 0.02
				}
			}

			// Add pricing for videos
			const videoPrice = formData.expectedVideos * 2.99

			const totalPrice = basePrice + albumPrice + storagePrice + attendeePrice + photoPrice + videoPrice

			setCalculatedPrice(Math.round(totalPrice * 100) / 100)
			showSuccess(`Estimated price calculated: $${(Math.round(totalPrice * 100) / 100).toFixed(2)}`)
		} catch (err: any) {
			const errorMessage = "Failed to calculate price. Please check your inputs."
			setError(errorMessage)
			showError(errorMessage)
		} finally {
			setIsCalculating(false)
		}
	}

	const onSubmit = async (data: SpecialRequestForm) => {
		try {
			setError(null)

			await api.post("/special-request", {
				...data,
				calculatedPrice: calculatedPrice,
			})

			showSuccess(
				"Thank you! Your special request has been submitted. We'll review it and get back to you within 24-48 hours."
			)
			reset()
			setCalculatedPrice(null)
		} catch (err: any) {
			const errorMessage =
				err.response?.data?.error?.message ||
				"Failed to submit request. Please try again."
			setError(errorMessage)
			showError(errorMessage)
		}
	}

	return (
		<>
			{/* Header */}
			<div className="bg-[#8B2E3C] text-white py-16">
				<div className="container mx-auto px-4 text-center">
					<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 mb-6">
						<Calculator className="h-10 w-10 text-white" />
					</div>
					<h1 className="text-4xl md:text-5xl font-bold mb-4">
						Custom Plan Request
					</h1>
					<p className="text-xl text-white/90 max-w-2xl mx-auto">
						Tell us about your event or project, and we'll create a custom plan
						with pricing tailored to your needs.
					</p>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto px-4 py-16">
				<div className="max-w-4xl mx-auto">
					<div className="grid md:grid-cols-2 gap-8 mb-8">
						<Card className="border-2 border-[#E8D4B8]">
							<CardContent className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-12 h-12 rounded-lg bg-[#D4E4F0] border-2 border-[#A8C5D9] flex items-center justify-center">
										<Calculator className="h-6 w-6 text-[#5A8BB0]" />
									</div>
									<h3 className="text-xl font-semibold text-[#8B7355]">
										Automatic Pricing
									</h3>
								</div>
								<p className="text-[#6B5A42]">
									Fill in your requirements and click "Calculate Price" to get
									an instant estimate for your custom plan.
								</p>
							</CardContent>
						</Card>

						<Card className="border-2 border-[#E8D4B8]">
							<CardContent className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-12 h-12 rounded-lg bg-[#D4E4F0] border-2 border-[#A8C5D9] flex items-center justify-center">
										<Send className="h-6 w-6 text-[#5A8BB0]" />
									</div>
									<h3 className="text-xl font-semibold text-[#8B7355]">
										Quick Response
									</h3>
								</div>
								<p className="text-[#6B5A42]">
									We'll review your request and respond within 24-48 hours with
									a detailed quote and plan.
								</p>
							</CardContent>
						</Card>
					</div>

					<Card className="border-2 border-[#E8D4B8] shadow-xl">
						<CardHeader>
							<CardTitle className="text-2xl text-[#8B7355] flex items-center gap-2">
								<Send className="h-6 w-6" />
								Request Custom Plan
							</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
								{/* Personal Information */}
								<div>
									<h3 className="text-lg font-semibold text-[#8B7355] mb-4">
										Contact Information
									</h3>
									<div className="grid md:grid-cols-2 gap-4">
										<Input
											id="firstName"
											label="First Name"
											placeholder="John"
											{...register("firstName")}
											error={errors.firstName?.message}
										/>
										<Input
											id="lastName"
											label="Last Name"
											placeholder="Doe"
											{...register("lastName")}
											error={errors.lastName?.message}
										/>
									</div>
									<div className="grid md:grid-cols-2 gap-4 mt-4">
										<Input
											id="email"
											label="Email"
											type="email"
											placeholder="john@example.com"
											{...register("email")}
											error={errors.email?.message}
										/>
										<Input
											id="phoneNumber"
											label="Phone Number (Optional)"
											placeholder="+1 (555) 123-4567"
											{...register("phoneNumber")}
											error={errors.phoneNumber?.message}
										/>
									</div>
									<div className="mt-4">
										<Input
											id="organizationName"
											label="Organization Name (Optional)"
											placeholder="Acme Events Inc."
											{...register("organizationName")}
											error={errors.organizationName?.message}
										/>
									</div>
								</div>

								{/* Request Type */}
								<div>
									<h3 className="text-lg font-semibold text-[#8B7355] mb-4">
										Request Details
									</h3>
									<Controller
										name="requestType"
										control={control}
										render={({ field }) => (
											<Select
												id="requestType"
												label="Request Type"
												value={field.value}
												onChange={field.onChange}
												onBlur={field.onBlur}
												options={[
													{
														value: "EVENT",
														label: "Event Organizer - Weddings, Conferences, Parties",
													},
													{
														value: "PROJECT",
														label: "Project Manager - Team Collaboration, Client Projects",
													},
													{
														value: "ENTERPRISE",
														label: "Enterprise - Large Scale, Multiple Events",
													},
												]}
												error={errors.requestType?.message}
											/>
										)}
									/>

									{requestType === "EVENT" && (
										<>
											<div className="grid md:grid-cols-2 gap-4 mt-4">
												<Input
													id="eventName"
													label="Event Name"
													placeholder="Summer Wedding 2024"
													{...register("eventName")}
													error={errors.eventName?.message}
												/>
												<Input
													id="eventDate"
													label="Event Date"
													type="date"
													{...register("eventDate")}
													error={errors.eventDate?.message}
												/>
											</div>
											<div className="mt-4">
												<Input
													id="eventLocation"
													label="Event Location"
													placeholder="New York, NY"
													{...register("eventLocation")}
													error={errors.eventLocation?.message}
												/>
											</div>
										</>
									)}
								</div>

								{/* Requirements */}
								<div>
									<h3 className="text-lg font-semibold text-[#8B7355] mb-4">
										Requirements
									</h3>
									<div className="grid md:grid-cols-2 gap-4">
										<Input
											id="expectedAttendees"
											label="Expected Attendees"
											type="number"
											placeholder="100"
											{...register("expectedAttendees", {
												valueAsNumber: true,
											})}
											error={errors.expectedAttendees?.message}
										/>
										<Input
											id="expectedAlbums"
											label="Expected Albums"
											type="number"
											placeholder="5"
											{...register("expectedAlbums", {
												valueAsNumber: true,
											})}
											error={errors.expectedAlbums?.message}
										/>
									</div>
									<div className="grid md:grid-cols-2 gap-4 mt-4">
										<Input
											id="expectedPhotos"
											label="Expected Photos"
											type="number"
											placeholder="1000"
											{...register("expectedPhotos", {
												valueAsNumber: true,
											})}
											error={errors.expectedPhotos?.message}
										/>
										<Input
											id="expectedVideos"
											label="Expected Videos"
											type="number"
											placeholder="50"
											{...register("expectedVideos", {
												valueAsNumber: true,
											})}
											error={errors.expectedVideos?.message}
										/>
									</div>
									<div className="mt-4">
										<Input
											id="storageNeededGB"
											label="Storage Needed (GB)"
											type="number"
											placeholder="50"
											{...register("storageNeededGB", {
												valueAsNumber: true,
											})}
											error={errors.storageNeededGB?.message}
										/>
									</div>
								</div>

								{/* Additional Information */}
								<div>
									<h3 className="text-lg font-semibold text-[#8B7355] mb-4">
										Additional Information
									</h3>
									<div className="space-y-2">
										<label
											htmlFor="specialRequirements"
											className="text-sm font-medium leading-none text-[#8B7355]">
											Special Requirements
										</label>
										<textarea
											id="specialRequirements"
											{...register("specialRequirements")}
											rows={6}
											className="flex w-full rounded-lg border-2 border-[#E8D4B8] bg-[#FDF8F3] px-4 py-2.5 text-sm text-[#8B7355] placeholder:text-[#A68F75] focus:outline-none focus:ring-2 focus:ring-[#8B2E3C] focus:border-[#8B2E3C] transition-all duration-200 shadow-sm resize-none"
											placeholder="Tell us about any special features, branding requirements, or custom needs..."
										/>
									</div>
									<div className="mt-4">
										<Input
											id="budget"
											label="Budget (Optional)"
											type="number"
											placeholder="5000"
											{...register("budget", {
												valueAsNumber: true,
											})}
											error={errors.budget?.message}
										/>
									</div>
								</div>

								{/* Price Calculation */}
								<div className="bg-[#F5E8EA] border-2 border-[#D9A0A8] rounded-lg p-6">
									<div className="flex items-center justify-between mb-4">
										<div>
											<h3 className="text-lg font-semibold text-[#8B2E3C] flex items-center gap-2">
												<DollarSign className="h-5 w-5" />
												Estimated Price
											</h3>
											<p className="text-sm text-[#6B5A42] mt-1">
												Click calculate to get an instant estimate
											</p>
										</div>
										<Button
											type="button"
											onClick={calculatePrice}
											disabled={isCalculating}
											className="bg-[#8B2E3C] hover:bg-[#6B1F2D] text-white">
											{isCalculating ? "Calculating..." : "Calculate Price"}
										</Button>
									</div>
									{calculatedPrice !== null && (
										<div className="mt-4 p-4 bg-white rounded-lg border-2 border-[#8B2E3C]">
											<div className="text-3xl font-bold text-[#8B2E3C]">
												${calculatedPrice.toFixed(2)}
											</div>
											<p className="text-sm text-[#6B5A42] mt-2">
												This is an estimated price. Final pricing will be confirmed
												after review.
											</p>
										</div>
									)}
								</div>

								{error && (
									<div className="rounded-lg bg-[#F5E8EA] border-2 border-[#D9A0A8] p-3">
										<p className="text-sm text-[#8B2E3C] font-medium">
											{error}
										</p>
									</div>
								)}

								<Button
									type="submit"
									className="w-full"
									isLoading={isSubmitting}>
									<Send className="mr-2 h-4 w-4" />
									Submit Request
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	)
}

