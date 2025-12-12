import { Link } from "react-router-dom"
import { Button } from "../../components/ui/Button"
import { Card, CardContent } from "../../components/ui/Card"
import { Folder, Users, Target, Heart } from "lucide-react"

export default function AboutPage() {
	const currentYear = new Date().getFullYear()

	const values = [
		{
			icon: Heart,
			title: "User-Focused",
			description:
				"We build features that matter to you. Your feedback shapes our product.",
		},
		{
			icon: Target,
			title: "Simplicity First",
			description:
				"Complex problems deserve simple solutions. We make sharing memories effortless.",
		},
		{
			icon: Users,
			title: "Community Driven",
			description:
				"Built for people who want to share and preserve memories together.",
		},
	]

	return (
		<>
			{/* Header */}
			<div className="bg-[#8B2E3C] text-white py-16">
				<div className="container mx-auto px-4 text-center">
					<h1 className="text-4xl md:text-5xl font-bold mb-4">About Memory</h1>
					<p className="text-xl text-white/90 max-w-2xl mx-auto">
						Making memory sharing simple, accessible, and delightful
					</p>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto px-4 py-16">
				<div className="max-w-4xl mx-auto space-y-12">
					{/* Mission */}
					<Card className="border-2 border-[#E8D4B8]">
						<CardContent className="p-8">
							<div className="flex items-center gap-4 mb-6">
								<div className="w-16 h-16 rounded-full bg-[#D4E4F0] border-2 border-[#A8C5D9] flex items-center justify-center">
									<Folder className="h-8 w-8 text-[#5A8BB0]" />
								</div>
								<h2 className="text-3xl font-bold text-[#8B7355]">
									Our Mission
								</h2>
							</div>
							<p className="text-lg text-[#6B5A42] leading-relaxed mb-4">
								At Memory, we believe that sharing memories should be
								effortless. Whether it's a wedding, birthday party, family
								gathering, or any special event, everyone should be able to
								contribute their photos and videos easily.
							</p>
							<p className="text-lg text-[#6B5A42] leading-relaxed">
								We've built a platform that removes the friction from
								collaborative photo sharing. No apps to download, no complex
								setups—just share a link, QR code, or NFC tag, and let the
								memories flow in.
							</p>
						</CardContent>
					</Card>

					{/* Values */}
					<div>
						<h2 className="text-3xl font-bold text-[#8B7355] mb-8 text-center">
							Our Values
						</h2>
						<div className="grid md:grid-cols-3 gap-6">
							{values.map((value, index) => {
								const Icon = value.icon
								return (
									<Card
										key={index}
										className="border-2 border-[#E8D4B8] hover:border-[#8B2E3C] transition-all duration-300">
										<CardContent className="p-6 text-center">
											<div className="w-16 h-16 rounded-full bg-[#D4E4F0] border-2 border-[#A8C5D9] flex items-center justify-center mx-auto mb-4">
												<Icon className="h-8 w-8 text-[#5A8BB0]" />
											</div>
											<h3 className="text-xl font-semibold text-[#8B7355] mb-2">
												{value.title}
											</h3>
											<p className="text-[#6B5A42]">{value.description}</p>
										</CardContent>
									</Card>
								)
							})}
						</div>
					</div>

					{/* Story */}
					<Card className="border-2 border-[#E8D4B8]">
						<CardContent className="p-8">
							<h2 className="text-3xl font-bold text-[#8B7355] mb-6">
								Our Story
							</h2>
							<div className="space-y-4 text-[#6B5A42] leading-relaxed">
								<p>
									Memory was born from a simple frustration: trying to collect
									photos from a large group of people is harder than it should
									be. Email chains, messaging apps, and social media groups all
									have their limitations.
								</p>
								<p>
									We envisioned a solution where anyone could contribute to a
									shared album with just a link, QR code, or NFC tag—no account
									required, no app downloads, just pure simplicity.
								</p>
								<p>
									Today, Memory powers thousands of events, gatherings, and
									collaborative projects. We're constantly improving based on
									your feedback, always keeping simplicity and user experience
									at the heart of everything we do.
								</p>
							</div>
						</CardContent>
					</Card>

					{/* CTA */}
					<div className="text-center py-8">
						<h2 className="text-2xl font-bold text-[#8B7355] mb-4">
							Ready to Start Sharing?
						</h2>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link to="/register">
								<Button size="lg">Get Started Free</Button>
							</Link>
							<Link to="/contact">
								<Button size="lg" variant="secondary">
									Contact Us
								</Button>
							</Link>
						</div>
					</div>
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
						<Link to="/contact" className="hover:underline">
							Contact
						</Link>
					</div>
				</div>
			</footer>
		</>
	)
}
