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
import { Mail, Send, MessageSquare } from "lucide-react"
import api from "../../lib/api"
import { Link } from "react-router-dom"

const contactSchema = z.object({
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(200, "Title is too long"),
	description: z
		.string()
		.min(10, "Description must be at least 10 characters")
		.max(5000, "Description is too long"),
	tags: z.string().optional(),
	severity: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
})

type ContactForm = z.infer<typeof contactSchema>

export default function ContactPage() {
	const { showSuccess, showError } = useNotifications()
	const [error, setError] = useState<string | null>(null)
	const [descriptionLength, setDescriptionLength] = useState(0)
	const currentYear = new Date().getFullYear()

	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<ContactForm>({
		resolver: zodResolver(contactSchema),
		defaultValues: {
			severity: "MEDIUM",
		},
	})

	const onSubmit = async (data: ContactForm) => {
		try {
			setError(null)

			const tagsArray = data.tags
				? data.tags
						.split(",")
						.map((tag) => tag.trim())
						.filter((tag) => tag.length > 0)
				: []

			await api.post("/contact", {
				title: data.title,
				description: data.description,
				tags: tagsArray,
				severity: data.severity,
			})

			showSuccess(
				"Thank you! Your message has been sent successfully. We'll get back to you soon."
			)
			reset()
		} catch (err: any) {
			const errorMessage =
				err.response?.data?.error?.message ||
				"Failed to send message. Please try again."
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
						<Mail className="h-10 w-10 text-white" />
					</div>
					<h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
					<p className="text-xl text-white/90 max-w-2xl mx-auto">
						Have a question, suggestion, or need help? We'd love to hear from
						you.
					</p>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto px-4 py-16">
				<div className="max-w-3xl mx-auto">
					<div className="grid md:grid-cols-2 gap-8 mb-12">
						<Card className="border-2 border-[#E8D4B8]">
							<CardContent className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-12 h-12 rounded-lg bg-[#D4E4F0] border-2 border-[#A8C5D9] flex items-center justify-center">
										<Mail className="h-6 w-6 text-[#5A8BB0]" />
									</div>
									<h3 className="text-xl font-semibold text-[#8B7355]">
										Email Support
									</h3>
								</div>
								<p className="text-[#6B5A42]">
									Send us a message using the form and we'll get back to you as
									soon as possible.
								</p>
							</CardContent>
						</Card>

						<Card className="border-2 border-[#E8D4B8]">
							<CardContent className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-12 h-12 rounded-lg bg-[#D4E4F0] border-2 border-[#A8C5D9] flex items-center justify-center">
										<MessageSquare className="h-6 w-6 text-[#5A8BB0]" />
									</div>
									<h3 className="text-xl font-semibold text-[#8B7355]">
										Response Time
									</h3>
								</div>
								<p className="text-[#6B5A42]">
									We typically respond within 24-48 hours. Urgent issues are
									prioritized and may receive faster responses.
								</p>
							</CardContent>
						</Card>
					</div>

					<Card className="border-2 border-[#E8D4B8] shadow-xl">
						<CardHeader>
							<CardTitle className="text-2xl text-[#8B7355] flex items-center gap-2">
								<Send className="h-6 w-6" />
								Send Us a Message
							</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
								<Input
									id="title"
									label="Subject / Title"
									placeholder="Brief description of your message"
									{...register("title")}
									error={errors.title?.message}
									maxLength={200}
								/>

								<div className="space-y-2">
									<label
										htmlFor="description"
										className="text-sm font-medium leading-none text-[#8B7355]">
										Description
									</label>
									<textarea
										id="description"
										{...register("description", {
											onChange: (e) =>
												setDescriptionLength(e.target.value.length),
										})}
										rows={8}
										className="flex w-full rounded-lg border-2 border-[#E8D4B8] bg-[#FDF8F3] px-4 py-2.5 text-sm text-[#8B7355] placeholder:text-[#A68F75] focus:outline-none focus:ring-2 focus:ring-[#8B2E3C] focus:border-[#8B2E3C] transition-all duration-200 shadow-sm resize-none"
										placeholder="Please provide as much detail as possible..."
										maxLength={5000}
									/>
									{errors.description && (
										<p className="text-sm text-[#8B2E3C] font-medium">
											{errors.description.message}
										</p>
									)}
									<p className="text-xs text-[#A68F75]">
										{descriptionLength} / 5000 characters
									</p>
								</div>

								<Input
									id="tags"
									label="Tags (Optional)"
									placeholder="bug, feature-request, question (comma-separated)"
									{...register("tags")}
									error={errors.tags?.message}
								/>
								<p className="text-xs text-[#A68F75] -mt-4">
									Add tags to help us categorize your message (e.g., bug,
									feature-request, question)
								</p>

								<Controller
									name="severity"
									control={control}
									render={({ field }) => (
										<Select
											id="severity"
											label="Priority / Severity"
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}
											options={[
												{ value: "LOW", label: "Low - General inquiry or feedback" },
												{ value: "MEDIUM", label: "Medium - Standard support request" },
												{ value: "HIGH", label: "High - Important issue affecting usage" },
												{ value: "URGENT", label: "Urgent - Critical issue requiring immediate attention" },
											]}
											error={errors.severity?.message}
										/>
									)}
								/>

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
									Send Message
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Footer */}
			<footer className="bg-[#8B7355] text-white py-8 mt-16">
				<div className="container mx-auto px-4 text-center text-sm">
					<p>&copy; {currentYear} Memory. All rights reserved.</p>
					<div className="mt-4 space-x-4">
						<Link to="/terms" className="hover:underline">
							Terms
						</Link>
						<Link to="/privacy" className="hover:underline">
							Privacy
						</Link>
						<Link to="/about" className="hover:underline">
							About
						</Link>
					</div>
				</div>
			</footer>
		</>
	)
}
