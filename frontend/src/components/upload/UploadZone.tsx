import { useState, useRef, type ChangeEvent } from "react"
import { Upload, X } from "lucide-react"
import { Card, CardContent } from "../ui/Card"
import { LoadingSpinner } from "../ui/LoadingSpinner"
import { Button } from "../ui/Button"
import { useNotifications } from "../notifications/NotificationSystem"
import api from "../../lib/api"
import { validateFile } from "../../utils/fileValidation"

interface UploadZoneProps {
	albumId: string
	onUploadComplete: () => void
}

interface UploadState {
	file: File
	mediaId: string | null
	preview: string | null
	providerType: string
}

export default function UploadZone({
	albumId,
	onUploadComplete,
}: UploadZoneProps) {
	const { showSuccess, showError } = useNotifications()
	const [isDragging, setIsDragging] = useState(false)
	const [uploading, setUploading] = useState(false)
	const [progress, setProgress] = useState<string>("")
	const [uploadState, setUploadState] = useState<UploadState | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(true)
	}

	const handleDragLeave = () => {
		setIsDragging(false)
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(false)
		const files = Array.from(e.dataTransfer.files)
		if (files.length > 0) handleFilePreview(files[0])
	}

	const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			handleFilePreview(e.target.files[0])
		}
	}

	const handleFilePreview = (file: File) => {
		const validation = validateFile(file, 100, true)
		if (!validation.valid) {
			showError(validation.error || "File validation failed")
			if (fileInputRef.current) fileInputRef.current.value = ""
			return
		}

		// Create preview
		const preview = file.type.startsWith("image/")
			? URL.createObjectURL(file)
			: null

		setUploadState({
			file,
			mediaId: null,
			preview,
			providerType: "",
		})
	}

	const handleCancel = async () => {
		if (uploadState?.mediaId) {
			try {
				await api.post(`/media/${uploadState.mediaId}/cancel`)
			} catch (error) {
				console.error("Failed to cancel upload:", error)
			}
		}

		// Cleanup
		if (uploadState?.preview) {
			URL.revokeObjectURL(uploadState.preview)
		}
		setUploadState(null)
		setUploading(false)
		setProgress("")
		if (fileInputRef.current) fileInputRef.current.value = ""
	}

	const handleUpload = async () => {
		if (!uploadState) return

		const { file } = uploadState

		try {
			setUploading(true)
			setProgress("Initiating upload...")

			const fileName = file.name
			const initResponse = await api.post("/media/initiate", {
				albumId,
				fileName,
				fileType: file.type,
				fileSize: file.size,
			})

			const { media, uploadUrl, providerType } = initResponse.data.data

			setUploadState((prev) =>
				prev ? { ...prev, mediaId: media.id, providerType } : null
			)

			setProgress("Uploading file...")

			// Handle Cloudinary uploads with POST + FormData
			if (providerType === "cloudinary") {
				const formData = new FormData()
				formData.append("file", file)

				// Parse URL to check if it has query params (signed upload) or not (upload preset)
				const url = new URL(uploadUrl)

				// If there are query params in the URL, they contain the signature
				// We must keep them in the URL, not move them to FormData
				// The signature is calculated based on the exact parameter order
				// If there's an upload_preset in query params, add it to FormData and remove from URL
				if (url.searchParams.has("upload_preset")) {
					const uploadPreset = url.searchParams.get("upload_preset")
					formData.append("upload_preset", uploadPreset || "")
					url.searchParams.delete("upload_preset")
				}

				// Use the URL with query params (signature params must stay in URL)
				const uploadResponse = await fetch(url.toString(), {
					method: "POST",
					body: formData,
				})

				if (!uploadResponse.ok) {
					const errorData = await uploadResponse
						.json()
						.catch(() => ({ error: { message: "Upload failed" } }))
					throw new Error(
						errorData.error?.message ||
							`Upload failed: ${uploadResponse.statusText}`
					)
				}

				// Cloudinary returns the upload result with public_id and other metadata
				const uploadResult = await uploadResponse.json()
				if (!uploadResult.public_id) {
					throw new Error("Upload succeeded but no public_id returned")
				}

				// Store Cloudinary response data for backend
				setProgress("Processing...")
				await api.post(`/media/${media.id}/confirm`, {
					cloudinaryResponse: uploadResult,
				})
			} else {
				// S3 or local storage - use PUT
				await fetch(uploadUrl, {
					method: "PUT",
					body: file,
					headers: {
						"Content-Type": file.type,
					},
				})

				setProgress("Processing...")
				await api.post(`/media/${media.id}/confirm`)
			}

			// Cleanup preview
			if (uploadState.preview) {
				URL.revokeObjectURL(uploadState.preview)
			}

			setUploadState(null)
			showSuccess("File uploaded successfully!")
			onUploadComplete()
		} catch (error: any) {
			console.error("Upload failed:", error)
			const errorMessage =
				error.response?.data?.error?.message ||
				error.message ||
				"Upload failed. Please try again."
			showError(errorMessage)

			// Cleanup on error
			if (uploadState?.preview) {
				URL.revokeObjectURL(uploadState.preview)
			}
			if (uploadState?.mediaId) {
				try {
					await api.post(`/media/${uploadState.mediaId}/cancel`)
				} catch (cancelError) {
					console.error("Failed to cancel upload on error:", cancelError)
				}
			}
			setUploadState(null)
		} finally {
			setUploading(false)
			setProgress("")
			if (fileInputRef.current) fileInputRef.current.value = ""
		}
	}

	return (
		<Card
			className={`border-2 border-dashed transition-colors ${
				isDragging ? "border-[#8B2E3C] bg-[#F5E8EA]" : "border-[#E8D4B8]"
			}`}>
			<CardContent className="p-8">
				<input
					type="file"
					ref={fileInputRef}
					className="hidden"
					accept="image/*,video/*"
					onChange={handleFileSelect}
					disabled={uploading}
				/>

				{uploadState ? (
					<div className="space-y-4">
						{/* Preview */}
						{uploadState.preview && (
							<div className="relative w-full max-w-md mx-auto">
								<img
									src={uploadState.preview}
									alt="Preview"
									className="w-full h-auto rounded-lg object-contain max-h-64"
								/>
								<button
									onClick={handleCancel}
									className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
									disabled={uploading}>
									<X className="h-4 w-4" />
								</button>
							</div>
						)}

						{!uploadState.preview && (
							<div className="text-center">
								<p className="text-sm font-medium text-[#8B7355]">
									{uploadState.file.name}
								</p>
								<p className="text-xs text-[#A68F75] mt-1">
									{(uploadState.file.size / 1024 / 1024).toFixed(2)} MB
								</p>
							</div>
						)}

						{/* Upload Progress or Actions */}
						{uploading ? (
							<div className="text-center w-full">
								<LoadingSpinner size="lg" text={progress} />
								<Button
									variant="secondary"
									size="sm"
									onClick={handleCancel}
									className="mt-4">
									Cancel Upload
								</Button>
							</div>
						) : (
							<div className="flex gap-2 justify-center">
								<Button variant="primary" onClick={handleUpload}>
									Upload
								</Button>
								<Button variant="secondary" onClick={handleCancel}>
									Cancel
								</Button>
							</div>
						)}
					</div>
				) : (
					<div
						className="flex flex-col items-center justify-center cursor-pointer"
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						onClick={() => !uploading && fileInputRef.current?.click()}>
						<Upload className="h-10 w-10 text-[#6B5A42] mb-4" />
						<p className="text-sm font-medium text-[#8B7355]">
							Click to upload or drag and drop
						</p>
						<p className="text-xs text-[#A68F75] mt-1">
							Images and Videos supported
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
