import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAppSelector } from "../../store/hooks"
import {
	ArrowLeft,
	Settings,
	Share2,
	Upload,
	Copy,
	Download,
	QrCode,
	Radio,
	BarChart3,
	Trash2,
	Eye,
	FileText,
	Calendar,
	Video,
	Edit2,
	Save,
	X,
	Maximize2,
	Users,
	Archive,
	ArchiveRestore,
	Key,
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Card, CardContent } from "../../components/ui/Card"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { Checkbox } from "../../components/ui/Checkbox"
import { ConfirmModal } from "../../components/ui/ConfirmModal"
import { Tooltip } from "../../components/ui/Tooltip"
import UploadZone from "../../components/upload/UploadZone"
import MediaReactions from "../../components/media/MediaReactions"
import ImageLightbox from "../../components/media/ImageLightbox"
import api from "../../lib/api"

interface Media {
	id: string
	type: "IMAGE" | "VIDEO"
	cdnUrl: string
	thumbnailUrl?: string
	fileName: string
	caption?: string
	viewCount?: number
	downloadCount?: number
	reactionCount?: number
	width?: number
	height?: number
}

interface ShareInfo {
	shortUrl: string
	qrCodeId: string
	nfcId: string
	accessUrl: string
	qrCodeDataUrl: string
	nfcMessage: string
	accessCode?: string
}

interface Album {
	id: string
	ownerId: string
	name: string
	description: string | null
	slug: string
	qrCodeId: string
	nfcId: string
	shortUrl: string
	status: "ACTIVE" | "ARCHIVED" | "DELETED"
	privacy: "PUBLIC" | "PRIVATE"
	maxFileSizeMB: number
	maxVideoLengthSec: number
	allowVideos: boolean
	requireContributorName: boolean
	enableReactions: boolean
	eventDate: string | null
	eventLocation: string | null
	expiresAt: string | null
	autoArchiveAt: string | null
	mediaCount: number
	totalSizeBytes: string
	viewCount: number
	downloadCount: number
	uniqueContributors: number
	createdAt: string
	updatedAt: string
	lastActivityAt: string
	media: Media[]
	mediaUrls?: Array<{
		id: string
		type: string
		url: string
		thumbnailUrl?: string
		fileName: string
	}>
	shareInfo?: ShareInfo
	accessCode?: string
}

