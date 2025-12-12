import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link } from "react-router-dom"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../../components/ui/Card"
import { useNotifications } from "../../components/notifications/NotificationSystem"
import api from "../../lib/api"
import { ArrowLeft, Mail } from "lucide-react"

const forgotPasswordSchema = z.object({
	email: z.string().email("Invalid email address"),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
	const { showError, showSuccess } = useNotifications()
	const [error, setError] = useState<string | null>(null)
	const [isSubmitted, setIsSubmitted] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ForgotPasswordForm>({
		resolver: zodResolver(forgotPasswordSchema),
	})

	const onSubmit = async (data: ForgotPasswordForm) => {
		try {
			setError(null)
			setIsSubmitting(true)

			await api.post("/auth/forgot-password", { email: data.email })

			setIsSubmitted(true)
			showSuccess(
				"If the email exists, a password reset link has been sent to your inbox."
			)
		} catch (err: any) {
			const errorMessage =
				err.response?.data?.error?.message || "Failed to send reset email"
			setError(errorMessage)
			showError(errorMessage)
		} finally {
			setIsSubmitting(false)
		}
	}

	if (isSubmitted) {
		return (
			<div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#FDF8F3]">
				<div className="w-full max-w-md space-y-8">
					<Link
						to="/login"
						className="inline-flex items-center gap-2 text-[#6B5A42] hover:text-[#8B2E3C] transition-colors mb-4">
						<ArrowLeft className="h-4 w-4" />
						<span className="text-sm font-medium">Back to Sign In</span>
					</Link>
					<Card className="w-full border-2 border-[#E8D4B8] bg-white shadow-xl">
						<CardContent className="pt-6 pb-6">
							<div className="text-center">
								<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4E4F0] border-2 border-[#A8C5D9] mb-4">
									<Mail className="h-8 w-8 text-[#5A8BB0]" />
								</div>
								<h2 className="text-2xl font-bold text-[#8B7355] mb-2">
									Check Your Email
								</h2>
								<p className="text-[#6B5A42] mb-6">
									If an account exists with that email, we've sent a password
									reset link. Please check your inbox and follow the
									instructions.
								</p>
								<p className="text-sm text-[#A68F75] mb-6">
									Didn't receive the email? Check your spam folder or try again
									in a few minutes.
								</p>
								<Link to="/login">
									<Button className="w-full">Back to Sign In</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	return (
		<div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#FDF8F3]">
			<div className="w-full max-w-md space-y-8">
				<Link
					to="/login"
					className="inline-flex items-center gap-2 text-[#6B5A42] hover:text-[#8B2E3C] transition-colors mb-4">
					<ArrowLeft className="h-4 w-4" />
					<span className="text-sm font-medium">Back to Sign In</span>
				</Link>
				<div className="text-center">
					<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#8B2E3C] border-4 border-[#6B1F2D] mb-4 shadow-lg">
						<span className="text-3xl font-bold text-white">M</span>
					</div>
					<h1 className="text-4xl font-bold text-[#8B7355]">Memory</h1>
					<p className="mt-2 text-[#6B5A42]">Reset your password</p>
				</div>
				<Card className="w-full border-2 border-[#E8D4B8] bg-white shadow-xl">
					<CardHeader className="space-y-1 pb-4">
						<CardTitle className="text-2xl font-semibold text-center text-[#8B7355]">
							Forgot Password?
						</CardTitle>
						<p className="text-sm text-center text-[#6B5A42] mt-2">
							Enter your email address and we'll send you a link to reset your
							password.
						</p>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
							<Input
								id="email"
								type="email"
								label="Email address"
								placeholder="you@example.com"
								{...register("email")}
								error={errors.email?.message}
							/>
							{error && (
								<div className="rounded-lg bg-[#F5E8EA] border-2 border-[#D9A0A8] p-3">
									<p className="text-sm text-[#8B2E3C] font-medium">{error}</p>
								</div>
							)}
							<Button
								type="submit"
								className="w-full mt-6"
								isLoading={isSubmitting}>
								Send Reset Link
							</Button>
						</form>
					</CardContent>
					<CardFooter className="justify-center pt-4">
						<p className="text-sm text-[#6B5A42]">
							Remember your password?{" "}
							<Link
								to="/login"
								className="font-semibold text-[#8B2E3C] hover:text-[#6B1F2D] transition-colors underline">
								Sign in
							</Link>
						</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	)
}
