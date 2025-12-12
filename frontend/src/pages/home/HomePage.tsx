import { Link } from "react-router-dom"
import { useState } from "react"
import { Button } from "../../components/ui/Button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/Card"
import {
	QrCode,
	Radio,
	Share2,
	Upload,
	Shield,
	Zap,
	Check,
	Crown,
	Calendar,
	Sparkles,
	Headphones,
	Palette,
	Globe,
	Lock,
	Star,
} from "lucide-react"

export default function HomePage() {
	const currentYear = new Date().getFullYear()
	const [isYearly, setIsYearly] = useState(false)

	const features = [
		{
			icon: QrCode,
			title: "QR Code Sharing",
			description:
				"Generate QR codes for instant album access. Perfect for events and gatherings.",
		},
		{
			icon: Radio,
			title: "NFC Support",
			description:
				"Tap NFC tags to instantly access albums. Seamless and contactless sharing.",
		},
		{
			icon: Share2,
			title: "Easy Sharing",
			description:
				"Share albums via links, QR codes, or NFC tags. Both public and private options.",
		},
		{
			icon: Upload,
			title: "Simple Upload",
			description:
				"Anyone with the link can contribute photos and videos to your albums.",
		},
		{
			icon: Shield,
			title: "Privacy Control",
			description:
				"Control who can access your albums with privacy settings and access codes.",
		},
		{
			icon: Zap,
			title: "Fast & Reliable",
			description:
				"Built for speed and reliability. Your memories are always accessible.",
		},
	]

	const steps = [
		{
			number: 1,
			title: "Create an Account",
			description:
				"Sign up for free and start your 14-day trial. No credit card required.",
		},
		{
			number: 2,
			title: "Create an Album",
			description:
				"Create a new album, set privacy settings, and customize your sharing options.",
		},
		{
			number: 3,
			title: "Get Your Share Links",
			description:
				"Copy your share link, download QR code, or get NFC identifier for easy access.",
		},
		{
			number: 4,
			title: "Share & Collect",
			description:
				"Share your album link, QR code, or NFC tag. People can view and upload photos/videos.",
		},
	]

	const monthlyPrices = {
		FREE: 0,
		BASIC: 4.99,
		PRO: 9.99,
	}

	// Yearly prices: 10 months (2 months free discount = ~16.7% off)
	const yearlyPrices = {
		FREE: 0,
		BASIC: monthlyPrices.BASIC * 10, // 10 months (2 months free)
		PRO: monthlyPrices.PRO * 10, // 10 months (2 months free)
	}

	const plans = [
		{
			tier: "FREE",
			name: "Free Trial",
			monthlyPrice: monthlyPrices.FREE,
			yearlyPrice: yearlyPrices.FREE,
			period: "14 days",
			description: "Perfect for trying out the platform",
			features: [
				"1 Album",
				"4 Photos",
				"No videos",
				"5MB max photo size",
				"14-day trial",
			],
			popular: false,
		},
		{
			tier: "BASIC",
			name: "Basic Plan",
			monthlyPrice: monthlyPrices.BASIC,
			yearlyPrice: yearlyPrices.BASIC,
			description: "Great for personal use",
			features: [
				"5 Albums",
				"50 Photos",
				"10 Videos",
				"25MB max photo size",
				"50MB max video size",
				"2GB storage",
			],
			popular: false,
		},
		{
			tier: "PRO",
			name: "Pro Plan",
			monthlyPrice: monthlyPrices.PRO,
			yearlyPrice: yearlyPrices.PRO,
			description: "Perfect for professionals",
			features: [
				"20 Albums",
				"200 Photos",
				"50 Videos",
				"100MB max photo size",
				"200MB max video size",
				"10GB storage",
			],
			popular: true,
		},
	]

	const getPrice = (plan: (typeof plans)[0]) => {
		if (plan.tier === "FREE") return "$0"
		const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
		return `$${price.toFixed(2)}`
	}

	const getPeriod = (plan: (typeof plans)[0]) => {
		if (plan.tier === "FREE") return plan.period
		return isYearly ? "per year" : "per month"
	}

	return (
		<>
			{/* Hero Section */}
			<section className="relative overflow-hidden bg-gradient-to-br from-[#8B2E3C] via-[#6B1F2D] to-[#4D151F] text-white">
				<div className="container mx-auto px-4 py-20 md:py-32">
					<div className="max-w-4xl mx-auto text-center">
						<div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 mb-8 hover:scale-110 transition-transform duration-300 hover:bg-white/30">
							<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#8B2E3C] border-4 border-[#6B1F2D] shadow-lg">
								<span className="text-2xl font-bold text-white">M</span>
							</div>
						</div>
						<h1 className="text-5xl md:text-6xl font-bold mb-6">
							Share Memories,
							<br />
							<span className="text-[#F5E6D3]">Not Complexity</span>
						</h1>
						<p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
							Create shared albums that anyone can access via QR codes, NFC
							tags, or simple links. Perfect for events, gatherings, and
							collaborative photo sharing.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link to="/register">
								<Button
									size="lg"
									className="bg-white text-[#8B2E3C] hover:bg-[#F5E6D3] border-2 border-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
									Get Started Free
								</Button>
							</Link>
							<Link to="/login">
								<Button
									size="lg"
									variant="outline"
									className="border-2 border-white text-white hover:bg-white/10 hover:scale-105 transition-all duration-300">
									Sign In
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 bg-white">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold text-[#8B7355] mb-4">
							Why Choose Memory?
						</h2>
						<p className="text-xl text-[#6B5A42] max-w-2xl mx-auto">
							Everything you need to share and collect memories effortlessly
						</p>
					</div>
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
						{features.map((feature, index) => {
							const Icon = feature.icon
							return (
								<Card
									key={index}
									className="group border-2 border-[#E8D4B8] hover:border-[#8B2E3C] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]">
									<CardContent className="p-6">
										<div className="w-12 h-12 rounded-lg bg-[#D4E4F0] border-2 border-[#A8C5D9] flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-[#8B2E3C] group-hover:border-[#6B1F2D]">
											<Icon className="h-6 w-6 text-[#5A8BB0] transition-colors duration-300 group-hover:text-white" />
										</div>
										<h3 className="text-xl font-semibold text-[#8B7355] mb-2 transition-colors duration-300 group-hover:text-[#8B2E3C]">
											{feature.title}
										</h3>
										<p className="text-[#6B5A42]">{feature.description}</p>
									</CardContent>
								</Card>
							)
						})}
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="py-20 bg-[#FDF8F3]">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold text-[#8B7355] mb-4">
							How It Works
						</h2>
						<p className="text-xl text-[#6B5A42] max-w-2xl mx-auto">
							Get started in minutes. It's that simple.
						</p>
					</div>
					<div className="max-w-4xl mx-auto">
						<div className="grid md:grid-cols-2 gap-8">
							{steps.map((step, index) => (
								<div key={index} className="flex gap-4 group">
									<div className="flex-shrink-0">
										<div className="w-12 h-12 rounded-full bg-[#8B2E3C] text-white flex items-center justify-center font-bold text-xl border-4 border-[#6B1F2D] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#6B1F2D] group-hover:border-[#8B2E3C] group-hover:shadow-lg">
											{step.number}
										</div>
									</div>
									<div className="flex-1">
										<h3 className="text-xl font-semibold text-[#8B7355] mb-2 transition-colors duration-300 group-hover:text-[#8B2E3C]">
											{step.title}
										</h3>
										<p className="text-[#6B5A42]">{step.description}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<section className="py-20 bg-white">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold text-[#8B7355] mb-4">
							Choose Your Plan
						</h2>
						<p className="text-xl text-[#6B5A42] max-w-2xl mx-auto mb-8">
							Start free, upgrade when you need more
						</p>
						{/* Billing Toggle */}
						<div className="flex flex-col items-center gap-3 mb-8">
							<div className="flex items-center justify-center gap-4">
								<span
									className={`text-lg font-medium transition-colors duration-300 ${
										!isYearly ? "text-[#8B2E3C]" : "text-[#6B5A42]"
									}`}>
									Monthly
								</span>
								<button
									onClick={() => setIsYearly(!isYearly)}
									className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#8B2E3C] focus:ring-offset-2 ${
										isYearly ? "bg-[#8B2E3C]" : "bg-[#8B7355]"
									}`}
									role="switch"
									aria-checked={isYearly}
									aria-label="Toggle yearly billing">
									<span
										className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-500 ease-in-out ${
											isYearly ? "translate-x-9" : "translate-x-1"
										}`}
									/>
								</button>
								<span
									className={`text-lg font-medium transition-colors duration-300 ${
										isYearly ? "text-[#8B2E3C]" : "text-[#6B5A42]"
									}`}>
									Yearly
								</span>
							</div>
							<div className="h-8 flex items-center justify-center">
								{isYearly && (
									<span className="px-3 py-1 bg-[#8B2E3C]/10 text-[#8B2E3C] text-sm font-semibold rounded-full border border-[#8B2E3C]/20 inline-block animate-in fade-in duration-300">
										Save 2 Months Free
									</span>
								)}
							</div>
						</div>
					</div>
					{/* Standard Plans */}
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-12">
						{plans.map((plan, index) => (
							<Card
								key={index}
								className={`border-2 ${
									plan.popular
										? "border-[#8B2E3C] bg-[#F5E8EA] shadow-xl"
										: "border-[#E8D4B8]"
								} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col`}>
								<CardHeader className="text-center pb-4">
									<CardTitle className="text-2xl text-[#8B7355]">
										{plan.name}
									</CardTitle>
									<div className="mt-4">
										<span className="text-4xl font-bold text-[#8B2E3C] transition-all duration-500">
											{getPrice(plan)}
										</span>
										<span className="text-[#6B5A42] ml-2 transition-all duration-500">
											{getPeriod(plan)}
										</span>
									</div>
									{/* Fixed height container for savings text to prevent card height change */}
									<div className="h-6 mt-2 flex items-center justify-center">
										{plan.tier !== "FREE" && isYearly && (
											<div className="text-xs text-[#8B2E3C] font-medium animate-in fade-in duration-300">
												Save ${(plan.monthlyPrice * 2).toFixed(2)} (2 months
												free)
											</div>
										)}
									</div>
									<p className="text-sm text-[#A68F75] mt-2">
										{plan.description}
									</p>
								</CardHeader>
								<CardContent className="flex-1 flex flex-col">
									<ul className="space-y-3 mb-6 flex-1">
										{plan.features.map((feature, featureIndex) => (
											<li key={featureIndex} className="flex items-start gap-2">
												<Check className="h-5 w-5 text-[#5A8BB0] flex-shrink-0 mt-0.5" />
												<span className="text-[#6B5A42] text-sm">
													{feature}
												</span>
											</li>
										))}
									</ul>
									<Link to="/register" className="mt-auto">
										<Button
											className={`w-full transition-all duration-300 ${
												plan.popular
													? "bg-[#8B2E3C] hover:bg-[#6B1F2D] hover:shadow-lg hover:scale-105"
													: "bg-[#8B7355] hover:bg-[#6B5A42] hover:shadow-lg hover:scale-105"
											} text-white`}>
											{plan.tier === "FREE"
												? "Start Free Trial"
												: "Get Started"}
										</Button>
									</Link>
								</CardContent>
							</Card>
						))}
					</div>

					{/* Custom Plan - Full Width */}
					<div className="max-w-7xl mx-auto">
						<Card className="border-2 border-[#8B2E3C] bg-gradient-to-br from-[#F5E8EA] to-[#FDF8F3] shadow-2xl overflow-hidden">
							<div className="relative">
								{/* Decorative Header */}
								<div className="bg-gradient-to-r from-[#8B2E3C] to-[#6B1F2D] text-white py-6 px-8">
									<div className="flex items-center justify-between flex-wrap gap-4">
										<div className="flex items-center gap-4">
											<div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center">
												<Crown className="h-8 w-8 text-white" />
											</div>
											<div>
												<h3 className="text-3xl font-bold">
													Custom Enterprise Plan
												</h3>
												<p className="text-white/90 mt-1">
													Tailored solutions for events, projects & enterprises
												</p>
											</div>
										</div>
										<Link to="/special-request">
											<Button
												size="lg"
												className="bg-white text-[#8B2E3C] hover:bg-[#F5E6D3] border-2 border-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
												Get Custom Quote
											</Button>
										</Link>
									</div>
								</div>

								<CardContent className="p-8">
									<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
										{/* Core Features */}
										<div>
											<div className="flex items-center gap-3 mb-4">
												<div className="w-10 h-10 rounded-lg bg-[#8B2E3C] flex items-center justify-center">
													<Sparkles className="h-5 w-5 text-white" />
												</div>
												<h4 className="text-lg font-semibold text-[#8B7355]">
													Custom Features
												</h4>
											</div>
											<ul className="space-y-2">
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Unlimited storage & bandwidth
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Custom file size limits
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Event-specific workflows
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Advanced analytics & reporting
													</span>
												</li>
											</ul>
										</div>

										{/* Branding & Customization */}
										<div>
											<div className="flex items-center gap-3 mb-4">
												<div className="w-10 h-10 rounded-lg bg-[#8B2E3C] flex items-center justify-center">
													<Palette className="h-5 w-5 text-white" />
												</div>
												<h4 className="text-lg font-semibold text-[#8B7355]">
													Branding & Design
												</h4>
											</div>
											<ul className="space-y-2">
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														White-label branding
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Custom domain support
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Custom QR code designs
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Branded email templates
													</span>
												</li>
											</ul>
										</div>

										{/* Support & Services */}
										<div>
											<div className="flex items-center gap-3 mb-4">
												<div className="w-10 h-10 rounded-lg bg-[#8B2E3C] flex items-center justify-center">
													<Headphones className="h-5 w-5 text-white" />
												</div>
												<h4 className="text-lg font-semibold text-[#8B7355]">
													Premium Support
												</h4>
											</div>
											<ul className="space-y-2">
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														24/7 priority support
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Dedicated account manager
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Onboarding & training
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														SLA guarantee (99.9% uptime)
													</span>
												</li>
											</ul>
										</div>

										{/* Event Management */}
										<div>
											<div className="flex items-center gap-3 mb-4">
												<div className="w-10 h-10 rounded-lg bg-[#8B2E3C] flex items-center justify-center">
													<Calendar className="h-5 w-5 text-white" />
												</div>
												<h4 className="text-lg font-semibold text-[#8B7355]">
													Event Management
												</h4>
											</div>
											<ul className="space-y-2">
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Multi-event dashboard
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Guest management tools
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Automated event workflows
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Post-event analytics
													</span>
												</li>
											</ul>
										</div>

										{/* Security & Compliance */}
										<div>
											<div className="flex items-center gap-3 mb-4">
												<div className="w-10 h-10 rounded-lg bg-[#8B2E3C] flex items-center justify-center">
													<Lock className="h-5 w-5 text-white" />
												</div>
												<h4 className="text-lg font-semibold text-[#8B7355]">
													Security & Compliance
												</h4>
											</div>
											<ul className="space-y-2">
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Enterprise-grade security
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														GDPR & SOC 2 compliant
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														SSO & advanced access controls
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Data encryption at rest & in transit
													</span>
												</li>
											</ul>
										</div>

										{/* Integration & API */}
										<div>
											<div className="flex items-center gap-3 mb-4">
												<div className="w-10 h-10 rounded-lg bg-[#8B2E3C] flex items-center justify-center">
													<Globe className="h-5 w-5 text-white" />
												</div>
												<h4 className="text-lg font-semibold text-[#8B7355]">
													Integrations & API
												</h4>
											</div>
											<ul className="space-y-2">
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														RESTful API access
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Webhook integrations
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Third-party app integrations
													</span>
												</li>
												<li className="flex items-start gap-2">
													<Check className="h-5 w-5 text-[#8B2E3C] flex-shrink-0 mt-0.5" />
													<span className="text-[#6B5A42] text-sm">
														Custom integration support
													</span>
												</li>
											</ul>
										</div>
									</div>

									{/* Bottom CTA Section */}
									<div className="mt-8 pt-8 border-t-2 border-[#E8D4B8]">
										<div className="flex flex-col md:flex-row items-center justify-between gap-6">
											<div className="flex-1">
												<h4 className="text-xl font-bold text-[#8B7355] mb-2 flex items-center gap-2">
													<Star className="h-5 w-5 text-[#8B2E3C]" />
													Perfect for Event Organizers, Project Managers &
													Enterprises
												</h4>
												<p className="text-[#6B5A42]">
													Get a custom quote tailored to your specific needs.
													Our team will work with you to create the perfect
													solution.
												</p>
											</div>
										</div>
									</div>
								</CardContent>
							</div>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 bg-gradient-to-br from-[#8B2E3C] via-[#6B1F2D] to-[#4D151F] text-white">
				<div className="container mx-auto px-4 text-center">
					<h2 className="text-4xl md:text-5xl font-bold mb-6">
						Ready to Get Started?
					</h2>
					<p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
						Join thousands of users sharing memories effortlessly
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link to="/register">
							<Button
								size="lg"
								className="bg-white text-[#8B2E3C] hover:bg-[#F5E6D3] border-2 border-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
								Create Free Account
							</Button>
						</Link>
						<Link to="/contact">
							<Button
								size="lg"
								variant="outline"
								className="border-2 border-white text-white hover:bg-white/10 hover:scale-105 transition-all duration-300">
								Contact Us
							</Button>
						</Link>
					</div>
				</div>
				{/* Artistic Divider - Music Wave/Squiggly */}
				<div className="relative w-full h-20 overflow-hidden">
					<svg
						className="absolute bottom-0 w-full h-full"
						viewBox="0 0 1200 120"
						preserveAspectRatio="none"
						xmlns="http://www.w3.org/2000/svg">
						<path
							d="M0,60 Q150,20 300,60 T600,60 T900,60 T1200,60 L1200,120 L0,120 Z"
							fill="url(#gradient1)"
							className="animate-pulse"
						/>
						<path
							d="M0,80 Q200,40 400,80 T800,80 T1200,80 L1200,120 L0,120 Z"
							fill="url(#gradient2)"
							opacity="0.7"
						/>
						<path
							d="M0,100 Q250,60 500,100 T1000,100 L1200,100 L1200,120 L0,120 Z"
							fill="url(#gradient3)"
							opacity="0.5"
						/>
						<defs>
							<linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" stopColor="#8B2E3C" />
								<stop offset="50%" stopColor="#6B1F2D" />
								<stop offset="100%" stopColor="#4D151F" />
							</linearGradient>
							<linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" stopColor="#6B1F2D" />
								<stop offset="50%" stopColor="#4D151F" />
								<stop offset="100%" stopColor="#8B2E3C" />
							</linearGradient>
							<linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" stopColor="#4D151F" />
								<stop offset="50%" stopColor="#8B2E3C" />
								<stop offset="100%" stopColor="#6B1F2D" />
							</linearGradient>
						</defs>
					</svg>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-gradient-to-br from-[#8B2E3C] via-[#6B1F2D] to-[#4D151F] text-white py-12">
				<div className="container mx-auto px-4">
					<div className="grid md:grid-cols-4 gap-8 mb-8">
						<div>
							<div className="flex items-center gap-3 mb-4">
								<div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#8B2E3C] border-4 border-[#6B1F2D] shadow-md">
									<span className="text-lg font-bold text-white">M</span>
								</div>
								<span className="text-xl font-bold">Memory</span>
							</div>
							<p className="text-white/80 text-sm">
								Share memories effortlessly with QR codes, NFC tags, and simple
								links.
							</p>
						</div>
						<div>
							<h4 className="font-bold text-lg mb-6 text-white">Product</h4>
							<ul className="space-y-3 text-sm">
								<li>
									<Link
										to="/"
										className="text-white/80 hover:text-[#F5E6D3] transition-colors duration-200 relative inline-block group">
										<span className="relative">
											Features
											<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5E6D3] transition-all duration-300 group-hover:w-full"></span>
										</span>
									</Link>
								</li>
								<li>
									<Link
										to="/#pricing"
										className="text-white/80 hover:text-[#F5E6D3] transition-colors duration-200 relative inline-block group">
										<span className="relative">
											Pricing
											<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5E6D3] transition-all duration-300 group-hover:w-full"></span>
										</span>
									</Link>
								</li>
								<li>
									<Link
										to="/about"
										className="text-white/80 hover:text-[#F5E6D3] transition-colors duration-200 relative inline-block group">
										<span className="relative">
											About
											<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5E6D3] transition-all duration-300 group-hover:w-full"></span>
										</span>
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-bold text-lg mb-6 text-white">Legal</h4>
							<ul className="space-y-3 text-sm">
								<li>
									<Link
										to="/terms"
										className="text-white/80 hover:text-[#F5E6D3] transition-colors duration-200 relative inline-block group">
										<span className="relative">
											Terms & Conditions
											<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5E6D3] transition-all duration-300 group-hover:w-full"></span>
										</span>
									</Link>
								</li>
								<li>
									<Link
										to="/privacy"
										className="text-white/80 hover:text-[#F5E6D3] transition-colors duration-200 relative inline-block group">
										<span className="relative">
											Privacy Policy
											<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5E6D3] transition-all duration-300 group-hover:w-full"></span>
										</span>
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-bold text-lg mb-6 text-white">Support</h4>
							<ul className="space-y-3 text-sm">
								<li>
									<Link
										to="/contact"
										className="text-white/80 hover:text-[#F5E6D3] transition-colors duration-200 relative inline-block group">
										<span className="relative">
											Contact Us
											<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5E6D3] transition-all duration-300 group-hover:w-full"></span>
										</span>
									</Link>
								</li>
								<li>
									<Link
										to="/about"
										className="text-white/80 hover:text-[#F5E6D3] transition-colors duration-200 relative inline-block group">
										<span className="relative">
											About Us
											<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5E6D3] transition-all duration-300 group-hover:w-full"></span>
										</span>
									</Link>
								</li>
							</ul>
						</div>
					</div>
					<div className="border-t border-white/20 pt-8 text-center text-sm text-white/80">
						<p>&copy; {currentYear} Memory. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</>
	)
}
