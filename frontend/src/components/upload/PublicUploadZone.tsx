import { useState, useRef, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useNotifications } from '../notifications/NotificationSystem';
import axios from 'axios';
import { validateFile } from '../../utils/fileValidation';
import { sanitizeText } from '../../utils/sanitize';

const PUBLIC_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:30700/api/v1';

interface PublicUploadZoneProps {
    albumIdentifier: string;
    onUploadComplete: () => void;
    requireContributorName?: boolean;
    sessionToken?: string | null;
}

export default function PublicUploadZone({ albumIdentifier, onUploadComplete, requireContributorName, sessionToken }: PublicUploadZoneProps) {
    const { showSuccess, showError } = useNotifications();
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<string>('');
    const [contributorName, setContributorName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) handleUpload(files[0]);
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (file: File) => {
        const sanitizedContributorName = sanitizeText(contributorName);

        if (requireContributorName && !sanitizedContributorName) {
            showError('Please enter your name');
            return;
        }

        try {
            setUploading(true);
            setProgress('Validating file...');

            const validation = validateFile(file, 100, true); // Default max 100MB, allow videos
            if (!validation.valid) {
                showError(validation.error || 'File validation failed');
                setUploading(false);
                setProgress('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            const fileName = validation.sanitizedName || file.name;

            setProgress('Initiating upload...');

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (sessionToken) {
                headers['x-session-token'] = sessionToken;
            }

            const initResponse = await axios.post(`${PUBLIC_API_URL}/public/album/${albumIdentifier}/upload`, {
                fileName,
                fileType: file.type,
                fileSize: file.size,
                contributorName: sanitizedContributorName || undefined,
            }, {
                headers,
            });

            const { media } = initResponse.data.data;

            setProgress('Uploading file...');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('mediaId', media.id);

            await axios.post(`${PUBLIC_API_URL}/media/upload/local`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setProgress('Processing...');
            await axios.post(`${PUBLIC_API_URL}/media/${media.id}/confirm`);

            setContributorName('');
            showSuccess('File uploaded successfully!');
            onUploadComplete();
        } catch (error: any) {
            console.error('Upload failed:', error);
            const errorMessage = error.response?.data?.error?.message || 'Upload failed. Please try again.';
            showError(errorMessage);
        } finally {
            setUploading(false);
            setProgress('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <Card className={`border-2 border-dashed transition-colors ${isDragging ? 'border-[#8B2E3C] bg-[#F5E8EA]' : 'border-[#E8D4B8]'}`}>
            <CardContent className="space-y-4">
                {requireContributorName && (
                    <Input
                        id="contributorName"
                        label="Your Name"
                        placeholder="Enter your name"
                        value={contributorName}
                        onChange={(e) => {
                            const sanitized = sanitizeText(e.target.value);
                            setContributorName(sanitized);
                        }}
                        disabled={uploading}
                    />
                )}

                <div
                    className="flex flex-col items-center justify-center p-8 cursor-pointer"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />

                    {uploading ? (
                        <div className="text-center w-full">
                            <LoadingSpinner size="lg" text={progress} />
                        </div>
                    ) : (
                    <>
                        <Upload className="h-10 w-10 text-[#6B5A42] mb-4" />
                        <p className="text-sm font-medium text-[#8B7355]">Click to upload or drag and drop</p>
                        <p className="text-xs text-[#A68F75] mt-1">Images and Videos supported</p>
                    </>
                )}
                </div>
            </CardContent>
        </Card>
    );
}

