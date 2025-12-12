import { type InputHTMLAttributes, forwardRef, useState } from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Eye, EyeOff } from "lucide-react"

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string
	error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, label, error, id, type, ...props }, ref) => {
		const [showPassword, setShowPassword] = useState(false)
		const isPassword = type === "password"
		const inputType = isPassword && showPassword ? "text" : type

		return (
			<div className="w-full space-y-2">
				{label && (
					<label
						htmlFor={id}
						className="text-sm font-medium leading-none text-[#8B7355] peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
						{label}
					</label>
				)}
				<div className="relative">
					<input
						id={id}
						type={inputType}
						className={cn(
							"flex h-11 w-full rounded-lg border-2 border-[#E8D4B8] bg-[#FDF8F3] px-4 py-2.5 text-sm text-[#8B7355] placeholder:text-[#A68F75] focus:outline-none focus:ring-2 focus:ring-[#8B2E3C] focus:border-[#8B2E3C] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
							error && "border-[#8B2E3C] focus:ring-[#8B2E3C]",
							isPassword && "pr-10",
							className
						)}
						ref={ref}
						{...props}
					/>
					{isPassword && (
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5A42] hover:text-[#8B2E3C] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B2E3C] rounded p-1"
							aria-label={showPassword ? "Hide password" : "Show password"}>
							{showPassword ? (
								<EyeOff className="h-5 w-5" />
							) : (
								<Eye className="h-5 w-5" />
							)}
						</button>
					)}
				</div>
				{error && <p className="text-sm text-[#8B2E3C] font-medium">{error}</p>}
			</div>
		)
	}
)

Input.displayName = "Input"

export { Input }
