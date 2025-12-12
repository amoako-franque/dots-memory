import { useEffect, useState, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAppSelector } from "../../store/hooks"
import {
	Plus,
	Folder,
	Lock,
	Globe,
	Search,
	Trash2,
	Archive,
	Download,
	Key,
	X,
	AlertCircle,
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/Card"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { LoadingSpinner } from "../../components/ui/LoadingSpinner"
import { ErrorDisplay } from "../../components/ui/ErrorDisplay"
import { EmptyState } from "../../components/ui/EmptyState"
import { Checkbox } from "../../components/ui/Checkbox"
import { useNotifications } from "../../components/notifications/NotificationSystem"
import api from "../../lib/api"

interface Album {
	id: string
	name: string
	privacy: "PUBLIC" | "PRIVATE"
	ownerId?: string
	shortUrl?: string
	_count: {
		media: number
	}
	createdAt: string
}

export default function AlbumListPage() {
	const { showSuccess, showError } = useNotifications()
	const navigate = useNavigate()
	const user = useAppSelector((state) => state.auth.user)
	const [albums, setAlbums] = useState<Album[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState("")
	const [privacyFilter, setPrivacyFilter] = useState<
		"ALL" | "PUBLIC" | "PRIVATE"
	>("ALL")
	const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest")
	const [selectedAlbums, setSelectedAlbums] = useState<Set<string>>(new Set())
	const [showBulkActions, setShowBulkActions] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [isArchiving, setIsArchiving] = useState(false)
	const [accessCodeModal, setAccessCodeModal] = useState<{
		isOpen: boolean
		album: Album | null
	}>({
		isOpen: false,
		album: null,
	})
	const [accessCode, setAccessCode] = useState("")
	const [isVerifying, setIsVerifying] = useState(false)
	const [accessCodeError, setAccessCodeError] = useState<string | null>(null)

	const handleAccessCodeSubmit = async () => {
		if (!accessCodeModal.album || !accessCode.trim()) {
			setAccessCodeError("Please enter an access code")
			return
		}

		setIsVerifying(true)
		setAccessCodeError(null)

		try {
			if (!accessCodeModal.album.shortUrl) {
				setAccessCodeError("Album URL not available")
				return
			}

			const response = await api.post(
				`/public/album/${accessCodeModal.album.shortUrl}/verify-access`,
				{ accessCode },
				{ withCredentials: true }
			)

			if (response.data.success && response.data.data.valid) {
				const sessionToken =
					response.data.data.sessionToken || response.headers["x-session-token"]
				if (sessionToken && accessCodeModal.album.shortUrl) {
					localStorage.setItem(
						`album_session_${accessCodeModal.album.shortUrl}`,
						sessionToken
					)
				}
				showSuccess("Access granted! Redirecting...")
				setAccessCodeModal({ isOpen: false, album: null })
				setAccessCode("")
				if (accessCodeModal.album.shortUrl) {
					navigate(`/public/albums/${accessCodeModal.album.shortUrl}`)
				}
			} else {
				setAccessCodeError("Invalid access code. Please try again.")
			}
		} catch (err: any) {
			const errorData = err.response?.data?.error
			let errorMessage = errorData?.message || "Failed to verify access code"

			if (errorData?.code === "ACCESS_CODE_LOCKED") {
				const unlockAt = errorData?.unlockAt
				if (unlockAt) {
					const unlockDate = new Date(unlockAt)
					const now = new Date()
					const minutesLeft = Math.ceil(
						(unlockDate.getTime() - now.getTime()) / (1000 * 60)
					)
					errorMessage = `Too many failed attempts. Please try again in ${minutesLeft} minute${
						minutesLeft !== 1 ? "s" : ""
					}.`
				} else {
					errorMessage = "Too many failed attempts. Please try again later."
				}
			}

			setAccessCodeError(errorMessage)
			showError(errorMessage)
		} finally {
			setIsVerifying(false)
		}
	}

	const fetchAlbums = async () => {
		try {
			setIsLoading(true)
			setError(null)
			const response = await api.get("/albums")
			setAlbums(response.data.data.albums)
		} catch (err: any) {
			const errorMessage =
				err.response?.data?.error?.message || "Failed to load albums"
			setError(errorMessage)
			showError(errorMessage)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchAlbums()
	}, [])

	const filteredAndSortedAlbums = useMemo(() => {
		let filtered = albums.filter((album) => {
			const matchesSearch = album.name
				.toLowerCase()
				.includes(searchQuery.toLowerCase())
			const matchesPrivacy =
				privacyFilter === "ALL" || album.privacy === privacyFilter
			return matchesSearch && matchesPrivacy
		})

		filtered.sort((a, b) => {
			switch (sortBy) {
				case "newest":
					return (
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					)
				case "oldest":
					return (
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
					)
				case "name":
					return a.name.localeCompare(b.name)
				default:
					return 0
			}
		})

		return filtered
	}, [albums, searchQuery, privacyFilter, sortBy])

	const toggleSelectAlbum = (albumId: string) => {
		const newSelected = new Set(selectedAlbums)
		if (newSelected.has(albumId)) {
			newSelected.delete(albumId)
		} else {
			newSelected.add(albumId)
		}
		setSelectedAlbums(newSelected)
		setShowBulkActions(newSelected.size > 0)
	}

	const selectAll = () => {
		if (selectedAlbums.size === filteredAndSortedAlbums.length) {
			setSelectedAlbums(new Set())
			setShowBulkActions(false)
		} else {
			setSelectedAlbums(new Set(filteredAndSortedAlbums.map((a) => a.id)))
			setShowBulkActions(true)
		}
	}

	const handleBulkDelete = async () => {
		if (
			!confirm(
				`Are you sure you want to delete ${selectedAlbums.size} album(s)?`
			)
		)
			return

		try {
			setIsDeleting(true)
			await Promise.all(
				Array.from(selectedAlbums).map((id) => api.delete(`/albums/${id}`))
			)
			const count = selectedAlbums.size
			setAlbums(albums.filter((a) => !selectedAlbums.has(a.id)))
			setSelectedAlbums(new Set())
			setShowBulkActions(false)
			showSuccess(`Successfully deleted ${count} album${count > 1 ? "s" : ""}`)
		} catch (err: any) {
			const errorMessage =
				err.response?.data?.error?.message || "Failed to delete albums"
			showError(errorMessage)
		} finally {
			setIsDeleting(false)
		}
	}

	const handleBulkArchive = async () => {
		try {
			setIsArchiving(true)
			await Promise.all(
				Array.from(selectedAlbums).map((id) =>
					api.post(`/albums/${id}/archive`)
				)
			)
			const count = selectedAlbums.size
			setSelectedAlbums(new Set())
			setShowBulkActions(false)
			const response = await api.get("/albums")
			setAlbums(response.data.data.albums)
			showSuccess(`Successfully archived ${count} album${count > 1 ? "s" : ""}`)
		} catch (err: any) {
			const errorMessage =
				err.response?.data?.error?.message || "Failed to archive albums"
			showError(errorMessage)
		} finally {
			setIsArchiving(false)
		}
	}

	const handleExport = async () => {
		try {
			const albumsToExport = albums.filter((a) => selectedAlbums.has(a.id))
			const dataStr = JSON.stringify(albumsToExport, null, 2)
			const dataBlob = new Blob([dataStr], { type: "application/json" })
			const url = URL.createObjectURL(dataBlob)
			const link = document.createElement("a")
			link.href = url
			link.download = `albums-export-${new Date().toISOString()}.json`
			link.click()
			URL.revokeObjectURL(url)
			showSuccess(
				`Exported ${albumsToExport.length} album${
					albumsToExport.length > 1 ? "s" : ""
				}`
			)
		} catch (err: any) {
			const errorMessage =
				err.response?.data?.error?.message || "Failed to export albums"
			showError(errorMessage)
		}
	}

	if (isLoading) {
		return <LoadingSpinner text="Loading albums..." fullScreen />
	}

	if (error) {
		return <ErrorDisplay message={error} onRetry={fetchAlbums} />
	}

	return (
		<div>
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
				<div>
					<h1 className="text-4xl font-bold text-[#8B7355]">All Albums</h1>
					<p className="text-[#6B5A42] mt-1">
						Your albums and discoverable public albums
					</p>
				</div>
				<Link to="/albums/create">
					<Button size="lg" className="shadow-lg">
						<Plus className="mr-2 h-5 w-5" />
						Create Album
					</Button>
				</Link>
			</div>

			{/* Search and Filter */}
			<Card className="mb-6 border-2 border-[#E8D4B8]">
				<CardContent className="p-4">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B5A42]" />
								<Input
									placeholder="Search albums..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
							<Select
								value={privacyFilter}
								onChange={(e) => setPrivacyFilter(e.target.value as any)}
								options={[
									{ value: "ALL", label: "All Privacy" },
									{ value: "PUBLIC", label: "Public" },
									{ value: "PRIVATE", label: "Private" },
								]}
								className="w-full sm:w-auto"
							/>
							<Select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value as any)}
								options={[
									{ value: "newest", label: "Newest First" },
									{ value: "oldest", label: "Oldest First" },
									{ value: "name", label: "Name A-Z" },
								]}
								className="w-full sm:w-auto"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Bulk Actions */}
			{showBulkActions && (
				<Card className="mb-6 border-2 border-[#8B2E3C] bg-[#F5E8EA]">
					<CardContent className="p-4">
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
							<span className="text-[#8B7355] font-medium text-sm sm:text-base">
								{selectedAlbums.size} album(s) selected
							</span>
							<div className="flex flex-wrap gap-2 w-full sm:w-auto">
								<Button variant="secondary" size="sm" onClick={handleExport}>
									<Download className="mr-2 h-4 w-4" />
									<span className="hidden sm:inline">Export</span>
								</Button>
								<Button
									variant="secondary"
									size="sm"
									onClick={handleBulkArchive}
									isLoading={isArchiving}>
									<Archive className="mr-2 h-4 w-4" />
									<span className="hidden sm:inline">Archive</span>
								</Button>
								<Button
									variant="secondary"
									size="sm"
									onClick={handleBulkDelete}
									isLoading={isDeleting}
									className="border-red-300 text-red-600 hover:bg-red-50">
									<Trash2 className="mr-2 h-4 w-4" />
									<span className="hidden sm:inline">Delete</span>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setSelectedAlbums(new Set())
										setShowBulkActions(false)
									}}>
									Cancel
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{filteredAndSortedAlbums.length === 0 ? (
				<EmptyState
					icon={<Folder className="h-12 w-12" />}
					title={
						searchQuery || privacyFilter !== "ALL"
							? "No albums found"
							: "No albums yet"
					}
					description={
						searchQuery || privacyFilter !== "ALL"
							? "Try adjusting your search or filter criteria."
							: "Create your first album to start sharing and organizing your memories."
					}
					action={
						!searchQuery && privacyFilter === "ALL"
							? {
									label: "Create Your First Album",
									onClick: () => (window.location.href = "/albums/create"),
							  }
							: undefined
					}
				/>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					<div className="col-span-full flex items-center gap-2 mb-2">
						<Checkbox
							checked={
								selectedAlbums.size === filteredAndSortedAlbums.length &&
								filteredAndSortedAlbums.length > 0
							}
							onChange={selectAll}
							indeterminate={
								selectedAlbums.size > 0 &&
								selectedAlbums.size < filteredAndSortedAlbums.length
							}
						/>
						<span className="text-sm text-[#6B5A42]">
							Select all ({filteredAndSortedAlbums.length} albums)
						</span>
					</div>
					{filteredAndSortedAlbums.map((album) => {
						const isOwnAlbum = user && album.ownerId === user.id
						const isPrivateNotOwned = album.privacy === "PRIVATE" && !isOwnAlbum

						return (
							<div key={album.id} className="relative group">
								{isPrivateNotOwned ? (
									<div
										className="block h-full cursor-pointer"
										onClick={() => setAccessCodeModal({ isOpen: true, album })}>
										<Card className="h-full flex flex-col hover:scale-[1.02] transition-all duration-300 border-[#E8D4B8] hover:border-[#D9C19D] opacity-75">
											<CardHeader className="pb-3 pt-4">
												<div className="flex items-start justify-between gap-2">
													<CardTitle className="text-xl font-semibold truncate flex-1 group-hover:text-[#8B2E3C] transition-colors text-[#8B7355] pr-8">
														{album.name}
													</CardTitle>
												</div>
											</CardHeader>
											<CardContent className="flex-1 flex flex-col justify-between">
												<div>
													<div className="flex items-center justify-between mb-2">
														<p className="text-sm font-medium text-[#6B5A42]">
															{album._count.media}{" "}
															{album._count.media === 1 ? "item" : "items"}
														</p>
														<div className="flex-shrink-0">
															<Lock className="h-4 w-4 text-[#6B5A42]" />
														</div>
													</div>
													<p className="text-xs text-[#A68F75]">
														Created{" "}
														{new Date(album.createdAt).toLocaleDateString(
															"en-US",
															{
																year: "numeric",
																month: "short",
																day: "numeric",
															}
														)}
													</p>
													<div className="mt-3 pt-3 border-t border-[#E8D4B8]">
														<Button
															variant="primary"
															size="sm"
															className="w-full"
															onClick={(e) => {
																e.preventDefault()
																e.stopPropagation()
																setAccessCodeModal({ isOpen: true, album })
															}}>
															<Lock className="mr-2 h-4 w-4" />
															Enter Access Code
														</Button>
													</div>
												</div>
											</CardContent>
										</Card>
									</div>
								) : (
									<Link to={`/albums/${album.id}`} className="block h-full">
										<Card className="cursor-pointer h-full flex flex-col hover:scale-[1.02] transition-all duration-300 border-[#E8D4B8] hover:border-[#D9C19D]">
											<CardHeader className="pb-3 pt-4">
												<div className="flex items-start justify-between gap-2">
													<CardTitle className="text-xl font-semibold truncate flex-1 group-hover:text-[#8B2E3C] transition-colors text-[#8B7355] pr-8">
														{album.name}
													</CardTitle>
												</div>
											</CardHeader>
											<CardContent className="flex-1 flex flex-col justify-between">
												<div>
													<div className="flex items-center justify-between mb-2">
														<p className="text-sm font-medium text-[#6B5A42]">
															{album._count.media}{" "}
															{album._count.media === 1 ? "item" : "items"}
														</p>
														<div className="flex-shrink-0">
															{album.privacy === "PRIVATE" ? (
																<Lock className="h-4 w-4 text-[#6B5A42]" />
															) : (
																<Globe className="h-4 w-4 text-[#5A8BB0]" />
															)}
														</div>
													</div>
													<p className="text-xs text-[#A68F75]">
														Created{" "}
														{new Date(album.createdAt).toLocaleDateString(
															"en-US",
															{
																year: "numeric",
																month: "short",
																day: "numeric",
															}
														)}
													</p>
												</div>
											</CardContent>
										</Card>
									</Link>
								)}
								{!isPrivateNotOwned && (
									<div
										className="absolute top-3 right-3 z-10"
										onClick={(e) => {
											e.preventDefault()
											e.stopPropagation()
											toggleSelectAlbum(album.id)
										}}>
										<Checkbox
											checked={selectedAlbums.has(album.id)}
											onChange={() => toggleSelectAlbum(album.id)}
										/>
									</div>
								)}
							</div>
						)
					})}
				</div>
			)}

			{/* Access Code Modal */}
			{accessCodeModal.isOpen && accessCodeModal.album && (
				<div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
					<Card className="max-w-md w-full border-2 border-[#E8D4B8] bg-white shadow-xl">
						<CardContent className="p-6">
							<div className="flex items-start gap-4">
								<div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-[#8B2E3C] bg-opacity-10">
									<Key className="h-6 w-6 text-[#8B2E3C]" />
								</div>
								<div className="flex-1">
									<div className="flex items-center justify-between mb-2">
										<h3 className="text-xl font-semibold text-[#8B7355]">
											Enter Access Code
										</h3>
										<button
											onClick={() => {
												setAccessCodeModal({ isOpen: false, album: null })
												setAccessCode("")
												setAccessCodeError(null)
											}}
											className="text-[#A68F75] hover:text-[#8B7355] transition-colors">
											<X className="h-5 w-5" />
										</button>
									</div>
									<p className="text-sm text-[#6B5A42] mb-4">
										This album is private. Enter the access code to view it.
									</p>
									{accessCodeModal.album.name && (
										<p className="text-sm font-medium text-[#8B7355] mb-4">
											Album: {accessCodeModal.album.name}
										</p>
									)}
									<div className="space-y-3">
										<div>
											<label
												htmlFor="accessCode"
												className="block text-sm font-medium text-[#6B5A42] mb-2">
												Access Code
											</label>
											<Input
												id="accessCode"
												type="text"
												value={accessCode}
												onChange={(e) => {
													setAccessCode(e.target.value.toUpperCase())
													setAccessCodeError(null)
												}}
												onKeyDown={(e) => {
													if (
														e.key === "Enter" &&
														!isVerifying &&
														accessCode.trim()
													) {
														e.preventDefault()
														handleAccessCodeSubmit()
													}
												}}
												placeholder="Enter access code"
												className="font-mono"
												autoFocus
												disabled={isVerifying}
											/>
										</div>
										{accessCodeError && (
											<div className="flex items-center gap-2 text-sm text-[#8B2E3C] bg-[#F5E8EA] border border-[#D9A0A8] rounded-lg p-3">
												<AlertCircle className="h-4 w-4 flex-shrink-0" />
												<span>{accessCodeError}</span>
											</div>
										)}
										<div className="flex gap-3 justify-end">
											<Button
												variant="secondary"
												size="sm"
												onClick={() => {
													setAccessCodeModal({ isOpen: false, album: null })
													setAccessCode("")
													setAccessCodeError(null)
												}}
												disabled={isVerifying}>
												Cancel
											</Button>
											<Button
												variant="primary"
												size="sm"
												onClick={handleAccessCodeSubmit}
												disabled={isVerifying || !accessCode.trim()}
												isLoading={isVerifying}>
												<Key className="mr-2 h-4 w-4" />
												Access Album
											</Button>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	)
}
