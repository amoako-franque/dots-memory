import { useEffect, useState } from "react"
import {
	X,
	ChevronLeft,
	ChevronRight,
	Download,
	Edit2,
	Save,
} from "lucide-react"
import { Button } from "../ui/Button"

interface Media {
	id: string
	type: "IMAGE" | "VIDEO"
	cdnUrl: string
	thumbnailUrl?: string
	fileName: string
	caption?: string
}

interface ImageLightboxProps {
	media: Media
	onClose: () => void
	onNext: () => void
	onPrevious: () => void
	hasNext: boolean
	hasPrevious: boolean
	onUpdateCaption?: (mediaId: string, caption: string) => void
}

export default function ImageLightbox({
	media,
	onClose,
	onNext,
	onPrevious,
	hasNext,
	hasPrevious,
	onUpdateCaption,
}: ImageLightboxProps) {
	const [isEditingCaption, setIsEditingCaption] = useState(false)
	const [caption, setCaption] = useState(media.caption || "")

	useEffect(() => {
		setCaption(media.caption || "")
		setIsEditingCaption(false)
	}, [media])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose()
			} else if (e.key === "ArrowLeft" && hasPrevious) {
				onPrevious()
			} else if (e.key === "ArrowRight" && hasNext) {
				onNext()
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [onClose, onNext, onPrevious, hasNext, hasPrevious])

	const handleSaveCaption = () => {
		if (onUpdateCaption) {
			onUpdateCaption(media.id, caption)
		}
		setIsEditingCaption(false)
	}

	const handleDownload = () => {
		const link = document.createElement("a")
		link.href = media.cdnUrl
		link.download = media.fileName
		link.target = "_blank"
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
			{/* Close Button */}
			<button
				onClick={onClose}
				className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full text-white transition-all">
				<X className="h-6 w-6" />
			</button>

			{/* Navigation Buttons */}
			{hasPrevious && (
				<button
					onClick={onPrevious}
					className="absolute left-4 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full text-white transition-all">
					<ChevronLeft className="h-8 w-8" />
				</button>
			)}

			{hasNext && (
				<button
					onClick={onNext}
					className="absolute right-4 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full text-white transition-all">
					<ChevronRight className="h-8 w-8" />
				</button>
			)}

			{/* Image Container */}
			<div className="max-w-7xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center p-4">
				{media.type === "IMAGE" ? (
					media.cdnUrl ? (
						<img
							src={media.cdnUrl}
							alt={media.fileName}
							className="max-w-full max-h-[80vh] object-contain"
						/>
					) : (
						<div className="w-full h-64 bg-gray-100 flex items-center justify-center">
							<span className="text-gray-500">Image not available</span>
						</div>
					)
				) : (
					<video
						src={media.cdnUrl}
						controls
						className="max-w-full max-h-[80vh]"
					/>
				)}

				{/* Caption and Actions */}
				<div className="mt-4 w-full max-w-4xl">
					<div className="flex items-center justify-between gap-4 bg-black bg-opacity-50 rounded-lg p-4">
						<div className="flex-1">
							{isEditingCaption ? (
								<div className="flex items-center gap-2">
									<input
										type="text"
										value={caption}
										onChange={(e) => setCaption(e.target.value)}
										className="flex-1 px-3 py-2 bg-white text-gray-900 rounded"
										placeholder="Enter caption..."
										autoFocus
									/>
									<Button
										size="sm"
										onClick={handleSaveCaption}
										className="bg-green-600 hover:bg-green-700">
										<Save className="h-4 w-4" />
									</Button>
									<Button
										size="sm"
										variant="secondary"
										onClick={() => {
											setIsEditingCaption(false)
											setCaption(media.caption || "")
										}}>
										<X className="h-4 w-4" />
									</Button>
								</div>
							) : (
								<div className="flex items-center gap-2">
									<p className="text-white flex-1">
										{caption || media.fileName}
									</p>
									{onUpdateCaption && (
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setIsEditingCaption(true)}
											className="text-white hover:bg-white hover:bg-opacity-20">
											<Edit2 className="h-4 w-4" />
										</Button>
									)}
								</div>
							)}
						</div>
						<Button
							size="sm"
							variant="secondary"
							onClick={handleDownload}
							className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white">
							<Download className="h-4 w-4 mr-2" />
							Download
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
