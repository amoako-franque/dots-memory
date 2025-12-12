import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate } from "react-router-dom"
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
import { useAppDispatch } from "../../store/hooks"
import { login } from "../../store/slices/authSlice"
import api from "../../lib/api"
import { ArrowLeft } from "lucide-react"

const loginSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
	const { showError, showSuccess } = useNotifications()
	const [error, setError] = useState<string | null>(null)
	const navigate = useNavigate()
	const dispatch = useAppDispatch()

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
	})

	const onSubmit = async (data: LoginForm) => {
		try {
			setError(null)
			const response = await api.post("/auth/login", data, {
				withCredentials: true, // Include cookies (access token is set in httpOnly cookie)
			})
			const { user } = response.data.data
			dispatch(login({ user }))
			showSuccess("Welcome back!")
			navigate("/dashboard")
		} catch (err: any) {
			const errorMessage = err.response?.data?.error?.message || "Login failed"
			setError(errorMessage)
			showError(errorMessage)
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#FDF8F3]">
			<div className="w-full max-w-md space-y-8">
				<Link
					to="/"
					className="inline-flex items-center gap-2 text-[#6B5A42] hover:text-[#8B2E3C] transition-colors mb-4">
					<ArrowLeft className="h-4 w-4" />
					<span className="text-sm font-medium">Back to Home</span>
				</Link>
				<div className="text-center">
					<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#8B2E3C] border-4 border-[#6B1F2D] mb-4 shadow-lg">
						<span className="text-3xl font-bold text-white">M</span>
					</div>
					<h1 className="text-4xl font-bold text-[#8B7355]">Memory</h1>
					<p className="mt-2 text-[#6B5A42]">Sign in to your account</p>
				</div>
				<Card className="w-full border-2 border-[#E8D4B8] bg-white shadow-xl">
					<CardHeader className="space-y-1 pb-4">
						<CardTitle className="text-2xl font-semibold text-center text-[#8B7355]">
							Welcome back
						</CardTitle>
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
							<Input
								id="password"
								type="password"
								label="Password"
								placeholder="••••••••"
								{...register("password")}
								error={errors.password?.message}
							/>
							<div className="flex items-center justify-end">
								<Link
									to="/forgot-password"
									className="text-sm font-medium text-[#8B2E3C] hover:text-[#6B1F2D] transition-colors">
									Forgot password?
								</Link>
							</div>
							{error && (
								<div className="rounded-lg bg-[#F5E8EA] border-2 border-[#D9A0A8] p-3">
									<p className="text-sm text-[#8B2E3C] font-medium">{error}</p>
								</div>
							)}
							<Button
								type="submit"
								className="w-full mt-6"
								isLoading={isSubmitting}>
								Sign in
							</Button>
						</form>
					</CardContent>
					<CardFooter className="justify-center pt-4">
						<p className="text-sm text-[#6B5A42]">
							Don't have an account?{" "}
							<Link
								to="/register"
								className="font-semibold text-[#8B2E3C] hover:text-[#6B1F2D] transition-colors underline">
								Sign up
							</Link>
						</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	)
}
