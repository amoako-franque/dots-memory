import { useState, type ReactNode } from "react"

interface TooltipProps {
	children: ReactNode
	content: string
	position?: "top" | "bottom" | "left" | "right"
}

export function Tooltip({ children, content, position = "top" }: TooltipProps) {
	const [isVisible, setIsVisible] = useState(false)

	const positionClasses = {
		top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
		bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
		left: "right-full top-1/2 -translate-y-1/2 mr-2",
		right: "left-full top-1/2 -translate-y-1/2 ml-2",
	}

	const arrowClasses = {
		top: "top-full left-1/2 -translate-x-1/2 border-t-[#6B5A42] border-l-transparent border-r-transparent border-b-transparent",
		bottom:
			"bottom-full left-1/2 -translate-x-1/2 border-b-[#6B5A42] border-l-transparent border-r-transparent border-t-transparent",
		left: "left-full top-1/2 -translate-y-1/2 border-l-[#6B5A42] border-t-transparent border-b-transparent border-r-transparent",
		right:
			"right-full top-1/2 -translate-y-1/2 border-r-[#6B5A42] border-t-transparent border-b-transparent border-l-transparent",
	}

	return (
		<div
			className="relative inline-block"
			onMouseEnter={() => setIsVisible(true)}
			onMouseLeave={() => setIsVisible(false)}
			onFocus={() => setIsVisible(true)}
			onBlur={() => setIsVisible(false)}>
			{children}
			{isVisible && (
				<div
					className={`absolute z-50 ${positionClasses[position]} pointer-events-none animate-in fade-in-0 zoom-in-95 duration-200 w-max`}>
					<div className="bg-[#6B5A42] text-white text-xs rounded-lg px-4 py-2.5 shadow-xl whitespace-normal min-w-[200px] max-w-md text-center">
						{content}
					</div>
					<div
						className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
					/>
				</div>
			)}
		</div>
	)
}
