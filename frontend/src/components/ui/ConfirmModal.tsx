import { X, AlertTriangle } from "lucide-react"
import { Button } from "./Button"
import { Card, CardContent } from "./Card"

interface ConfirmModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	title: string
	message: string
	confirmText?: string
	cancelText?: string
	variant?: "danger" | "warning" | "info"
	isLoading?: boolean
}

export function ConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	variant = "danger",
	isLoading = false,
}: ConfirmModalProps) {
	if (!isOpen) return null

	const variantColors = {
		danger: {
			iconBg: "bg-red-50",
			iconColor: "text-red-600",
			button: "bg-red-600 hover:bg-red-700 text-white",
		},
		warning: {
			iconBg: "bg-yellow-50",
			iconColor: "text-yellow-600",
			button: "bg-yellow-600 hover:bg-yellow-700 text-white",
		},
		info: {
			iconBg: "bg-blue-50",
			iconColor: "text-blue-600",
			button: "bg-blue-600 hover:bg-blue-700 text-white",
		},
	}

	const colors = variantColors[variant]

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200"
			onClick={(e) => {
				if (e.target === e.currentTarget && !isLoading) {
					onClose()
				}
			}}>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200" />

			{/* Modal */}
			<Card className="relative z-10 w-full max-w-md border-2 border-[#E8D4B8] bg-white shadow-2xl transition-all duration-200 transform">
				<CardContent className="p-0">
					{/* Header */}
					<div className="flex items-center justify-between border-b border-[#E8D4B8] px-6 py-4">
						<div className="flex items-center gap-3">
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.iconBg}`}>
								<AlertTriangle className={`h-5 w-5 ${colors.iconColor}`} />
							</div>
							<h3 className="text-lg font-semibold text-[#8B7355]">{title}</h3>
						</div>
						<button
							onClick={onClose}
							disabled={isLoading}
							className="flex h-8 w-8 items-center justify-center rounded-full text-[#A68F75] transition-colors hover:bg-[#F5E6D3] hover:text-[#8B7355] disabled:opacity-50 disabled:cursor-not-allowed">
							<X className="h-5 w-5" />
						</button>
					</div>

					{/* Content */}
					<div className="px-6 py-5">
						<p className="text-sm leading-relaxed text-[#6B5A42]">{message}</p>
					</div>

					{/* Footer */}
					<div className="flex items-center justify-end gap-3 border-t border-[#E8D4B8] bg-[#FDF8F3] px-6 py-4">
						<Button
							variant="outline"
							size="sm"
							onClick={onClose}
							disabled={isLoading}
							className="min-w-[80px] border-[#E8D4B8] text-[#6B5A42] hover:bg-white hover:border-[#D9C19D]">
							{cancelText}
						</Button>
						<Button
							variant={variant === "danger" ? "danger" : "primary"}
							size="sm"
							onClick={onConfirm}
							disabled={isLoading}
							className="min-w-[80px]">
							{isLoading ? (
								<span className="flex items-center gap-2">
									<svg
										className="h-4 w-4 animate-spin"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24">
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									Processing...
								</span>
							) : (
								confirmText
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