export default function AlbumDetailsPage() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const user = useAppSelector((state) => state.auth.user)
	const [album, setAlbum] = useState<Album | null>(null)
	const isOwner = Boolean(album && user && album.ownerId === user.id)
	const [editedAlbum, setEditedAlbum] = useState<Partial<Album>>({})
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [mediaToDelete, setMediaToDelete] = useState<{
		id: string
		fileName: string
	} | null>(null)
	const [isDeletingMedia, setIsDeletingMedia] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const [showUpload, setShowUpload] = useState(false)
	const [showSettings, setShowSettings] = useState(false)
	const [showShare, setShowShare] = useState(false)
	const [shareMessage, setShareMessage] = useState<string | null>(null)
	const [hasChanges, setHasChanges] = useState(false)
	const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
	const [showLightbox, setShowLightbox] = useState(false)
	const [showContributors, setShowContributors] = useState(false)
	const [contributors, setContributors] = useState<any[]>([])
	const [isLoadingContributors, setIsLoadingContributors] = useState(false)
	const [accessCodes, setAccessCodes] = useState<
		Array<{
			id: string
			accessCode?: string
			note?: string | null
			isBlacklisted: boolean
			blacklistedAt?: string | null
			createdAt: string
		}>
	>([])
	const [isLoadingAccessCodes, setIsLoadingAccessCodes] = useState(false)
	const [newCodeNote, setNewCodeNote] = useState("")
	const [confirmModal, setConfirmModal] = useState<{
		isOpen: boolean
		action: "delete" | "blacklist" | "restore" | null
		accessCodeId: string | null
		accessCode?: string
	}>({
		isOpen: false,
		action: null,
		accessCodeId: null,
	})

	const fetchAlbum = async () => {
		if (!id) {
			setError("Album ID is missing")
			setIsLoading(false)
			return
		}

		try {
			setIsLoading(true)
			setError(null)

			const response = await api.get(`/albums/${id}`)
			const albumData = response.data?.data?.album

			if (!albumData) {
				setError("Album not found")
				setIsLoading(false)
				return
			}

			const fullAlbum = {
				...albumData,
				media: Array.isArray(albumData.media) ? albumData.media : [],
			}
			setAlbum(fullAlbum)
			setEditedAlbum({})
			setHasChanges(false)
			setError(null)
		} catch (err: any) {
			console.error("Error fetching album:", err)
			const errorMessage =
				err.response?.data?.error?.message ||
				err.message ||
				"Failed to load album"
			setError(errorMessage)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchAlbum()
	}, [id])

	const fetchAccessCodes = async () => {
		if (!id || !album || album.privacy !== "PRIVATE") return

		try {
			setIsLoadingAccessCodes(true)
			const response = await api.get(`/albums/${id}/access-codes`)
			const codes = response.data?.data?.accessCodes || []
			setAccessCodes(codes)
		} catch (err: any) {
			console.error("Error fetching access codes:", err)
		} finally {
			setIsLoadingAccessCodes(false)
		}
	}

	useEffect(() => {
		if (album && album.privacy === "PRIVATE") {
			fetchAccessCodes()
		}
	}, [album, id])

	const handleUploadComplete = () => {
		setShowUpload(false)
		if (id) {
			api
				.get(`/albums/${id}`)
				.then((response) => {
					const albumData = response.data?.data?.album
					if (albumData) {
						setAlbum({
							...albumData,
							media: Array.isArray(albumData.media) ? albumData.media : [],
						})
					}
				})
				.catch((err) => {
					console.error("Error refreshing album:", err)
				})
		}
	}

	const handleShare = () => {
		setShowShare(!showShare)
	}

	const copyToClipboard = async (text: string, message: string) => {
		try {
			await navigator.clipboard.writeText(text)
			setShareMessage(message)
			setTimeout(() => setShareMessage(null), 3000)
		} catch (err) {
			console.error("Failed to copy:", err)
			setShareMessage("Failed to copy to clipboard")
			setTimeout(() => setShareMessage(null), 3000)
		}
	}

	const copyShareInfo = async () => {
		if (!album?.shareInfo) return

		const shareData: string[] = []
		shareData.push(`Album: ${album.name}`)
		shareData.push(`Link: ${album.shareInfo.accessUrl}`)
		shareData.push(`QR Code ID: ${album.shareInfo.qrCodeId}`)
		shareData.push(`NFC Message: ${album.shareInfo.nfcMessage}`)

		if (album.privacy === "PRIVATE" && album.accessCode) {
			shareData.push(`Access Code: ${album.accessCode}`)
		}

		const shareText = shareData.join("\n")
		await copyToClipboard(
			shareText,
			"All share information copied to clipboard!"
		)
	}

	const downloadQRCode = () => {
		if (!album?.shareInfo?.qrCodeDataUrl) return

		const link = document.createElement("a")
		link.href = album.shareInfo.qrCodeDataUrl
		link.download = `album-${album.name || album.id}-qr-code.png`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		setShareMessage("QR code downloaded!")
		setTimeout(() => setShareMessage(null), 3000)
	}

	const handleSettings = () => {
		setShowSettings(!showSettings)
		if (!showSettings && album) {
			setEditedAlbum({
				name: album.name,
				description: album.description || "",
				privacy: album.privacy,
				eventDate: album.eventDate || "",
				eventLocation: album.eventLocation || "",
				expiresAt: album.expiresAt || "",
				maxFileSizeMB: album.maxFileSizeMB,
				maxVideoLengthSec: album.maxVideoLengthSec,
				allowVideos: album.allowVideos,
				requireContributorName: album.requireContributorName,
				enableReactions: album.enableReactions,
			})
			setHasChanges(false)
		}
	}

	const handleFieldChange = (field: keyof Album, value: any) => {
		if (!album) return
		setEditedAlbum((prev) => ({
			...prev,
			[field]: value,
		}))
		setHasChanges(true)
	}

	const handleSave = async () => {
		if (!album || !hasChanges) return

		try {
			setIsSaving(true)
			setError(null)
			setSuccess(null)

			const updateData: any = {}

			if (editedAlbum.name !== undefined) updateData.name = editedAlbum.name
			if (editedAlbum.description !== undefined)
				updateData.description = editedAlbum.description || null
			if (editedAlbum.eventDate !== undefined) {
				updateData.eventDate = editedAlbum.eventDate
					? typeof editedAlbum.eventDate === "string"
						? editedAlbum.eventDate
						: new Date(editedAlbum.eventDate).toISOString()
					: null
			}
			if (editedAlbum.eventLocation !== undefined)
				updateData.eventLocation = editedAlbum.eventLocation || null
			if (editedAlbum.expiresAt !== undefined) {
				updateData.expiresAt = editedAlbum.expiresAt
					? typeof editedAlbum.expiresAt === "string"
						? editedAlbum.expiresAt
						: new Date(editedAlbum.expiresAt).toISOString()
					: null
			}

			if (
				editedAlbum.privacy !== undefined ||
				editedAlbum.maxFileSizeMB !== undefined ||
				editedAlbum.maxVideoLengthSec !== undefined ||
				editedAlbum.allowVideos !== undefined ||
				editedAlbum.requireContributorName !== undefined ||
				editedAlbum.enableReactions !== undefined
			) {
				updateData.settings = {
					privacy: editedAlbum.privacy ?? album.privacy,
					maxFileSizeMB: editedAlbum.maxFileSizeMB ?? album.maxFileSizeMB,
					maxVideoLengthSec:
						editedAlbum.maxVideoLengthSec ?? album.maxVideoLengthSec,
					allowVideos: editedAlbum.allowVideos ?? album.allowVideos,
					requireContributorName:
						editedAlbum.requireContributorName ?? album.requireContributorName,
				}
			}

			const response = await api.put(`/albums/${album.id}`, updateData)
			const updatedAlbum = response.data?.data?.album

			if (updatedAlbum) {
				if (updatedAlbum.accessCode) {
					setSuccess(
						`Album updated successfully! New access code: ${updatedAlbum.accessCode}`
					)
				} else {
					setSuccess("Album updated successfully!")
				}

				setAlbum({
					...updatedAlbum,
					media: album.media,

					accessCode: updatedAlbum.accessCode || album.accessCode,
				})
				setEditedAlbum({})
				setHasChanges(false)
				setTimeout(() => setSuccess(null), 5000)
			}
		} catch (err: any) {
			console.error("Failed to update album:", err)
			setError(err.response?.data?.error?.message || "Failed to update album")
		} finally {
			setIsSaving(false)
		}
	}

	const handleDelete = async () => {
		if (!album) return

		try {
			setIsDeleting(true)
			setError(null)

			await api.delete(`/albums/${album.id}`)

			setSuccess("Album deleted successfully!")
			setTimeout(() => {
				navigate("/albums")
			}, 1000)
		} catch (err: any) {
			console.error("Failed to delete album:", err)
			setError(err.response?.data?.error?.message || "Failed to delete album")
			setIsDeleting(false)
			setShowDeleteConfirm(false)
		}
	}

	const handleDownloadMedia = async (media: Media) => {
		try {
			const link = document.createElement("a")
			link.href = media.cdnUrl
			link.download = media.fileName
			link.target = "_blank"
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
		} catch (err) {
			console.error("Failed to download media:", err)
			setError("Failed to download media")
		}
	}

	const handleDeleteMediaClick = (mediaId: string, fileName: string) => {
		setMediaToDelete({ id: mediaId, fileName })
	}

	const handleDeleteMedia = async () => {
		if (!mediaToDelete) return

		try {
			setIsDeletingMedia(true)
			await api.delete(`/media/${mediaToDelete.id}`)
			setSuccess("Media deleted successfully!")

			if (id) {
				const response = await api.get(`/albums/${id}`)
				const albumData = response.data?.data?.album
				if (albumData) {
					setAlbum({
						...albumData,
						media: Array.isArray(albumData.media) ? albumData.media : [],
					})
				}
			}

			setMediaToDelete(null)
			setTimeout(() => setSuccess(null), 3000)
		} catch (err: any) {
			console.error("Failed to delete media:", err)
			setError(err.response?.data?.error?.message || "Failed to delete media")
		} finally {
			setIsDeletingMedia(false)
		}
	}

	const handleUpdateCaption = async (mediaId: string, caption: string) => {
		if (!album) return

		try {
			setError(null)
			const response = await api.patch(`/media/${mediaId}/caption`, { caption })

			if (response.data?.success) {
				const updatedMedia = album.media.map((item) =>
					item.id === mediaId
						? { ...item, caption: response.data.data.media.caption }
						: item
				)

				if (selectedMedia && selectedMedia.id === mediaId) {
					setSelectedMedia({
						...selectedMedia,
						caption: response.data.data.media.caption,
					})
				}

				setAlbum({
					...album,
					media: updatedMedia,
				})

				setSuccess("Caption updated successfully!")
				setTimeout(() => setSuccess(null), 3000)
			}
		} catch (err: any) {
			console.error("Failed to update caption:", err)
			const errorMessage =
				err.response?.data?.error?.message || "Failed to update caption"
			setError(errorMessage)
			setTimeout(() => setError(null), 5000)
		}
	}

	const handleArchive = async () => {
		if (!album) return
		try {
			await api.post(`/albums/${album.id}/archive`)
			setSuccess("Album archived successfully!")
			setTimeout(() => {
				fetchAlbum()
			}, 1000)
		} catch (err: any) {
			setError(err.response?.data?.error?.message || "Failed to archive album")
		}
	}

	const handleRestore = async () => {
		if (!album) return
		try {
			await api.post(`/albums/${album.id}/restore`)
			setSuccess("Album restored successfully!")
			setTimeout(() => {
				fetchAlbum()
			}, 1000)
		} catch (err: any) {
			setError(err.response?.data?.error?.message || "Failed to restore album")
		}
	}

	const fetchContributors = async () => {
		if (!id) return
		try {
			setIsLoadingContributors(true)
			const response = await api.get(`/albums/${id}/contributors`)
			setContributors(response.data?.data?.contributors || [])
			setShowContributors(true)
		} catch (err: any) {
			setError(
				err.response?.data?.error?.message || "Failed to load contributors"
			)
		} finally {
			setIsLoadingContributors(false)
		}
	}

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="text-center space-y-4">
					<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#8B2E3C] border-r-transparent"></div>
					<p className="text-[#6B5A42]">Loading album...</p>
				</div>
			</div>
		)
	}

	if (error || !album) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center p-8">
				<Card className="max-w-md border-2 border-[#D9A0A8] bg-[#F5E8EA]">
					<CardContent className="pt-6">
						<p className="text-center text-[#8B2E3C] font-medium">
							{error || "Album not found"}
						</p>
						{id && (
							<div className="mt-4 text-center">
								<Button onClick={() => (window.location.href = "/albums")}>
									Go to Albums
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		)
	}

	const media = Array.isArray(album.media) ? album.media : []

	// Helper function to get image URL from media item or mediaUrls
	const getImageUrl = (item: Media) => {
		// First check if there's a URL in mediaUrls array
		if (album.mediaUrls) {
			const mediaUrlItem = album.mediaUrls.find((mu: any) => mu.id === item.id)
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

	// Helper function to get thumbnail URL
	const getThumbnailUrl = (item: Media) => {
		// First check mediaUrls
		if (album.mediaUrls) {
			const mediaUrlItem = album.mediaUrls.find((mu: any) => mu.id === item.id)
			if (
				mediaUrlItem?.thumbnailUrl &&
				mediaUrlItem.thumbnailUrl.trim() !== ""
			) {
				return mediaUrlItem.thumbnailUrl
			}
		}

		// Fallback to media item
		if (item.thumbnailUrl && item.thumbnailUrl.trim() !== "") {
			return item.thumbnailUrl
		}

		return null
	}

	return (
		<div>
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
				<div className="flex items-center gap-4">
					<Link to="/albums">
						<Button variant="secondary" size="sm">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back
						</Button>
					</Link>
					<div className="flex items-center gap-3 flex-wrap">
						<h1 className="text-4xl font-bold text-[#8B7355]">
							{album.name || "Untitled Album"}
						</h1>
						{album.privacy && (
							<span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-[#D4E4F0] border-2 border-[#A8C5D9] text-[#5A8BB0] rounded-full">
								{album.privacy}
							</span>
						)}
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link to={`/albums/${id}/analytics`}>
						<Button variant="secondary" size="sm">
							<BarChart3 className="mr-2 h-4 w-4" />
							Analytics
						</Button>
					</Link>
					<Button variant="secondary" size="sm" onClick={handleShare}>
						<Share2 className="mr-2 h-4 w-4" />
						Share
					</Button>
					{isOwner && (
						<Button variant="secondary" size="sm" onClick={handleSettings}>
							<Settings className="mr-2 h-4 w-4" />
							Settings
						</Button>
					)}
					<Button onClick={() => setShowUpload(!showUpload)} size="sm">
						<Upload className="mr-2 h-4 w-4" />
						{showUpload ? "Cancel" : "Upload"}
					</Button>
				</div>
			</div>

			{shareMessage && (
				<div className="mb-4">
					<Card className="border-2 border-[#A8C5D9] bg-[#F0F6FA]">
						<CardContent className="p-3">
							<p className="text-sm text-[#5A8BB0] font-medium text-center">
								{shareMessage}
							</p>
						</CardContent>
					</Card>
				</div>
			)}

			{showShare && album?.shareInfo && (
				<div className="mb-8">
					<Card className="border-2 border-[#A8C5D9] bg-[#F0F6FA]">
						<CardContent className="p-6">
							<div className="space-y-6">
								{/* Header with title and action buttons */}
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-xl font-semibold text-[#8B7355]">
										Share Album
									</h3>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={copyShareInfo}
											className="border-[#5A8BB0] text-[#5A8BB0] hover:bg-[#E8F2F8]">
											<Copy className="mr-2 h-4 w-4" />
											Copy All
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={handleShare}
											className="border-[#A68F75] text-[#8B7355] hover:bg-[#F5E6D3]">
											<X className="h-4 w-4" />
										</Button>
									</div>
								</div>

								{/* QR Code */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<QrCode className="h-5 w-5 text-[#5A8BB0]" />
										<label className="text-sm font-medium text-[#6B5A42]">
											QR Code
										</label>
									</div>
									<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
										{album.shareInfo.qrCodeDataUrl && (
											<div className="flex-shrink-0">
												<img
													src={album.shareInfo.qrCodeDataUrl}
													alt="QR Code"
													className="w-48 h-48 border-2 border-[#A8C5D9] rounded-lg bg-white p-2"
												/>
											</div>
										)}
										<div className="flex-1 space-y-2">
											<p className="text-sm text-[#6B5A42]">
												Scan this QR code to access the album
											</p>
											<div className="flex flex-wrap gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={downloadQRCode}>
													<Download className="mr-2 h-4 w-4" />
													Download QR Code
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														copyToClipboard(
															album.shareInfo!.accessUrl,
															"Share link copied!"
														)
													}>
													<Copy className="mr-2 h-4 w-4" />
													Copy Link
												</Button>
											</div>
										</div>
									</div>
								</div>

								{/* Share Link */}
								<div className="space-y-3 pt-4 border-t border-[#A8C5D9]">
									<div className="flex items-center gap-2">
										<Share2 className="h-5 w-5 text-[#5A8BB0]" />
										<label className="text-sm font-medium text-[#6B5A42]">
											Share Link
										</label>
									</div>
									<div className="flex gap-2">
										<input
											type="text"
											readOnly
											value={album.shareInfo.accessUrl}
											className="flex-1 px-4 py-2 rounded-lg border-2 border-[#A8C5D9] bg-white text-[#8B7355] text-sm focus:outline-none focus:ring-2 focus:ring-[#5A8BB0]"
										/>
										<Button
											variant="primary"
											size="sm"
											onClick={() =>
												copyToClipboard(
													album.shareInfo!.accessUrl,
													"Link copied to clipboard!"
												)
											}
											className="px-4">
											<Copy className="h-4 w-4" />
										</Button>
									</div>
								</div>

								{/* NFC */}
								<div className="space-y-3 pt-4 border-t border-[#A8C5D9]">
									<div className="flex items-center gap-2">
										<Radio className="h-5 w-5 text-[#5A8BB0]" />
										<label className="text-sm font-medium text-[#6B5A42]">
											NFC Identifier
										</label>
									</div>
									<div className="space-y-2">
										<p className="text-sm text-[#6B5A42]">
											NFC Message:{" "}
											<code className="px-2 py-1 bg-[#D4E4F0] rounded text-[#5A8BB0] font-mono text-xs">
												{album.shareInfo.nfcMessage}
											</code>
										</p>
										<p className="text-xs text-[#A68F75]">
											Use this identifier to program NFC tags for easy album
											access
										</p>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												copyToClipboard(
													album.shareInfo!.nfcMessage,
													"NFC message copied!"
												)
											}>
											<Copy className="mr-2 h-4 w-4" />
											Copy NFC Message
										</Button>
									</div>
								</div>

								{/* Access Codes (for private albums) */}
								{album.privacy === "PRIVATE" && (
									<div className="space-y-3 pt-4 border-t border-[#A8C5D9]">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Key className="h-5 w-5 text-[#5A8BB0]" />
												<label className="text-sm font-medium text-[#6B5A42]">
													Access Codes
												</label>
											</div>
											<Button
												variant="primary"
												size="sm"
												onClick={async () => {
													try {
														const response = await api.post(
															`/albums/${id}/access-codes/generate`,
															{ note: newCodeNote || null }
														)
														const newCode = response.data?.data?.accessCode
														if (newCode) {
															setAccessCodes([newCode, ...accessCodes])
															setNewCodeNote("")
															setSuccess(
																`New access code generated: ${newCode.accessCode}`
															)
															setTimeout(() => setSuccess(null), 5000)
														}
													} catch (err: any) {
														setError(
															err.response?.data?.error?.message ||
																"Failed to generate access code"
														)
													}
												}}>
												<Key className="mr-2 h-4 w-4" />
												Generate New Code
											</Button>
										</div>
										<div className="space-y-2">
											<p className="text-sm text-[#6B5A42]">
												Manage access codes for this private album. Generate new
												codes or blacklist existing ones.
											</p>
											{/* Note input for new code */}
											<div className="flex gap-2">
												<input
													type="text"
													placeholder="Optional note/label for new code..."
													value={newCodeNote}
													onChange={(e) => setNewCodeNote(e.target.value)}
													className="flex-1 px-3 py-2 rounded-lg border-2 border-[#A8C5D9] bg-white text-[#8B7355] text-sm focus:outline-none focus:ring-2 focus:ring-[#5A8BB0]"
												/>
											</div>
											{/* Access codes list */}
											{isLoadingAccessCodes ? (
												<p className="text-sm text-[#A68F75]">Loading...</p>
											) : accessCodes.length === 0 ? (
												<p className="text-sm text-[#A68F75]">
													No access codes yet. Generate one to get started.
												</p>
											) : (
												<div className="space-y-2">
													{accessCodes.map((code) => (
														<div
															key={code.id}
															className={`p-3 rounded-lg border-2 ${
																code.isBlacklisted
																	? "border-red-300 bg-red-50"
																	: "border-[#A8C5D9] bg-white"
															}`}>
															<div className="flex items-start justify-between gap-2">
																<div className="flex-1">
																	<div className="flex items-center gap-2 mb-1">
																		{code.accessCode ? (
																			<input
																				type="text"
																				readOnly
																				value={code.accessCode}
																				className="px-3 py-1 rounded border border-[#A8C5D9] bg-white text-[#8B7355] text-sm font-mono font-semibold focus:outline-none"
																			/>
																		) : (
																			<span className="text-sm text-[#A68F75] italic">
																				Code unavailable
																			</span>
																		)}
																		<Button
																			variant="secondary"
																			size="sm"
																			onClick={() => {
																				if (code.accessCode) {
																					copyToClipboard(
																						code.accessCode,
																						"Access code copied!"
																					)
																				}
																			}}>
																			<Copy className="h-3 w-3" />
																		</Button>
																	</div>
																	{code.note && (
																		<p className="text-xs text-[#6B5A42] mt-1">
																			Note: {code.note}
																		</p>
																	)}
																	<div className="flex items-center gap-3 mt-1">
																		<span className="text-xs text-[#A68F75]">
																			Created:{" "}
																			{new Date(
																				code.createdAt
																			).toLocaleDateString()}
																		</span>
																		{code.isBlacklisted && (
																			<span className="text-xs text-red-600 font-semibold">
																				BLACKLISTED
																			</span>
																		)}
																	</div>
																</div>
																<div className="flex gap-1">
																	{code.isBlacklisted ? (
																		<Button
																			variant="secondary"
																			size="sm"
																			onClick={() => {
																				setConfirmModal({
																					isOpen: true,
																					action: "restore",
																					accessCodeId: code.id,
																					accessCode: code.accessCode,
																				})
																			}}>
																			Restore
																		</Button>
																	) : (
																		<Button
																			variant="secondary"
																			size="sm"
																			onClick={() => {
																				setConfirmModal({
																					isOpen: true,
																					action: "blacklist",
																					accessCodeId: code.id,
																					accessCode: code.accessCode,
																				})
																			}}>
																			Blacklist
																		</Button>
																	)}
																	<Button
																		variant="secondary"
																		size="sm"
																		onClick={() => {
																			setConfirmModal({
																				isOpen: true,
																				action: "delete",
																				accessCodeId: code.id,
																				accessCode: code.accessCode,
																			})
																		}}>
																		Delete
																	</Button>
																</div>
															</div>
														</div>
													))}
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Album Information & Statistics */}
			<div className="mb-8 grid md:grid-cols-2 gap-6">
				<Card className="border-2 border-[#E8D4B8] bg-[#FDF8F3]">
					<CardContent className="p-6">
						<h3 className="text-xl font-semibold text-[#8B7355] mb-4 flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Album Information
						</h3>
						<div className="space-y-3">
							<div>
								<span className="text-sm text-[#6B5A42]">Created:</span>
								<span className="ml-2 text-sm text-[#8B7355]">
									{new Date(album.createdAt).toLocaleString()}
								</span>
							</div>
							<div>
								<span className="text-sm text-[#6B5A42]">Last Updated:</span>
								<span className="ml-2 text-sm text-[#8B7355]">
									{new Date(album.updatedAt).toLocaleString()}
								</span>
							</div>
							<div>
								<span className="text-sm text-[#6B5A42]">Status:</span>
								<span
									className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
										album.status === "ACTIVE"
											? "bg-green-100 text-green-700"
											: album.status === "ARCHIVED"
											? "bg-yellow-100 text-yellow-700"
											: "bg-red-100 text-red-700"
									}`}>
									{album.status}
								</span>
							</div>
							{album.expiresAt && (
								<div>
									<span className="text-sm text-[#6B5A42]">Expires:</span>
									<span className="ml-2 text-sm text-[#8B7355]">
										{new Date(album.expiresAt).toLocaleString()}
									</span>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="border-2 border-[#E8D4B8] bg-[#FDF8F3]">
					<CardContent className="p-6">
						<h3 className="text-xl font-semibold text-[#8B7355] mb-4 flex items-center gap-2">
							<Eye className="h-5 w-5" />
							Statistics
						</h3>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<span className="text-sm text-[#6B5A42]">Media Count</span>
								<div className="text-2xl font-bold text-[#8B2E3C]">
									{album.mediaCount}
								</div>
							</div>
							<div>
								<span className="text-sm text-[#6B5A42]">Views</span>
								<div className="text-2xl font-bold text-[#8B2E3C]">
									{album.viewCount}
								</div>
							</div>
							<div>
								<span className="text-sm text-[#6B5A42]">Downloads</span>
								<div className="text-2xl font-bold text-[#8B2E3C]">
									{album.downloadCount}
								</div>
							</div>
							<div>
								<span className="text-sm text-[#6B5A42]">Contributors</span>
								<div className="text-2xl font-bold text-[#8B2E3C]">
									{album.uniqueContributors}
								</div>
							</div>
							<div className="col-span-2">
								<span className="text-sm text-[#6B5A42]">Total Size</span>
								<div className="text-lg font-semibold text-[#8B7355]">
									{(Number(album.totalSizeBytes) / 1024 / 1024).toFixed(2)} MB
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{showSettings && isOwner && (
				<div className="mb-8">
					<Card className="border-2 border-[#E8D4B8] bg-[#FDF8F3]">
						<CardContent className="p-6">
							<div className="space-y-6">
								<div className="flex items-center justify-between">
									<h3 className="text-xl font-semibold text-[#8B7355] flex items-center gap-2">
										<Edit2 className="h-5 w-5" />
										Edit Album
									</h3>
									{hasChanges && (
										<span className="text-xs text-orange-600 font-medium">
											You have unsaved changes
										</span>
									)}
								</div>

								{error && (
									<div className="rounded-lg bg-[#F5E8EA] border-2 border-[#D9A0A8] p-3">
										<p className="text-sm text-[#8B2E3C] font-medium">
											{error}
										</p>
									</div>
								)}

								{success && (
									<div className="rounded-lg bg-[#F0F6FA] border-2 border-[#A8C5D9] p-3">
										<p className="text-sm text-[#5A8BB0] font-medium">
											{success}
										</p>
									</div>
								)}

								<div className="grid md:grid-cols-2 gap-4">
									{/* Basic Information */}
									<div className="space-y-4">
										<h4 className="font-semibold text-[#8B7355]">
											Basic Information
										</h4>

										<div className="space-y-2">
											<Input
												id="albumName"
												label="Album Name *"
												value={editedAlbum.name ?? album.name}
												onChange={(e) =>
													handleFieldChange("name", e.target.value)
												}
												placeholder="Enter album name"
											/>
										</div>

										<div className="space-y-2">
											<label className="text-sm font-medium text-[#6B5A42]">
												Description
											</label>
											<textarea
												value={
													editedAlbum.description ?? album.description ?? ""
												}
												onChange={(e) =>
													handleFieldChange("description", e.target.value)
												}
												placeholder="Enter album description"
												rows={4}
												className="flex w-full rounded-lg border-2 border-[#E8D4B8] bg-[#FDF8F3] px-4 py-2.5 text-sm text-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
											/>
										</div>

										<Select
											label="Privacy"
											value={editedAlbum.privacy ?? album.privacy}
											onChange={(e) =>
												handleFieldChange("privacy", e.target.value)
											}
											options={[
												{ value: "PRIVATE", label: "Private" },
												{ value: "PUBLIC", label: "Public" },
											]}
										/>
									</div>

									{/* Event Information */}
									<div className="space-y-4">
										<h4 className="font-semibold text-[#8B7355]">
											Event Information
										</h4>

										<div className="space-y-2">
											<label className="text-sm font-medium text-[#6B5A42] flex items-center gap-2">
												<Calendar className="h-4 w-4" />
												Event Date
											</label>
											<input
												type="datetime-local"
												value={
													editedAlbum.eventDate
														? new Date(editedAlbum.eventDate)
																.toISOString()
																.slice(0, 16)
														: ""
												}
												onChange={(e) =>
													handleFieldChange(
														"eventDate",
														e.target.value
															? new Date(e.target.value).toISOString()
															: null
													)
												}
												className="flex h-11 w-full rounded-lg border-2 border-[#E8D4B8] bg-[#FDF8F3] px-4 py-2.5 text-sm text-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
											/>
										</div>

										<div className="space-y-2">
											<Input
												id="eventLocation"
												label="Event Location"
												value={
													editedAlbum.eventLocation ?? album.eventLocation ?? ""
												}
												onChange={(e) =>
													handleFieldChange("eventLocation", e.target.value)
												}
												placeholder="Enter event location"
											/>
										</div>

										<div className="space-y-2">
											<label className="text-sm font-medium text-[#6B5A42]">
												Expiry Date
											</label>
											<input
												type="datetime-local"
												value={
													editedAlbum.expiresAt
														? new Date(editedAlbum.expiresAt)
																.toISOString()
																.slice(0, 16)
														: ""
												}
												onChange={(e) =>
													handleFieldChange(
														"expiresAt",
														e.target.value
															? new Date(e.target.value).toISOString()
															: null
													)
												}
												className="flex h-11 w-full rounded-lg border-2 border-[#E8D4B8] bg-[#FDF8F3] px-4 py-2.5 text-sm text-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
											/>
										</div>
									</div>
								</div>

								{/* Advanced Settings */}
								<div className="pt-4 border-t border-[#E8D4B8]">
									<h4 className="font-semibold text-[#8B7355] mb-4">
										Advanced Settings
									</h4>
									<div className="grid md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Input
												id="maxFileSizeMB"
												label="Max File Size (MB)"
												type="number"
												min="1"
												max="500"
												value={editedAlbum.maxFileSizeMB ?? album.maxFileSizeMB}
												onChange={(e) =>
													handleFieldChange(
														"maxFileSizeMB",
														parseInt(e.target.value)
													)
												}
											/>
										</div>

										<div className="space-y-2">
											<Input
												id="maxVideoLengthSec"
												label="Max Video Length (seconds)"
												type="number"
												min="30"
												max="600"
												value={
													editedAlbum.maxVideoLengthSec ??
													album.maxVideoLengthSec
												}
												onChange={(e) =>
													handleFieldChange(
														"maxVideoLengthSec",
														parseInt(e.target.value)
													)
												}
											/>
										</div>

										<Checkbox
											id="allowVideos"
											checked={editedAlbum.allowVideos ?? album.allowVideos}
											onChange={(e) =>
												handleFieldChange("allowVideos", e.target.checked)
											}
											label={
												<span className="flex items-center gap-2">
													<Video className="h-4 w-4" />
													Allow Videos
												</span>
											}
										/>

										<Checkbox
											id="requireContributorName"
											checked={
												editedAlbum.requireContributorName ??
												album.requireContributorName
											}
											onChange={(e) =>
												handleFieldChange(
													"requireContributorName",
													e.target.checked
												)
											}
											label="Require Contributor Name"
										/>

										<Checkbox
											id="enableReactions"
											checked={
												editedAlbum.enableReactions ?? album.enableReactions
											}
											onChange={(e) =>
												handleFieldChange("enableReactions", e.target.checked)
											}
											label="Enable Reactions"
										/>
									</div>
								</div>

								{/* Action Buttons - All in one row */}
								<div className="pt-6 border-t border-[#E8D4B8]">
									<div className="flex flex-wrap gap-2">
										<Tooltip content="Save all changes made to album settings">
											<Button
												variant="primary"
												size="sm"
												onClick={handleSave}
												isLoading={isSaving}
												disabled={!hasChanges}
												className="bg-[#8B2E3C] hover:bg-[#7A2633] text-white">
												<Save className="mr-2 h-4 w-4" />
												Save
											</Button>
										</Tooltip>
										<Tooltip content="Discard all changes and close settings">
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setShowSettings(false)
													setEditedAlbum({})
													setHasChanges(false)
												}}
												className="border-[#E8D4B8] text-[#6B5A42] hover:bg-[#F5E6D3]">
												Cancel
											</Button>
										</Tooltip>
										<Tooltip content="View all users who have contributed media to this album">
											<Button
												variant="outline"
												size="sm"
												onClick={fetchContributors}
												isLoading={isLoadingContributors}
												className="border-[#5A8BB0] text-[#5A8BB0] hover:bg-[#E8F2F8]">
												<Users className="mr-2 h-4 w-4" />
												Contributors
											</Button>
										</Tooltip>
										{isOwner && (
											<>
												{album.status === "ARCHIVED" ? (
													<Tooltip content="Restore this archived album to active status">
														<Button
															variant="outline"
															size="sm"
															onClick={handleRestore}
															className="border-[#10B981] text-[#10B981] hover:bg-[#D1FAE5]">
															<ArchiveRestore className="mr-2 h-4 w-4" />
															Restore
														</Button>
													</Tooltip>
												) : (
													<Tooltip content="Archive this album to hide it from your main album list">
														<Button
															variant="outline"
															size="sm"
															onClick={handleArchive}
															className="border-[#F59E0B] text-[#F59E0B] hover:bg-[#FEF3C7]">
															<Archive className="mr-2 h-4 w-4" />
															Archive
														</Button>
													</Tooltip>
												)}
												<Tooltip content="Regenerate QR code, NFC identifier, and short URL for this album">
													<Button
														variant="outline"
														size="sm"
														onClick={async () => {
															try {
																await api.post(
																	`/albums/${album.id}/regenerate-identifiers`
																)
																const updatedAlbum = await api.get(
																	`/albums/${id}`
																)
																setAlbum({
																	...updatedAlbum.data?.data?.album,
																	media: album.media,
																})
																setShareMessage(
																	"QR code, NFC, and short URL regenerated!"
																)
																setTimeout(() => setShareMessage(null), 3000)
															} catch (err: any) {
																console.error(
																	"Failed to regenerate identifiers:",
																	err
																)
																setShareMessage(
																	"Failed to regenerate identifiers"
																)
																setTimeout(() => setShareMessage(null), 3000)
															}
														}}
														className="border-[#6366F1] text-[#6366F1] hover:bg-[#E0E7FF]">
														<QrCode className="mr-2 h-4 w-4" />
														Regenerate
													</Button>
												</Tooltip>
												<Tooltip content="Permanently delete this album and all its media">
													<Button
														variant="outline"
														size="sm"
														onClick={() => setShowDeleteConfirm(true)}
														className="border-red-400 text-red-600 hover:bg-red-50 hover:border-red-500">
														<Trash2 className="mr-2 h-4 w-4" />
														Delete
													</Button>
												</Tooltip>
											</>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && isOwner && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<Card className="max-w-md border-2 border-red-200 bg-white">
						<CardContent className="p-6">
							<h3 className="text-xl font-semibold text-red-600 mb-4">
								Delete Album
							</h3>
							<p className="text-[#6B5A42] mb-6">
								Are you sure you want to delete "{album?.name}"? This action
								cannot be undone. All media in this album will also be deleted.
							</p>
							<div className="flex gap-2">
								<Button
									variant="secondary"
									onClick={handleDelete}
									isLoading={isDeleting}
									className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
									Yes, Delete
								</Button>
								<Button
									variant="ghost"
									onClick={() => setShowDeleteConfirm(false)}
									className="flex-1">
									Cancel
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{showUpload && (
				<div className="mb-8">
					<Card className="border-2 border-dashed border-[#A8C5D9] bg-[#F0F6FA]">
						<CardContent className="p-6">
							<UploadZone
								albumId={album.id}
								onUploadComplete={handleUploadComplete}
							/>
						</CardContent>
					</Card>
				</div>
			)}

			{media.length === 0 ? (
				<Card className="border-2 border-dashed border-[#E8D4B8] bg-[#FDF8F3]">
					<CardContent className="flex flex-col items-center justify-center py-16 px-8">
						<div className="rounded-full bg-[#D4E4F0] border-2 border-[#A8C5D9] p-6 mb-6">
							<Upload className="h-12 w-12 text-[#5A8BB0]" />
						</div>
						<h3 className="text-2xl font-semibold text-[#8B7355] mb-2">
							No media yet
						</h3>
						<p className="text-[#6B5A42] mb-6 text-center max-w-md">
							Upload photos and videos to start building your album.
						</p>
						<Button onClick={() => setShowUpload(true)} size="lg">
							<Upload className="mr-2 h-5 w-5" />
							Upload Media
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
					{media.map((item) => (
						<Card
							key={item.id}
							className="overflow-hidden group hover:scale-[1.02] transition-all duration-300 border-[#E8D4B8] hover:border-[#D9C19D]">
							<CardContent className="p-0 relative">
								{item.type === "IMAGE" ? (
									<div className="relative">
										{(() => {
											const imageUrl = getImageUrl(item)
											const thumbUrl = getThumbnailUrl(item)
											return imageUrl || thumbUrl ? (
												<img
													src={thumbUrl || imageUrl || ""}
													alt={item.fileName}
													className="w-full h-48 object-cover group-hover:brightness-110 transition-all duration-300 cursor-pointer"
													onClick={() => {
														setSelectedMedia(item)
														setShowLightbox(true)
													}}
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
										})()}
										<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
											<Button
												variant="secondary"
												size="sm"
												onClick={(e) => {
													e.stopPropagation()
													setSelectedMedia(item)
													setShowLightbox(true)
												}}
												className="h-8 w-8 p-0">
												<Maximize2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								) : (
									<div className="w-full h-48 bg-[#F5E6D3] border-2 border-[#E8D4B8] flex items-center justify-center group-hover:bg-[#E8D4B8] transition-all duration-300">
										<Video className="h-12 w-12 text-[#6B5A42]" />
									</div>
								)}
								<div className="p-2 bg-white">
									{item.caption && (
										<p className="text-xs text-[#6B5A42] truncate mb-1">
											{item.caption}
										</p>
									)}
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2 text-xs text-[#A68F75]">
											{item.viewCount !== undefined && (
												<span className="flex items-center gap-1">
													<Eye className="h-3 w-3" />
													{item.viewCount}
												</span>
											)}
											{item.downloadCount !== undefined && (
												<span className="flex items-center gap-1">
													<Download className="h-3 w-3" />
													{item.downloadCount}
												</span>
											)}
										</div>
										{album.enableReactions && (
											<MediaReactions
												mediaId={item.id}
												enabled={album.enableReactions}
											/>
										)}
									</div>
									<div className="flex items-center justify-between gap-2 mt-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation()
												handleDownloadMedia(item)
											}}
											className="flex-1 h-6 px-2 text-xs">
											<Download className="h-3 w-3 mr-1" />
											Download
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation()
												handleDeleteMediaClick(item.id, item.fileName)
											}}
											className="flex-1 h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
											<Trash2 className="h-3 w-3 mr-1" />
											Delete
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Confirmation Modal for Access Codes */}
			<ConfirmModal
				isOpen={confirmModal.isOpen}
				onClose={() =>
					setConfirmModal({
						isOpen: false,
						action: null,
						accessCodeId: null,
					})
				}
				onConfirm={async () => {
					if (!confirmModal.accessCodeId || !confirmModal.action) return

					try {
						if (confirmModal.action === "delete") {
							await api.delete(`/albums/${id}/access-codes`, {
								data: { accessCodeId: confirmModal.accessCodeId },
							})
							setSuccess("Access code deleted")
						} else if (confirmModal.action === "blacklist") {
							await api.post(`/albums/${id}/access-codes/blacklist`, {
								accessCodeId: confirmModal.accessCodeId,
							})
							setSuccess("Access code blacklisted")
						} else if (confirmModal.action === "restore") {
							await api.post(`/albums/${id}/access-codes/unblacklist`, {
								accessCodeId: confirmModal.accessCodeId,
							})
							setSuccess("Access code restored")
						}

						fetchAccessCodes()
						setTimeout(() => setSuccess(null), 3000)
						setConfirmModal({
							isOpen: false,
							action: null,
							accessCodeId: null,
						})
					} catch (err: any) {
						setError(
							err.response?.data?.error?.message ||
								`Failed to ${confirmModal.action} access code`
						)
					}
				}}
				title={
					confirmModal.action === "delete"
						? "Delete Access Code"
						: confirmModal.action === "blacklist"
						? "Blacklist Access Code"
						: "Restore Access Code"
				}
				message={
					confirmModal.action === "delete"
						? `Are you sure you want to permanently delete access code "${
								confirmModal.accessCode || "N/A"
						  }"? This action cannot be undone.`
						: confirmModal.action === "blacklist"
						? `Are you sure you want to blacklist access code "${
								confirmModal.accessCode || "N/A"
						  }"? Users with this code will no longer be able to access the album.`
						: `Are you sure you want to restore access code "${
								confirmModal.accessCode || "N/A"
						  }"? Users with this code will be able to access the album again.`
				}
				confirmText={
					confirmModal.action === "delete"
						? "Delete"
						: confirmModal.action === "blacklist"
						? "Blacklist"
						: "Restore"
				}
				variant={
					confirmModal.action === "delete"
						? "danger"
						: confirmModal.action === "blacklist"
						? "warning"
						: "info"
				}
			/>

			{/* Contributors Modal */}
			{showContributors && (
				<div className="fixed inset-0 bg-gray-900/50 bg-opacity-15 flex items-center justify-center z-50">
					<Card className="max-w-2xl w-full mx-4 border-2 border-[#E8D4B8] bg-white">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-xl font-semibold text-[#8B7355] flex items-center gap-2">
									<Users className="h-5 w-5" />
									Contributors ({contributors.length})
								</h3>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowContributors(false)}>
									<X className="h-4 w-4" />
								</Button>
							</div>
							{contributors.length === 0 ? (
								<p className="text-[#6B5A42] text-center py-8">
									No contributors yet
								</p>
							) : (
								<div className="space-y-2 max-h-96 overflow-y-auto">
									{contributors.map((contributor, idx) => (
										<div
											key={contributor.deviceId || idx}
											className="flex items-center justify-between p-3 bg-[#FDF8F3] rounded-lg border border-[#E8D4B8]">
											<div>
												<p className="font-medium text-[#8B7355]">
													{contributor.name || "Anonymous"}
												</p>
												<p className="text-xs text-[#6B5A42]">
													First upload:{" "}
													{new Date(contributor.firstUpload).toLocaleString()}
												</p>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{/* Image Lightbox */}
			{showLightbox && selectedMedia && (
				<ImageLightbox
					media={{
						...selectedMedia,
						cdnUrl: getImageUrl(selectedMedia) || selectedMedia.cdnUrl || "",
					}}
					onClose={() => {
						setShowLightbox(false)
						setSelectedMedia(null)
					}}
					onNext={() => {
						const currentIndex = media.findIndex(
							(m) => m.id === selectedMedia.id
						)
						if (currentIndex < media.length - 1) {
							setSelectedMedia(media[currentIndex + 1])
						}
					}}
					onPrevious={() => {
						const currentIndex = media.findIndex(
							(m) => m.id === selectedMedia.id
						)
						if (currentIndex > 0) {
							setSelectedMedia(media[currentIndex - 1])
						}
					}}
					hasNext={
						media.findIndex((m) => m.id === selectedMedia.id) < media.length - 1
					}
					hasPrevious={media.findIndex((m) => m.id === selectedMedia.id) > 0}
					onUpdateCaption={handleUpdateCaption}
				/>
			)}

			{/* Delete Media Confirmation Modal */}
			<ConfirmModal
				isOpen={mediaToDelete !== null}
				onClose={() => setMediaToDelete(null)}
				onConfirm={handleDeleteMedia}
				title="Delete Media"
				message={`Are you sure you want to delete "${mediaToDelete?.fileName}"? This action cannot be undone.`}
				confirmText="Delete"
				cancelText="Cancel"
				variant="danger"
				isLoading={isDeletingMedia}
			/>
		</div>
	)
}
