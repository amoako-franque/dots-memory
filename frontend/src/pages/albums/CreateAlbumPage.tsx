import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import {
	Calendar,
	MapPin,
	Video,
	User,
	Heart,
	FileText,
	Info,
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { Checkbox } from "../../components/ui/Checkbox"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/Card"
import { useNotifications } from "../../components/notifications/NotificationSystem"
import api from "../../lib/api"

const createAlbumSchema = z.object({
	name: z.string().min(1, "Album name is required"),
	description: z.string().max(1000).optional(),
	privacy: z.enum(["PUBLIC", "PRIVATE"]),
	eventDate: z.string().optional(),
	eventLocation: z.string().max(200).optional(),
	expiresAt: z.string().optional(),
	maxFileSizeMB: z.number().min(1).max(500).optional(),
	maxVideoLengthSec: z.number().min(30).max(600).optional(),
	allowVideos: z.boolean().optional(),
	requireContributorName: z.boolean().optional(),
	enableReactions: z.boolean().optional(),
	uploadDescription: z.string().max(1000).optional(),
	template: z.string().optional(),
})

type CreateAlbumForm = z.infer<typeof createAlbumSchema>

export default function CreateAlbumPage() {
	const { showSuccess, showError } = useNotifications()
	const [error, setError] = useState<string | null>(null)
	const navigate = useNavigate()

	const [selectedTemplate, setSelectedTemplate] = useState<string>("custom")
	const [showAdvanced, setShowAdvanced] = useState(false)

	const templates = [
		{ id: "custom", name: "Custom", icon: "🎨" },
		{ id: "wedding", name: "Wedding", icon: "💒" },
		{ id: "birthday", name: "Birthday", icon: "🎂" },
		{ id: "vacation", name: "Vacation", icon: "✈️" },
		{ id: "event", name: "Event", icon: "🎉" },
	]

	const applyTemplate = (templateId: string) => {
		setSelectedTemplate(templateId)
		const templateDefaults: Record<string, Partial<CreateAlbumForm>> = {
			wedding: {
				allowVideos: true,
				maxFileSizeMB: 25,
				maxVideoLengthSec: 300,
				requireContributorName: true,
				enableReactions: true,
			},
			birthday: {
				allowVideos: true,
				maxFileSizeMB: 15,
				maxVideoLengthSec: 60,
				requireContributorName: false,
				enableReactions: true,
			},
			vacation: {
				allowVideos: true,
				maxFileSizeMB: 50,
				maxVideoLengthSec: 120,
				requireContributorName: false,
				enableReactions: true,
			},
			event: {
				allowVideos: true,
				maxFileSizeMB: 25,
				maxVideoLengthSec: 180,
				requireContributorName: true,
				enableReactions: true,
			},
		}

		if (templateDefaults[templateId]) {
			Object.entries(templateDefaults[templateId]).forEach(([key, value]) => {
				setValue(key as keyof CreateAlbumForm, value as any)
			})
		}
	}

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setValue,
		watch,
	} = useForm<CreateAlbumForm>({
		resolver: zodResolver(createAlbumSchema),
		defaultValues: {
			privacy: "PUBLIC",
			allowVideos: false,
			requireContributorName: false,
			enableReactions: false,
			maxFileSizeMB: 10,
			maxVideoLengthSec: 60,
		},
	})

	const selectedPrivacy = watch("privacy")

	const onSubmit = async (
		data: CreateAlbumForm,
		e?: React.BaseSyntheticEvent
	) => {
		try {
			setError(null)

			/* TODO: Validate required fields and show toast with focus */
			if (!data.name || data.name.trim() === "") {
				showError("Album name is required")
				e?.target?.querySelector("#name")?.focus()
				return
			}

			const payload: any = {
				name: data.name,
				description: data.description || null,
				settings: {
					privacy: data.privacy,
					allowVideos: data.allowVideos ?? false,
					maxFileSizeMB: data.maxFileSizeMB ?? 10,
					maxVideoLengthSec: data.maxVideoLengthSec ?? 60,
					requireContributorName: data.requireContributorName ?? false,
				},
			}

			if (data.eventDate) {
				payload.eventDate = new Date(data.eventDate).toISOString()
			}
			if (data.eventLocation) {
				payload.eventLocation = data.eventLocation
			}
			if (data.expiresAt) {
				payload.expiresAt = new Date(data.expiresAt).toISOString()
			}
			if (data.uploadDescription) {
				payload.uploadDescription = data.uploadDescription
			}

			const response = await api.post("/albums", payload)

			const albumData = response.data?.data?.album
			const albumId = albumData?.id
			if (!albumId) {
				const errorMessage = "Failed to get album ID from response"
				setError(errorMessage)
				showError(errorMessage)
				return
			}

			if (albumData?.privacy === "PRIVATE" && albumData?.accessCode) {
				showSuccess(
					`Album created successfully! Access code: ${albumData.accessCode}`
				)
			} else {
				showSuccess("Album created successfully!")
			}

			navigate(`/albums/${albumId}`)
		} catch (err: any) {
			console.error("Error creating album:", err)
			const errorMessage =
				err.response?.data?.error?.message || "Failed to create album"
			setError(errorMessage)
			showError(errorMessage)

			if (err.response?.data?.error?.details) {
				const details = err.response.data.error.details
				const nameError = details.find((d: any) => d.path?.includes("name"))
				if (nameError) {
					setTimeout(() => {
						document.getElementById("name")?.focus()
					}, 100)
				}
			}
		}
	}

	return (
		<div className="flex justify-center min-h-screen py-8">
			<div className="max-w-2xl w-full">
				<div className="mb-8 text-center">
					<h1 className="text-4xl font-bold text-[#8B7355] mb-2">
						Create New Album
					</h1>
					<p className="text-[#6B5A42]">
						Organize your memories into beautiful albums
					</p>
				</div>
				<Card className="border-2 border-[#E8D4B8] shadow-xl">
					<CardHeader>
						<CardTitle className="text-2xl text-[#8B7355]">
							Album Details
						</CardTitle>
					</CardHeader>
					<CardContent>
						{/* Templates */}
						<div className="mb-6">
							<label className="text-sm font-medium text-[#8B7355] mb-3 block">
								Choose a Template (Optional)
							</label>
							<div className="grid grid-cols-5 gap-2">
								{templates.map((template) => (
									<button
										key={template.id}
										type="button"
										onClick={() => applyTemplate(template.id)}
										className={`p-3 rounded-lg border-2 transition-all ${
											selectedTemplate === template.id
												? "border-[#8B2E3C] bg-[#F5E8EA]"
												: "border-[#E8D4B8] bg-[#FDF8F3] hover:border-[#D9C19D]"
										}`}>
										<div className="text-2xl mb-1">{template.icon}</div>
										<div className="text-xs text-[#6B5A42]">
											{template.name}
										</div>
									</button>
								))}
							</div>
						</div>

						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							<Input
								id="name"
								label="Album Name *"
								placeholder="e.g., Summer Vacation 2024"
								{...register("name")}
								error={errors.name?.message}
							/>

							<div className="space-y-2">
								<label className="text-sm font-medium text-[#6B5A42]">
									Description
								</label>
								<textarea
									{...register("description")}
									placeholder="Describe your album..."
									rows={3}
									className="flex w-full rounded-lg border-2 border-[#E8D4B8] bg-[#FDF8F3] px-4 py-2.5 text-sm text-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
								/>
							</div>

							<div className="grid md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="text-sm font-medium text-[#6B5A42] flex items-center gap-2">
										<Calendar className="h-4 w-4" />
										Event Date
									</label>
									<input
										type="datetime-local"
										{...register("eventDate")}
										className="flex h-11 w-full rounded-lg border-2 border-[#E8D4B8] bg-[#FDF8F3] px-4 py-2.5 text-sm text-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium text-[#6B5A42] flex items-center gap-2">
										<MapPin className="h-4 w-4" />
										Event Location
									</label>
									<Input
										id="eventLocation"
										placeholder="e.g., New York, NY"
										{...register("eventLocation")}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Select
									label="Privacy Settings"
									{...register("privacy")}
									options={[
										{ value: "PUBLIC", label: "Public (Discoverable in app)" },
										{
											value: "PRIVATE",
											label: "Private (Only accessible via QR/NFC/link)",
										},
									]}
									error={errors.privacy?.message}
								/>
								{errors.privacy && (
									<p className="text-sm text-[#8B2E3C] font-medium">
										{errors.privacy.message}
									</p>
								)}
								{selectedPrivacy === "PRIVATE" && (
									<div className="flex items-start gap-2 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
										<Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
										<p className="text-sm text-blue-700">
											<strong>Note:</strong> An access code will be
											automatically generated for this private album. You'll be
											able to view and share it after creating the album.
										</p>
									</div>
								)}
							</div>

							{/* Advanced Settings Toggle */}
							<button
								type="button"
								onClick={() => setShowAdvanced(!showAdvanced)}
								className="text-sm text-[#8B2E3C] font-medium hover:underline">
								{showAdvanced ? "Hide" : "Show"} Advanced Settings
							</button>

							{showAdvanced && (
								<div className="space-y-4 p-4 bg-[#FDF8F3] rounded-lg border-2 border-[#E8D4B8]">
									<div className="grid md:grid-cols-2 gap-4">
										<Input
											id="maxFileSizeMB"
											label="Max File Size (MB)"
											type="number"
											min="1"
											max="500"
											{...register("maxFileSizeMB", { valueAsNumber: true })}
										/>
										<Input
											id="maxVideoLengthSec"
											label="Max Video Length (seconds)"
											type="number"
											min="30"
											max="600"
											{...register("maxVideoLengthSec", {
												valueAsNumber: true,
											})}
										/>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium text-[#6B5A42] flex items-center gap-2">
											<FileText className="h-4 w-4" />
											Upload Description
										</label>
										<textarea
											{...register("uploadDescription")}
											placeholder="Instructions for contributors..."
											rows={2}
											className="flex w-full rounded-lg border-2 border-[#E8D4B8] bg-white px-4 py-2.5 text-sm text-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
										/>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium text-[#6B5A42]">
											Expiry Date (Optional)
										</label>
										<input
											type="datetime-local"
											{...register("expiresAt")}
											className="flex h-11 w-full rounded-lg border-2 border-[#E8D4B8] bg-white px-4 py-2.5 text-sm text-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
										/>
									</div>

									<div className="space-y-3">
										<Checkbox
											id="allowVideos"
											{...register("allowVideos")}
											label={
												<span className="flex items-center gap-2">
													<Video className="h-4 w-4" />
													Allow Videos
												</span>
											}
										/>

										<Checkbox
											id="requireContributorName"
											{...register("requireContributorName")}
											label={
												<span className="flex items-center gap-2">
													<User className="h-4 w-4" />
													Require Contributor Name
												</span>
											}
										/>

										<Checkbox
											id="enableReactions"
											{...register("enableReactions")}
											label={
												<span className="flex items-center gap-2">
													<Heart className="h-4 w-4" />
													Enable Reactions
												</span>
											}
										/>
									</div>
								</div>
							)}

							{error && (
								<div className="rounded-lg bg-[#F5E8EA] border-2 border-[#D9A0A8] p-3">
									<p className="text-sm text-[#8B2E3C] font-medium">{error}</p>
								</div>
							)}

							<div className="flex justify-end gap-3 pt-4">
								<Button
									type="button"
									variant="secondary"
									onClick={() => navigate("/albums")}>
									Cancel
								</Button>
								<Button type="submit" isLoading={isSubmitting}>
									Create Album
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
