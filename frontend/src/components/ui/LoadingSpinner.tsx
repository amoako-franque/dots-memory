import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

export function LoadingSpinner({
    size = 'md',
    text,
    fullScreen = false,
    className = ''
}: LoadingSpinnerProps) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    const spinner = (
        <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
            <Loader2 className={`${sizes[size]} animate-spin text-[#8B2E3C]`} />
            {text && (
                <p className="text-[#6B5A42] text-sm md:text-base">{text}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8">
                {spinner}
            </div>
        );
    }

    return spinner;
}

