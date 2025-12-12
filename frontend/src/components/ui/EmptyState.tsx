import { type ReactNode } from 'react';
import { Card, CardContent } from './Card';
import { Button } from './Button';

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary' | 'outline';
    };
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className = ''
}: EmptyStateProps) {
    return (
        <Card className={`border-2 border-dashed border-[#E8D4B8] bg-[#FDF8F3] ${className}`}>
            <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 px-4 md:px-8">
                <div className="rounded-full bg-[#D4E4F0] border-2 border-[#A8C5D9] p-4 md:p-6 mb-6">
                    <div className="text-[#5A8BB0]">
                        {icon}
                    </div>
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-[#8B7355] mb-2 text-center">
                    {title}
                </h3>
                <p className="text-[#6B5A42] mb-6 text-center max-w-md text-sm md:text-base">
                    {description}
                </p>
                {action && (
                    <Button
                        size="lg"
                        variant={action.variant || 'primary'}
                        onClick={action.onClick}
                        className="min-w-[200px]"
                    >
                        {action.label}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

