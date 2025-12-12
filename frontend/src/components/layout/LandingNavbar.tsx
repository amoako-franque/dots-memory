import { Link, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "../ui/Button"
import { useAppSelector } from "../../store/hooks"

export default function LandingNavbar() {
	const location = useLocation()
	const { isAuthenticated } = useAppSelector((state) => state.auth)

	const isHomePage = location.pathname === "/"

	const [scrolled, setScrolled] = useState(() => {
		if (typeof window === "undefined") return true
		return isHomePage ? window.scrollY > 10 : true
	})

	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	useEffect(() => {
		const handleScroll = () => {
			if (!isHomePage) {
				setScrolled(true)
			} else {
				setScrolled(window.scrollY > 10)
			}
		}

		window.addEventListener("scroll", handleScroll, { passive: true })

		handleScroll()

		return () => {
			window.removeEventListener("scroll", handleScroll)
		}
	}, [isHomePage])

	if (isAuthenticated) return null

	const shouldShowBackground = scrolled || !isHomePage

	const navItems = [
		{ path: "/", label: "Home" },
		{ path: "/about", label: "About" },
		{ path: "/contact", label: "Contact" },
	]

	return (
		<nav
			className={`sticky top-0 z-50 transition-all duration-300 ${
				shouldShowBackground
					? "bg-gradient-to-br from-[#8B2E3C]/90 via-[#6B1F2D]/90 to-[#4D151F]/90 backdrop-blur-md shadow-lg border-b border-white/10"
					: "bg-gradient-to-br from-[#8B2E3C]/80 via-[#6B1F2D]/80 to-[#4D151F]/80 backdrop-blur-md"
			}`}>
			<div className="container mx-auto px-4">
				<div className="flex items-center justify-between h-16">
					{/* Logo */}
					<Link
						to="/"
						className="flex items-center space-x-3 text-xl font-bold">
						<div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#8B2E3C] border-4 border-[#6B1F2D] shadow-md">
							<span className="text-lg font-bold text-white">M</span>
						</div>
						<span className="text-white font-bold drop-shadow-md">
							Memory
						</span>
					</Link>

					{/* Desktop Nav */}
					<div className="hidden md:flex items-center space-x-1">
						{navItems.map((item) => {
							const isActive = location.pathname === item.path

							const base = "px-3 py-2 rounded-lg transition-colors font-medium"

							const styles = isActive
								? "text-white font-semibold bg-white/20"
								: "text-white/90 hover:text-white hover:bg-white/20 drop-shadow-sm"

							return (
								<Link
									key={item.path}
									to={item.path}
									className={`${base} ${styles}`}>
									{item.label}
								</Link>
							)
						})}
					</div>

					{/* Auth Buttons */}
					<div className="hidden md:flex items-center">
						<Link to="/register">
							<Button
								className="bg-white text-[#8B2E3C] hover:bg-[#F5E6D3] shadow-lg">
								Get Started
							</Button>
						</Link>
					</div>

					{/* Mobile Menu Button */}
					<button
						className="md:hidden p-2 text-white drop-shadow-md"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
						{mobileMenuOpen ? (
							<X className="h-6 w-6" />
						) : (
							<Menu className="h-6 w-6" />
						)}
					</button>
				</div>
			</div>

			{/* Mobile Menu */}
			{mobileMenuOpen && (
				<div className="md:hidden border-t bg-gradient-to-br from-[#8B2E3C]/95 via-[#6B1F2D]/95 to-[#4D151F]/95 backdrop-blur-md border-white/20">
					<div className="container mx-auto px-4 py-4 space-y-2">
						{navItems.map((item) => {
							const isActive = location.pathname === item.path

							const base =
								"block px-4 py-3 rounded-lg font-medium transition-colors"

							const styles = isActive
								? "text-white bg-white/20"
								: "text-white/90 hover:text-white hover:bg-white/10"

							return (
								<Link
									key={item.path}
									to={item.path}
									onClick={() => setMobileMenuOpen(false)}
									className={`${base} ${styles}`}>
									{item.label}
								</Link>
							)
						})}

						<div className="pt-4 border-t border-white/10">
							<Link
								to="/register"
								onClick={() => setMobileMenuOpen(false)}
								className="block px-4 py-3 rounded-lg text-center bg-white text-[#8B2E3C] hover:bg-[#F5E6D3]">
								Get Started
							</Link>
						</div>
					</div>
				</div>
			)}
		</nav>
	)
}
