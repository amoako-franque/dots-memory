import { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useNotifications } from '../notifications/NotificationSystem';
import { Lock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const PUBLIC_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:30700/api/v1';

interface AccessCodeEntryProps {
    albumId: string;
    albumName: string;
    onVerified: (sessionToken: string) => void;
    remainingAttempts?: number;
}

export default function AccessCodeEntry({ albumId, albumName, onVerified, remainingAttempts }: AccessCodeEntryProps) {
    const { showError } = useNotifications();
    const [accessCode, setAccessCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!accessCode.trim()) {
            setError('Please enter an access code');
            return;
        }

        setIsVerifying(true);
        setError(null);

        try {
            const response = await axios.post(
                `${PUBLIC_API_URL}/public/album/${albumId}/verify-access`,
                { accessCode }
            );

            if (response.data.success && response.data.data.valid) {
                const sessionToken = response.data.data.sessionToken || response.headers['x-session-token'];
                if (sessionToken) {
                    onVerified(sessionToken);
                } else {
                    onVerified(accessCode); // Fallback to access code if no session token
                }
            } else {
                setError('Invalid access code. Please try again.');
            }
        } catch (err: any) {
            const errorData = err.response?.data?.error;
            let errorMessage = errorData?.message || 'Failed to verify access code';

            if (errorData?.code === 'ACCOUNT_LOCKED') {
                const unlockAt = errorData?.unlockAt;
                if (unlockAt) {
                    const unlockDate = new Date(unlockAt);
                    const now = new Date();
                    const minutesLeft = Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60));
                    errorMessage = `Too many failed attempts. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`;
                } else {
                    errorMessage = 'Too many failed attempts. Please try again later.';
                }
            }

            setError(errorMessage);
            showError(errorMessage);
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 sm:p-8 bg-[#FDF8F3]">
            <Card className="max-w-md w-full border-2 border-[#D9A0A8] bg-[#F5E8EA] shadow-lg">
                <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8 px-4 sm:px-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#8B2E3C] mb-4">
                            <Lock className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-[#8B7355] mb-2">Access Required</h2>
                        <p className="text-[#6B5A42] text-xs sm:text-sm">
                            This album is protected with an access code
                        </p>
                        {albumName && (
                            <p className="text-[#8B2E3C] font-semibold mt-2">{albumName}</p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="accessCode" className="block text-sm font-medium text-[#6B5A42] mb-2">
                                Enter Access Code
                            </label>
                            <input
                                id="accessCode"
                                type="text"
                                value={accessCode}
                                onChange={(e) => {
                                    setAccessCode(e.target.value);
                                    setError(null);
                                }}
                                placeholder="Enter the access code"
                                className="w-full px-4 py-3 border-2 border-[#D9A0A8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B2E3C] focus:border-transparent text-[#6B5A42] bg-white"
                                autoFocus
                                disabled={isVerifying}
                            />
                        </div>

                        {remainingAttempts !== undefined && remainingAttempts > 0 && (
                            <div className="text-xs text-[#6B5A42] text-center">
                                {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-[#8B2E3C] text-sm bg-[#F5E8EA] border border-[#D9A0A8] rounded-lg p-3">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={isVerifying || !accessCode.trim()}
                            isLoading={isVerifying}
                        >
                            {isVerifying ? 'Verifying...' : 'Access Album'}
                        </Button>
                    </form>

                    <p className="text-xs text-[#6B5A42] text-center mt-4">
                        Contact the album owner if you don't have the access code
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

