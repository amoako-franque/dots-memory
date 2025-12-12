import { useEffect, useState, useMemo } from "react"
import { Link } from "react-router-dom"
import {
	Globe,
	Search,
	Calendar,
	MapPin,
	Eye,
	Users,
	Image,
} from "lucide-react"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/Card"
import { Input } from "../../components/ui/Input"
import { LoadingSpinner } from "../../components/ui/LoadingSpinner"
import { ErrorDisplay } from "../../components/ui/ErrorDisplay"
import { EmptyState } from "../../components/ui/EmptyState"
import { Upload } from "lucide-react"
import api from "../../lib/api"

interface PublicAlbum {
	id: string
	name: string
	description: string | null
	shortUrl: string
	eventDate: string | null
	eventLocation: string | null
	createdAt: string
	viewCount: number
	uniqueContributors: number
	_count: {
		media: number
	}
	owner: {
		id: string
		email: string
	}
}

export default function PublicAlbumsPage() {
	const [albums, setAlbums] = useState<PublicAlbum[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState("")

	const fetchPublicAlbums = async () => {
		try {
			setIsLoading(true)
			setError(null)
			const response = await api.get("/public/albums")
			setAlbums(response.data?.data?.albums || [])
		} catch (err: any) {
			const errorMessage =
				err.response?.data?.error?.message || "Failed to load public albums"
			setError(errorMessage)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchPublicAlbums()
	}, [])

	const filteredAlbums = useMemo(() => {
		if (!searchQuery.trim()) return albums

		const query = searchQuery.toLowerCase()
		return albums.filter(
			(album) =>
				album.name.toLowerCase().includes(query) ||
				album.description?.toLowerCase().includes(query) ||
				album.eventLocation?.toLowerCase().includes(query)
		)
	}, [albums, searchQuery])

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#FDF8F3] p-4 sm:p-8">
				<div className="max-w-7xl mx-auto">
					<LoadingSpinner />
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen bg-[#FDF8F3] p-4 sm:p-8">
				<div className="max-w-7xl mx-auto">
					<ErrorDisplay message={error} onRetry={fetchPublicAlbums} />
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#FDF8F3] p-4 sm:p-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-4">
						<Globe className="h-8 w-8 text-[#5A8BB0]" />
						<h1 className="text-4xl font-bold text-[#8B7355]">
							Discover Public Albums
						</h1>
					</div>
					<p className="text-[#6B5A42] text-lg">
						Browse and contribute to public albums shared by the community
					</p>
				</div>

				{/* Search */}
				<div className="mb-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#A68F75]" />
						<Input
							type="text"
							placeholder="Search albums by name, description, or location..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10 w-full"
						/>
					</div>
				</div>

				{/* Albums Grid */}
				{filteredAlbums.length === 0 ? (
					<EmptyState
						icon={<Upload className="h-12 w-12" />}
						title="No public albums found"
						description={
							searchQuery
								? "Try adjusting your search terms"
								: "There are no public albums available at the moment"
						}
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredAlbums.map((album) => (
							<Link
								key={album.id}
								to={`/public/albums/${album.shortUrl}`}
								className="block h-full">
								<Card className="cursor-pointer h-full flex flex-col hover:scale-[1.02] transition-all duration-300 border-[#E8D4B8] hover:border-[#D9C19D]">
									<CardHeader className="pb-3 pt-4">
										<CardTitle className="text-xl font-semibold truncate group-hover:text-[#8B2E3C] transition-colors text-[#8B7355]">
											{album.name}
										</CardTitle>
									</CardHeader>
									<CardContent className="flex-1 flex flex-col justify-between">
										<div>
											{album.description && (
												<p className="text-sm text-[#6B5A42] mb-3 line-clamp-2">
													{album.description}
												</p>
											)}
											<div className="space-y-2 mb-3">
												{album.eventDate && (
													<div className="flex items-center gap-2 text-xs text-[#A68F75]">
														<Calendar className="h-3 w-3" />
														{new Date(album.eventDate).toLocaleDateString()}
													</div>
												)}
												{album.eventLocation && (
													<div className="flex items-center gap-2 text-xs text-[#A68F75]">
														<MapPin className="h-3 w-3" />
														{album.eventLocation}
													</div>
												)}
											</div>
										</div>
										<div className="flex items-center justify-between pt-3 border-t border-[#E8D4B8]">
											<div className="flex items-center gap-4 text-xs text-[#6B5A42]">
												<div className="flex items-center gap-1">
													<Image className="h-3 w-3" />
													{album._count.media}{" "}
													{album._count.media === 1 ? "item" : "items"}
												</div>
												<div className="flex items-center gap-1">
													<Eye className="h-3 w-3" />
													{album.viewCount} views
												</div>
												{album.uniqueContributors > 0 && (
													<div className="flex items-center gap-1">
														<Users className="h-3 w-3" />
														{album.uniqueContributors}{" "}
														{album.uniqueContributors === 1
															? "contributor"
															: "contributors"}
													</div>
												)}
											</div>
											<div className="flex items-center gap-1 text-xs text-[#5A8BB0]">
												<Globe className="h-3 w-3" />
												Public
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				)}

				{/* Results count */}
				{searchQuery && filteredAlbums.length > 0 && (
					<div className="mt-6 text-center text-sm text-[#6B5A42]">
						Found {filteredAlbums.length}{" "}
						{filteredAlbums.length === 1 ? "album" : "albums"} matching "
						{searchQuery}"
					</div>
				)}
			</div>
		</div>
	)
}
