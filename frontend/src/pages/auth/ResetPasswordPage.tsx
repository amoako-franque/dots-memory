import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import api from '../../lib/api';
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react';

const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
    const { showError, showSuccess } = useNotifications();
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
    });

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token. Please request a new password reset link.');
            showError('Invalid or missing reset token');
        }
    }, [token, showError]);

    const onSubmit = async (data: ResetPasswordForm) => {
        if (!token) {
            setError('Invalid or missing reset token');
            return;
        }

        try {
            setError(null);
            setIsSubmitting(true);

            await api.post('/auth/reset-password', {
                token,
                password: data.password,
            });

            setIsSuccess(true);
            showSuccess('Password reset successful! You can now sign in with your new password.');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            const errorMessage = err.response?.data?.error?.message || 'Failed to reset password';
            const errorCode = err.response?.data?.error?.code;

            if (errorCode === 'TOKEN_EXPIRED') {
                setError('This password reset link has expired. Please request a new one.');
            } else if (errorCode === 'TOKEN_ALREADY_USED') {
                setError('This password reset link has already been used. Please request a new one.');
            } else {
                setError(errorMessage);
            }
            showError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#FDF8F3]">
                <div className="w-full max-w-md space-y-8">
                    <Card className="w-full border-2 border-[#E8D4B8] bg-white shadow-xl">
                        <CardContent className="pt-6 pb-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 border-2 border-green-300 mb-4">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-2">
                                    Password Reset Successful!
                                </h2>
                                <p className="text-[#6B5A42] mb-6">
                                    Your password has been successfully reset. You can now sign in with your new password.
                                </p>
                                <p className="text-sm text-[#A68F75] mb-6">
                                    Redirecting to sign in page...
                                </p>
                                <Link to="/login">
                                    <Button className="w-full">
                                        Go to Sign In
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#FDF8F3]">
            <div className="w-full max-w-md space-y-8">
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-[#6B5A42] hover:text-[#8B2E3C] transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Back to Sign In</span>
                </Link>
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#8B2E3C] border-4 border-[#6B1F2D] mb-4 shadow-lg">
                        <Lock className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-[#8B7355]">
                        Memory
                    </h1>
                    <p className="mt-2 text-[#6B5A42]">Create a new password</p>
                </div>
                <Card className="w-full border-2 border-[#E8D4B8] bg-white shadow-xl">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl font-semibold text-center text-[#8B7355]">
                            Reset Password
                        </CardTitle>
                        <p className="text-sm text-center text-[#6B5A42] mt-2">
                            Enter your new password below.
                        </p>
                    </CardHeader>
                    <CardContent>
                        {!token && (
                            <div className="rounded-lg bg-[#F5E8EA] border-2 border-[#D9A0A8] p-3 mb-4">
                                <p className="text-sm text-[#8B2E3C] font-medium">
                                    Invalid or missing reset token. Please request a new password reset link.
                                </p>
                            </div>
                        )}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <Input
                                id="password"
                                type="password"
                                label="New Password"
                                placeholder="••••••••"
                                {...register('password')}
                                error={errors.password?.message}
                                disabled={!token}
                            />
                            <Input
                                id="confirmPassword"
                                type="password"
                                label="Confirm New Password"
                                placeholder="••••••••"
                                {...register('confirmPassword')}
                                error={errors.confirmPassword?.message}
                                disabled={!token}
                            />
                            {error && (
                                <div className="rounded-lg bg-[#F5E8EA] border-2 border-[#D9A0A8] p-3">
                                    <p className="text-sm text-[#8B2E3C] font-medium">{error}</p>
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full mt-6"
                                isLoading={isSubmitting}
                                disabled={!token}
                            >
                                Reset Password
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center pt-4">
                        <p className="text-sm text-[#6B5A42]">
                            Remember your password?{' '}
                            <Link to="/login" className="font-semibold text-[#8B2E3C] hover:text-[#6B1F2D] transition-colors underline">
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

