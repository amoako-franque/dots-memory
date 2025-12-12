import { type ReactNode, useEffect } from "react"
import { useLocation } from "react-router-dom"
import LandingNavbar from "./LandingNavbar"

interface LandingLayoutProps {
	children: ReactNode
}

export default function LandingLayout({ children }: LandingLayoutProps) {
	const location = useLocation()

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "instant" })
	}, [location.pathname])

	return (
		<div className="min-h-screen bg-[#FDF8F3]">
			<LandingNavbar />
			{children}
		</div>
	)
}

