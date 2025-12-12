import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { LoadingSpinner } from "../../components/ui/LoadingSpinner"
import { ErrorDisplay } from "../../components/ui/ErrorDisplay"
import { EmptyState } from "../../components/ui/EmptyState"
import { useNotifications } from "../../components/notifications/NotificationSystem"
import PublicUploadZone from "../../components/upload/PublicUploadZone"
import AccessCodeEntry from "../../components/public/AccessCodeEntry"
import { Upload, Image, Video, Camera } from "lucide-react"
import axios from "axios"

const PUBLIC_API_URL =
	import.meta.env.VITE_API_URL || "http://localhost:30700/api/v1"

interface Media {
	id: string
	type: "IMAGE" | "VIDEO"
	cdnUrl: string
	thumbnailUrl?: string
	fileName: string
}

interface Album {
	id: string
	name: string
	description?: string
	uploadDescription?: string
	media: Media[]
	mediaUrls?: Array<{
		id: string
		type: string
		url: string
		thumbnailUrl?: string
		fileName: string
	}>
	qrCodeUrl?: string
	identifier?: string
	requireContributorName?: boolean
	requiresAccessCode?: boolean
	allowVideos?: boolean
}

export default function PublicAlbumPage() {
	const { showError: showToastError } = useNotifications()
	const { id } = useParams<{ id: string }>()
	const [album, setAlbum] = useState<Album | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showUpload, setShowUpload] = useState(false)
	const [sessionToken, setSessionToken] = useState<string | null>(null)
	const [requiresAccessCode, setRequiresAccessCode] = useState(false)
	const [remainingAttempts, setRemainingAttempts] = useState<
		number | undefined
	>(undefined)

	const getSessionToken = () => {
		if (sessionToken) return sessionToken
		if (id) {
			const stored = localStorage.getItem(`album_session_${id}`)
			if (stored) {
				setSessionToken(stored)
				return stored
			}
		}
		return null
	}

	const createApiClient = () => {
		const token = getSessionToken()
		const client = axios.create({
			baseURL: PUBLIC_API_URL,
		})

		if (token) {
			client.defaults.headers.common["x-session-token"] = token
		}

		return client
	}

	useEffect(() => {
		const fetchAlbum = async () => {
			if (!id) {
				setError("Invalid album identifier")
				setIsLoading(false)
				return
			}

			try {
				setIsLoading(true)
				setError(null)

				const apiClient = createApiClient()

				const albumResponse = await apiClient.get(`/public/album/${id}`)

				if (!albumResponse.data.success || !albumResponse.data.data?.album) {
					throw new Error("Invalid album response")
				}

				const albumData = albumResponse.data.data.album

				/* TODO: Check if access code is required */
				if (
					albumResponse.data.data.requiresAccessCode ||
					albumData.requiresAccessCode
				) {
					setRequiresAccessCode(true)
					setRemainingAttempts(albumResponse.data.data.remainingAttempts)
					setAlbum({
						...albumData,
						media: [],
					})
					setIsLoading(false)
					return
				}

				const newSessionToken = albumResponse.headers["x-session-token"]
				if (newSessionToken && id) {
					setSessionToken(newSessionToken)
					localStorage.setItem(`album_session_${id}`, newSessionToken)
				}

				/* TODO: Fetch media if access code not required or verified */
				const mediaResponse = await apiClient
					.get(`/public/album/${id}/media`)
					.catch(() => ({
						data: {
							data: {
								media: [],
								pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
							},
						},
					}))

				const mediaData = mediaResponse.data?.data?.media || []

				setAlbum({
					...albumData,
					media: Array.isArray(mediaData) ? mediaData : [],
				})
				setRequiresAccessCode(false)
			} catch (err: any) {
				console.error("Error fetching album:", err)
				const errorData = err.response?.data?.error

				if (errorData?.code === "ACCOUNT_LOCKED") {
					setError(
						errorData.message ||
							"Too many failed attempts. Please try again later."
					)
					setRequiresAccessCode(true)
					setSessionToken(null)
					if (id) {
						localStorage.removeItem(`album_session_${id}`)
					}
				} else if (errorData?.code === "ALBUM_EXPIRED") {
					setError("This album has expired and is no longer accessible.")
					setAlbum(null)
				} else if (
					err.response?.status === 401 &&
					errorData?.code === "INVALID_ACCESS_CODE"
				) {
					setRequiresAccessCode(true)
					setRemainingAttempts(errorData.remainingAttempts)
					setSessionToken(null)
					if (id) {
						localStorage.removeItem(`album_session_${id}`)
					}
				} else if (errorData?.code === "ACCESS_CODE_REQUIRED") {
					/* TODO: Handle access code required */
					setRequiresAccessCode(true)
				} else {
					const errorMessage =
						errorData?.message ||
						err.message ||
						"Failed to load album. It might be private or deleted."
					setError(errorMessage)
					setAlbum(null)
					showToastError(errorMessage)
				}
			} finally {
				setIsLoading(false)
			}
		}

		fetchAlbum()
	}, [id, sessionToken])

	const handleAccessCodeVerified = (token: string) => {
		setSessionToken(token)
		if (id) {
			localStorage.setItem(`album_session_${id}`, token)
		}
		setRequiresAccessCode(false)
		setRemainingAttempts(undefined)
	}

	const handleUploadComplete = () => {
		setShowUpload(false)
		if (id) {
			const apiClient = createApiClient()
			Promise.all([
				apiClient.get(`/public/album/${id}`),
				apiClient
					.get(`/public/album/${id}/media`)
					.catch(() => ({ data: { data: { media: [] } } })),
			])
				.then(([albumResponse, mediaResponse]) => {
					const albumData = albumResponse.data.data.album
					const mediaData = mediaResponse.data.data.media || []
					setAlbum({
						...albumData,
						media: mediaData,
					})
				})
				.catch((err) => {
					console.error("Error refreshing album:", err)
					showToastError("Failed to refresh album")
				})
		}
	}

	if (isLoading) {
		return <LoadingSpinner text="Loading album..." fullScreen />
	}

	/* TODO: Show access code entry if required */
	if (requiresAccessCode && album) {
		return (
			<AccessCodeEntry
				albumId={id || ""}
				albumName={album.name}
				onVerified={handleAccessCodeVerified}
				remainingAttempts={remainingAttempts}
			/>
		)
	}

	if (error || !album) {
		return <ErrorDisplay message={error || "Album not found"} />
	}

	return (
		<div className="min-h-screen bg-[#FDF8F3] py-8">
			<div className="container mx-auto px-4 max-w-7xl">
				<div className="mb-8 text-center px-4">
					<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#8B7355] mb-2">
						{album.name}
					</h1>
					{album.description && (
						<p className="text-[#6B5A42] text-base sm:text-lg mb-2 px-4">
							{album.description}
						</p>
					)}
					<p className="text-[#6B5A42] text-sm sm:text-base">Shared Album</p>
				</div>

				{/* Upload Section - Prominent */}
				<div className="mb-8 max-w-4xl mx-auto">
					<Card className="border-2 border-[#A8C5D9] bg-gradient-to-br from-[#F0F6FA] to-[#FDF8F3] shadow-lg">
						<CardContent className="p-8">
							<div className="text-center mb-6">
								<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#8B2E3C] mb-4">
									<Camera className="h-10 w-10 text-white" />
								</div>
								<h2 className="text-3xl font-bold text-[#8B7355] mb-3">
									Share Your Memories
								</h2>
								{album.uploadDescription ? (
									<p className="text-[#6B5A42] text-lg mb-4 max-w-2xl mx-auto">
										{album.uploadDescription}
									</p>
								) : (
									<p className="text-[#6B5A42] text-lg mb-4 max-w-2xl mx-auto">
										Upload your best photos and videos from this event!
									</p>
								)}
							</div>

							{!showUpload ? (
								<div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
									<Button
										onClick={() => setShowUpload(true)}
										variant="primary"
										size="lg"
										className="w-full sm:w-auto sm:min-w-[200px]">
										<Image className="mr-2 h-5 w-5" />
										<span className="hidden sm:inline">Upload Photos</span>
										<span className="sm:hidden">Upload</span>
									</Button>
									{album.allowVideos && (
										<Button
											onClick={() => setShowUpload(true)}
											variant="primary"
											size="lg"
											className="w-full sm:w-auto sm:min-w-[200px]">
											<Video className="mr-2 h-5 w-5" />
											<span className="hidden sm:inline">Upload Videos</span>
											<span className="sm:hidden">Videos</span>
										</Button>
									)}
								</div>
							) : (
								<div>
									<div className="flex justify-between items-center mb-4">
										<h3 className="text-xl font-semibold text-[#8B7355]">
											Upload Media
										</h3>
										<Button
											onClick={() => setShowUpload(false)}
											variant="secondary"
											size="sm">
											Cancel
										</Button>
									</div>
									<PublicUploadZone
										albumIdentifier={id || ""}
										onUploadComplete={handleUploadComplete}
										requireContributorName={album.requireContributorName}
										sessionToken={getSessionToken()}
									/>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Media Gallery */}
				{!album.media || album.media.length === 0 ? (
					<EmptyState
						icon={<Upload className="h-12 w-12" />}
						title="No media yet"
						description="Be the first to share your photos and videos!"
						action={
							!showUpload
								? {
										label: "Upload Media",
										onClick: () => setShowUpload(true),
								  }
								: undefined
						}
					/>
				) : (
					<div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
						{album.media.map((item) => {
							// Helper to get image URL from mediaUrls or media item
							const getImageUrl = () => {
								// First check mediaUrls array
								if (album.mediaUrls) {
									const mediaUrlItem = album.mediaUrls.find(
										(mu) => mu.id === item.id
									)
									if (mediaUrlItem?.url && mediaUrlItem.url.trim() !== "") {
										return mediaUrlItem.url
									}
									if (
										mediaUrlItem?.thumbnailUrl &&
										mediaUrlItem.thumbnailUrl.trim() !== ""
									) {
										return mediaUrlItem.thumbnailUrl
									}
								}

								// Fallback to media item's URLs
								if (item.thumbnailUrl && item.thumbnailUrl.trim() !== "") {
									return item.thumbnailUrl
								}
								if (item.cdnUrl && item.cdnUrl.trim() !== "") {
									return item.cdnUrl
								}

								return null
							}

							const getThumbnailUrl = () => {
								if (album.mediaUrls) {
									const mediaUrlItem = album.mediaUrls.find(
										(mu) => mu.id === item.id
									)
									if (
										mediaUrlItem?.thumbnailUrl &&
										mediaUrlItem.thumbnailUrl.trim() !== ""
									) {
										return mediaUrlItem.thumbnailUrl
									}
								}
								if (item.thumbnailUrl && item.thumbnailUrl.trim() !== "") {
									return item.thumbnailUrl
								}
								return null
							}

							const imageUrl = getImageUrl()
							const thumbUrl = getThumbnailUrl()

							return (
								<Card
									key={item.id}
									className="overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all duration-300 border-[#E8D4B8] hover:border-[#D9C19D]">
									<CardContent className="p-0">
										{item.type === "IMAGE" ? (
											imageUrl || thumbUrl ? (
												<img
													src={thumbUrl || imageUrl || ""}
													alt={item.fileName}
													className="w-full h-48 object-cover group-hover:brightness-110 transition-all duration-300"
													onError={(e) => {
														// Fallback to full image if thumbnail fails
														if (thumbUrl && imageUrl && thumbUrl !== imageUrl) {
															;(e.target as HTMLImageElement).src = imageUrl
														}
													}}
												/>
											) : (
												<div className="w-full h-48 bg-[#F5E6D3] border-2 border-[#E8D4B8] flex items-center justify-center">
													<span className="text-[#6B5A42] font-medium">
														Loading...
													</span>
												</div>
											)
										) : (
											<div className="w-full h-48 bg-[#F5E6D3] border-2 border-[#E8D4B8] flex items-center justify-center group-hover:bg-[#E8D4B8] transition-all duration-300">
												<span className="text-[#6B5A42] font-medium">
													Video
												</span>
											</div>
										)}
									</CardContent>
								</Card>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}
