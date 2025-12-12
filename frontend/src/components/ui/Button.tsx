import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: 'bg-[#8B2E3C] text-white hover:bg-[#6B1F2D] active:bg-[#4D151F] border-2 border-[#6B1F2D] focus:ring-2 focus:ring-[#A84A5A] focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200',
            secondary: 'bg-[#8B7355] text-white hover:bg-[#6B5A42] active:bg-[#4A3D2E] border-2 border-[#6B5A42] focus:ring-2 focus:ring-[#A68F75] focus:ring-offset-2 shadow-sm hover:shadow-md transition-all duration-200',
            outline: 'border-2 border-[#8B7355] bg-transparent text-[#8B7355] hover:bg-[#F5E6D3] hover:border-[#6B5A42] focus:ring-2 focus:ring-[#A68F75] focus:ring-offset-2 transition-all duration-200',
            ghost: 'bg-transparent hover:bg-[#F5E6D3] text-[#8B7355] focus:ring-2 focus:ring-[#A68F75] focus:ring-offset-2 transition-all duration-200',
            danger: 'bg-[#6B1F2D] text-white hover:bg-[#4D151F] active:bg-[#4D151F] border-2 border-[#4D151F] focus:ring-2 focus:ring-[#A84A5A] focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200',
        };

        const sizes = {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4 py-2',
            lg: 'h-12 px-6 text-lg',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
