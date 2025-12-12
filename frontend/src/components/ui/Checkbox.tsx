import { forwardRef, useEffect, useRef } from "react"
import { Check } from "lucide-react"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string | React.ReactNode
	indeterminate?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
	({ label, className = "", indeterminate, ...props }, ref) => {
		const internalRef = useRef<HTMLInputElement>(null)

		const setRef = (node: HTMLInputElement | null) => {
			internalRef.current = node
			if (typeof ref === "function") {
				ref(node)
			} else if (ref) {
				;(ref as React.MutableRefObject<HTMLInputElement | null>).current = node
			}
		}

		useEffect(() => {
			if (internalRef.current) {
				internalRef.current.indeterminate = indeterminate || false
			}
		}, [indeterminate])

		return (
			<label className="flex items-center gap-2 cursor-pointer group">
				<div className="relative inline-flex items-center">
					<input
						type="checkbox"
						ref={setRef}
						className="sr-only peer"
						{...props}
					/>
					<div className="w-5 h-5 rounded-full border-2 border-[#E8D4B8] bg-white peer-checked:bg-[#8B2E3C] peer-checked:border-[#8B2E3C] peer-focus:ring-2 peer-focus:ring-[#8B2E3C] peer-focus:ring-offset-1 transition-all duration-200 flex items-center justify-center group-hover:border-[#D9C19D] peer-checked:group-hover:bg-[#7A1E2B]">
						{props.checked && (
							<Check className="h-3 w-3 text-white stroke-[3]" />
						)}
						{indeterminate && !props.checked && (
							<div className="w-2 h-2 rounded-full bg-[#8B2E3C]" />
						)}
					</div>
				</div>
				{label && (
					<span className="text-sm text-[#6B5A42] select-none">{label}</span>
				)}
			</label>
		)
	}
)

Checkbox.displayName = "Checkbox"
