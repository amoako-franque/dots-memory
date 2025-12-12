import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from './Card';
import { Button } from './Button';

interface ErrorDisplayProps {
    message: string;
    title?: string;
    onRetry?: () => void;
    retryText?: string;
    className?: string;
}

export function ErrorDisplay({
    message,
    title = 'Something went wrong',
    onRetry,
    retryText = 'Try Again',
    className = ''
}: ErrorDisplayProps) {
    return (
        <div className={`flex min-h-[60vh] items-center justify-center p-8 ${className}`}>
            <Card className="max-w-md w-full border-2 border-[#D9A0A8] bg-[#F5E8EA]">
                <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="rounded-full bg-[#F5E8EA] border-2 border-[#D9A0A8] p-4">
                            <AlertCircle className="h-8 w-8 text-[#8B2E3C]" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-[#8B2E3C] mb-2">
                                {title}
                            </h3>
                            <p className="text-[#8B2E3C] text-sm md:text-base">
                                {message}
                            </p>
                        </div>
                        {onRetry && (
                            <Button
                                onClick={onRetry}
                                variant="primary"
                                size="md"
                                className="mt-4"
                            >
                                {retryText}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

