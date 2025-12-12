import {
	type SelectHTMLAttributes,
	forwardRef,
	useState,
	useRef,
	useEffect,
} from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ChevronDown, Check } from "lucide-react"

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

interface SelectOption {
	value: string
	label: string
	disabled?: boolean
}

interface SelectProps
	extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
	label?: string
	error?: string
	options: SelectOption[]
	placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
	(
		{
			className,
			label,
			error,
			id,
			options,
			placeholder,
			value,
			onChange,
			disabled,
			...props
		},
		ref
	) => {
		const [isOpen, setIsOpen] = useState(false)
		const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
		const selectRef = useRef<HTMLDivElement>(null)
		const selectElementRef = useRef<HTMLSelectElement>(null)

		const currentValue =
			value === undefined || value === null ? "" : String(value)
		const selectedOption =
			options.find((opt) => String(opt.value) === currentValue) || null
		const displayValue = selectedOption
			? selectedOption.label
			: placeholder || "Select an option"

		const handleOptionSelect = (optionValue: string) => {
			if (selectElementRef.current) {
				selectElementRef.current.value = optionValue
				const nativeEvent = new Event("change", { bubbles: true })
				selectElementRef.current.dispatchEvent(nativeEvent)
				if (onChange) {
					const event = {
						target: selectElementRef.current,
						currentTarget: selectElementRef.current,
					} as React.ChangeEvent<HTMLSelectElement>
					onChange(event)
				}
			}
			setIsOpen(false)
			setFocusedIndex(null)
		}

		useEffect(() => {
			const handleClickOutside = (event: MouseEvent) => {
				if (
					selectRef.current &&
					!selectRef.current.contains(event.target as Node)
				) {
					setIsOpen(false)
					setFocusedIndex(null)
				}
			}

			if (isOpen) {
				document.addEventListener("mousedown", handleClickOutside)
				return () =>
					document.removeEventListener("mousedown", handleClickOutside)
			}
		}, [isOpen])

		useEffect(() => {
			if (!isOpen) return

			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === "Escape") {
					setIsOpen(false)
					setFocusedIndex(null)
					return
				}

				if (e.key === "ArrowDown") {
					e.preventDefault()
					const enabledOptions = options.filter((opt) => !opt.disabled)
					const currentIndex =
						focusedIndex !== null
							? focusedIndex
							: enabledOptions.findIndex((opt) => opt.value === value)
					const nextIndex =
						currentIndex < enabledOptions.length - 1 ? currentIndex + 1 : 0
					setFocusedIndex(nextIndex)
				}

				if (e.key === "ArrowUp") {
					e.preventDefault()
					const enabledOptions = options.filter((opt) => !opt.disabled)
					const currentIndex =
						focusedIndex !== null
							? focusedIndex
							: enabledOptions.findIndex((opt) => opt.value === value)
					const prevIndex =
						currentIndex > 0 ? currentIndex - 1 : enabledOptions.length - 1
					setFocusedIndex(prevIndex)
				}

				if (e.key === "Enter" && focusedIndex !== null) {
					e.preventDefault()
					const enabledOptions = options.filter((opt) => !opt.disabled)
					const selected = enabledOptions[focusedIndex]
					if (selected && !selected.disabled) {
						handleOptionSelect(selected.value)
					}
				}
			}

			document.addEventListener("keydown", handleKeyDown)
			return () => document.removeEventListener("keydown", handleKeyDown)
		}, [isOpen, focusedIndex, value, options, handleOptionSelect])

		const enabledOptions = options.filter((opt) => !opt.disabled)

		return (
			<div className="w-full space-y-2">
				{label && (
					<label
						htmlFor={id}
						className="text-sm font-medium leading-none text-[#8B7355] peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
						{label}
					</label>
				)}
				<div ref={selectRef} className="relative">
					{/* Hidden native select for form compatibility */}
					<select
						ref={(node) => {
							if (typeof ref === "function") {
								ref(node)
							} else if (ref) {
								ref.current = node
							}
							selectElementRef.current = node
						}}
						id={id}
						value={value}
						onChange={onChange}
						disabled={disabled}
						className="sr-only"
						{...props}>
						{placeholder && (
							<option value="" disabled>
								{placeholder}
							</option>
						)}
						{options.map((option) => (
							<option
								key={option.value}
								value={option.value}
								disabled={option.disabled}>
								{option.label}
							</option>
						))}
					</select>

					{/* Custom dropdown button */}
					<button
						type="button"
						onClick={() => !disabled && setIsOpen(!isOpen)}
						disabled={disabled}
						className={cn(
							"flex h-11 w-full items-center justify-between rounded-lg border-2 bg-[#FDF8F3] px-4 py-2.5 text-left text-sm text-[#8B7355] shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8B2E3C] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
							error
								? "border-[#8B2E3C] focus:ring-[#8B2E3C]"
								: "border-[#E8D4B8] focus:border-[#8B2E3C]",
							isOpen && "ring-2 ring-[#8B2E3C] ring-offset-2 border-[#8B2E3C]",
							className
						)}
						aria-haspopup="listbox"
						aria-expanded={isOpen}
						aria-labelledby={label ? `${id}-label` : undefined}>
						<span
							className={cn("truncate", !selectedOption && "text-[#A68F75]")}>
							{displayValue}
						</span>
						<ChevronDown
							className={cn(
								"h-5 w-5 flex-shrink-0 text-[#6B5A42] transition-transform duration-200",
								isOpen && "rotate-180"
							)}
						/>
					</button>

					{/* Dropdown menu */}
					{isOpen && (
						<div className="absolute z-50 mt-1 w-full rounded-lg border-2 border-[#E8D4B8] bg-white shadow-lg">
							<ul
								role="listbox"
								className="max-h-60 overflow-auto py-1"
								aria-labelledby={label ? `${id}-label` : undefined}>
								{options.map((option) => {
									const isSelected = option.value === value
									const isFocused =
										enabledOptions.findIndex(
											(opt) => opt.value === option.value
										) === focusedIndex
									const isDisabled = option.disabled

									return (
										<li
											key={option.value}
											role="option"
											aria-selected={isSelected}
											onClick={() =>
												!isDisabled && handleOptionSelect(option.value)
											}
											onMouseEnter={() =>
												!isDisabled &&
												setFocusedIndex(
													enabledOptions.findIndex(
														(opt) => opt.value === option.value
													)
												)
											}
											className={cn(
												"relative flex cursor-pointer select-none items-center px-4 py-2.5 text-sm transition-colors",
												isSelected && "bg-[#F5E8EA] text-[#8B2E3C] font-medium",
												isFocused &&
													!isSelected &&
													"bg-[#FDF8F3] text-[#8B7355]",
												!isFocused && !isSelected && "text-[#6B5A42]",
												isDisabled && "cursor-not-allowed opacity-50"
											)}>
											<span className="flex-1 truncate">{option.label}</span>
											{isSelected && (
												<Check className="ml-2 h-4 w-4 flex-shrink-0 text-[#8B2E3C]" />
											)}
										</li>
									)
								})}
							</ul>
						</div>
					)}
				</div>
				{error && <p className="text-sm text-[#8B2E3C] font-medium">{error}</p>}
			</div>
		)
	}
)

Select.displayName = "Select"

export { Select, type SelectOption }
