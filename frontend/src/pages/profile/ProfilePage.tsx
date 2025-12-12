import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { User, Calendar, BarChart3, CreditCard, Trash2, LogIn } from 'lucide-react';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';

const profileSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface UserStats {
    totalAlbums: number;
    totalMedia: number;
    totalStorageUsed: number;
    accountCreatedAt: string;
}

interface Subscription {
    id: string;
    status: string;
    plan: {
        tier: string;
        name: string;
        priceMonthly: number;
    };
}

interface Trial {
    isActive: boolean;
    isExpired: boolean;
    startedAt: string | null;
    endsAt: string | null;
}

export default function ProfilePage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [trial, setTrial] = useState<Trial | null>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const [profileRes, statsRes, subscriptionRes, plansRes] = await Promise.all([
                    api.get('/users/me'),
                    api.get('/users/me/stats'),
                    api.get('/subscriptions/current'),
                    api.get('/subscriptions/plans'),
                ]);

                const userData = profileRes.data.data.user;
                setUser(userData);
                reset({
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                });

                const statsData = statsRes.data.data.stats || statsRes.data.data;
                setStats({
                    totalAlbums: statsData.albumCount || 0,
                    totalMedia: statsData.mediaCount || 0,
                    totalStorageUsed: typeof statsData.storageUsedBytes === 'string'
                        ? parseInt(statsData.storageUsedBytes, 10)
                        : (statsData.storageUsedBytes || 0),
                    accountCreatedAt: statsData.memberSince || userData.createdAt || new Date().toISOString(),
                });

                if (subscriptionRes.data.data.subscription) {
                    setSubscription(subscriptionRes.data.data.subscription);
                }
                if (subscriptionRes.data.data.trial) {
                    setTrial(subscriptionRes.data.data.trial);
                }

                if (plansRes.data.data.plans) {
                    setPlans(plansRes.data.data.plans);
                }
            } catch (err: any) {
                setError(err.response?.data?.error?.message || 'Failed to load profile');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [reset]);

    const onSubmit = async (data: ProfileForm) => {
        try {
            setIsSaving(true);
            setError(null);
            setSuccess(false);
            await api.put('/users/me', data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpgrade = (planId: string) => {
        /* TODO: Integrate with payment provider */
        api.post('/subscriptions/upgrade', { planId })
            .then(() => {
                setSuccess(true);
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            })
            .catch((err: any) => {
                setError(err.response?.data?.error?.message || 'Failed to upgrade subscription');
            });
    };

    const handleDeleteAccount = async () => {
        try {
            setIsDeleting(true);
            await api.delete('/users/me');
            localStorage.clear();
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to delete account');
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#8B2E3C] border-r-transparent"></div>
                    <p className="text-[#6B5A42]">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div>
                <h1 className="text-4xl font-bold text-[#8B7355] mb-2">Profile</h1>
                <p className="text-[#6B5A42]">Manage your account information</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Profile Form */}
                <Card className="border-2 border-[#E8D4B8] shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl text-[#8B7355] flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <Input
                                id="firstName"
                                label="First Name"
                                {...register('firstName')}
                                error={errors.firstName?.message}
                            />
                            <Input
                                id="lastName"
                                label="Last Name"
                                {...register('lastName')}
                                error={errors.lastName?.message}
                            />

                            {error && (
                                <div className="rounded-lg bg-[#F5E8EA] border-2 border-[#D9A0A8] p-3">
                                    <p className="text-sm text-[#8B2E3C] font-medium">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="rounded-lg bg-[#F0F6FA] border-2 border-[#A8C5D9] p-3">
                                    <p className="text-sm text-[#5A8BB0] font-medium">Profile updated successfully!</p>
                                </div>
                            )}

                            <Button type="submit" isLoading={isSaving} className="w-full">
                                Save Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Subscription Info */}
                <Card className="border-2 border-[#E8D4B8] shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl text-[#8B7355] flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Subscription
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {subscription && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-[#FDF8F3] border-2 border-[#E8D4B8] rounded-lg">
                                    <span className="text-[#6B5A42]">Current Plan</span>
                                    <span className="text-lg font-semibold text-[#8B7355]">
                                        {subscription.plan.name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#FDF8F3] border-2 border-[#E8D4B8] rounded-lg">
                                    <span className="text-[#6B5A42]">Status</span>
                                    <span className={`text-sm font-semibold px-2 py-1 rounded ${
                                        subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                        subscription.status === 'TRIAL' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {subscription.status}
                                    </span>
                                </div>
                                {Number(subscription.plan.priceMonthly) > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-[#FDF8F3] border-2 border-[#E8D4B8] rounded-lg">
                                        <span className="text-[#6B5A42]">Monthly Price</span>
                                        <span className="text-lg font-semibold text-[#8B7355]">
                                            ${Number(subscription.plan.priceMonthly).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        {trial && trial.isActive && (
                            <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-700">
                                    <strong>Trial Active:</strong> {trial.endsAt
                                        ? `Expires ${new Date(trial.endsAt).toLocaleDateString()}`
                                        : 'Active'}
                                </p>
                            </div>
                        )}
                        {trial && trial.isExpired && (
                            <div className="p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-700 mb-2">
                                    Your trial has expired. Upgrade to continue using the service.
                                </p>
                            </div>
                        )}
                        {plans.length > 0 && (
                            <div className="pt-4 border-t border-[#E8D4B8]">
                                <h4 className="text-sm font-semibold text-[#8B7355] mb-2">Available Plans</h4>
                                <div className="space-y-2">
                                    {plans.filter(p => p.tier !== subscription?.plan.tier).map((plan) => (
                                        <div key={plan.id} className="flex items-center justify-between p-2 bg-[#FDF8F3] rounded">
                                            <div>
                                                <span className="text-sm font-medium text-[#8B7355]">{plan.name}</span>
                                                <span className="text-xs text-[#6B5A42] ml-2">
                                                    ${Number(plan.priceMonthly).toFixed(2)}/mo
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpgrade(plan.id)}
                                                className="text-xs"
                                            >
                                                Upgrade
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Statistics */}
                {stats && (
                    <Card className="border-2 border-[#E8D4B8] shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-2xl text-[#8B7355] flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Statistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-[#FDF8F3] border-2 border-[#E8D4B8] rounded-lg">
                                    <span className="text-[#6B5A42]">Total Albums</span>
                                    <span className="text-2xl font-bold text-[#8B2E3C]">{stats.totalAlbums}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#FDF8F3] border-2 border-[#E8D4B8] rounded-lg">
                                    <span className="text-[#6B5A42]">Total Media</span>
                                    <span className="text-2xl font-bold text-[#8B2E3C]">{stats.totalMedia}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#FDF8F3] border-2 border-[#E8D4B8] rounded-lg">
                                    <span className="text-[#6B5A42]">Storage Used</span>
                                    <span className="text-lg font-semibold text-[#8B7355]">
                                        {stats.totalStorageUsed && !isNaN(stats.totalStorageUsed)
                                            ? (stats.totalStorageUsed / 1024 / 1024).toFixed(2) + ' MB'
                                            : '0.00 MB'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-[#FDF8F3] border-2 border-[#E8D4B8] rounded-lg">
                                    <Calendar className="h-4 w-4 text-[#6B5A42]" />
                                    <span className="text-sm text-[#6B5A42]">
                                        Member since {new Date(stats.accountCreatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {user?.lastLoginAt && (
                                    <div className="flex items-center gap-2 p-3 bg-[#FDF8F3] border-2 border-[#E8D4B8] rounded-lg">
                                        <LogIn className="h-4 w-4 text-[#6B5A42]" />
                                        <span className="text-sm text-[#6B5A42]">
                                            Last login: {new Date(user.lastLoginAt).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Delete Account */}
                <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 shadow-xl">
                    <CardHeader className="bg-red-50/50 border-b border-red-200">
                        <CardTitle className="text-2xl text-red-700 flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-red-100">
                                <Trash2 className="h-5 w-5 text-red-600" />
                            </div>
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-white/60 rounded-lg border border-red-200">
                                <p className="text-sm text-[#6B5A42] leading-relaxed">
                                    Once you delete your account, there is no going back. All your albums, media, and data will be permanently deleted. Please be certain.
                                </p>
                            </div>
                            <Button
                                variant="danger"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full shadow-md hover:shadow-lg"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Delete Account Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account"
                message="Are you absolutely sure you want to delete your account? This action cannot be undone. All your albums, media, and data will be permanently deleted."
                confirmText="Yes, Delete My Account"
                cancelText="Cancel"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}

