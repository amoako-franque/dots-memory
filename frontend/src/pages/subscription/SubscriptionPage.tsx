import { useEffect, useState } from 'react';
import { Check, Crown, Zap, Rocket, CreditCard, TrendingUp, Image as ImageIcon, Folder, Globe, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

interface SubscriptionPlan {
    id: string;
    tier: string;
    name: string;
    description: string;
    priceMonthly: number;
    maxPhotos: number;
    maxVideos: number;
    maxAlbums: number;
    maxPhotoSizeMB: number;
    maxVideoSizeMB: number;
    maxVideoLengthSec: number;
    totalStorageGB: number;
    allowVideos: boolean;
}

interface CurrentSubscription {
    id: string;
    planId: string;
    status: string;
    startDate: string;
    endDate: string | null;
    nextBillingDate: string | null;
    cancelAtPeriodEnd: boolean;
    paymentProvider: string | null;
    plan: SubscriptionPlan;
}

interface UsageStats {
    photosUsed: number;
    videosUsed: number;
    albumsUsed: number;
    storageUsedGB: number;
    photosLimit: number;
    videosLimit: number;
    albumsLimit: number;
    storageLimitGB: number;
}

type PaymentProvider = 'STRIPE' | 'PAYSTACK';

export default function SubscriptionPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<PaymentProvider>('STRIPE');
    const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            setSuccess('Subscription activated successfully!');
            fetchData();
            window.history.replaceState({}, '', window.location.pathname);
        } else if (urlParams.get('canceled') === 'true') {
            setError('Subscription checkout was cancelled.');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [plansRes, subscriptionRes, usageRes] = await Promise.all([
                api.get('/subscriptions/plans').catch(() => ({ data: { data: { plans: [] } } })),
                api.get('/subscriptions/current').catch(() => ({ data: { data: { subscription: null } } })),
                api.get('/subscriptions/usage').catch(() => ({ data: { data: { usage: null } } })),
            ]);

            setPlans(plansRes.data?.data?.plans || []);
            setCurrentSubscription(subscriptionRes.data?.data?.subscription);
            setUsage(usageRes.data?.data?.usage);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load subscription data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubscribe = async (planId: string) => {
        if (processingPlanId) return;

        try {
            setProcessingPlanId(planId);
            setError(null);
            setSuccess(null);

            const response = await api.post('/subscriptions/checkout', {
                planId,
                paymentProvider: selectedPaymentProvider,
                successUrl: `${window.location.origin}/subscription?success=true`,
                cancelUrl: `${window.location.origin}/subscription?canceled=true`,
            });

            const checkoutData = response.data.data;

            if (checkoutData.checkoutUrl) {
                window.location.href = checkoutData.checkoutUrl;
            } else {
                setError('Failed to create checkout session');
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to create checkout session');
            setProcessingPlanId(null);
        }
    };

    const handleSwitchPlan = async (newPlanId: string) => {
        if (!currentSubscription) {
            setError('No active subscription to switch');
            return;
        }

        if (!confirm('Are you sure you want to switch to this plan? The change will take effect immediately.')) {
            return;
        }

        try {
            setError(null);
            setSuccess(null);

            await api.post('/subscriptions/switch', { planId: newPlanId });
            setSuccess('Subscription plan switched successfully!');
            await fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to switch subscription plan');
        }
    };

    const handleCancel = async () => {
        if (!currentSubscription) {
            return;
        }

        const cancelImmediately = confirm(
            'Do you want to cancel immediately? Click OK for immediate cancellation, or Cancel to cancel at the end of the billing period.'
        );

        const message = cancelImmediately
            ? 'Are you sure you want to cancel your subscription immediately? This action cannot be undone.'
            : 'Are you sure you want to cancel your subscription? It will remain active until the end of the billing period.';

        if (!confirm(message)) {
            return;
        }

        try {
            setError(null);
            setSuccess(null);

            await api.post('/subscriptions/cancel', { cancelImmediately });
            setSuccess(
                cancelImmediately
                    ? 'Subscription cancelled successfully'
                    : 'Subscription will be cancelled at the end of the billing period'
            );
            await fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to cancel subscription');
        }
    };

    const getTierIcon = (tier: string) => {
        switch (tier) {
            case 'FREE':
                return <Zap className="h-6 w-6" />;
            case 'BASIC':
                return <ImageIcon className="h-6 w-6" />;
            case 'PRO':
                return <Rocket className="h-6 w-6" />;
            case 'PREMIUM':
                return <Crown className="h-6 w-6" />;
            default:
                return <Folder className="h-6 w-6" />;
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'FREE':
                return 'bg-[#D4E4F0] border-[#A8C5D9] text-[#5A8BB0]';
            case 'BASIC':
                return 'bg-[#F5E6D3] border-[#E8D4B8] text-[#8B7355]';
            case 'PRO':
                return 'bg-[#F5E8EA] border-[#D9A0A8] text-[#8B2E3C]';
            case 'PREMIUM':
                return 'bg-[#E8D4B8] border-[#D9C19D] text-[#6B5A42]';
            default:
                return 'bg-gray-100 border-gray-300 text-gray-700';
        }
    };

    const formatLimit = (value: number) => {
        if (value === -1) return 'Unlimited';
        return value.toLocaleString();
    };

    const getUsagePercentage = (used: number, limit: number) => {
        if (limit === -1) return 0;
        return Math.min((used / limit) * 100, 100);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#8B2E3C] border-r-transparent"></div>
                    <p className="text-[#6B5A42]">Loading subscription...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-[#8B7355] mb-2">Subscription</h1>
                <p className="text-[#6B5A42]">Manage your subscription and view usage</p>
            </div>

            {error && (
                <Card className="border-2 border-[#D9A0A8] bg-[#F5E8EA]">
                    <CardContent className="pt-6">
                        <p className="text-[#8B2E3C] font-medium">{error}</p>
                    </CardContent>
                </Card>
            )}

            {success && (
                <Card className="border-2 border-green-300 bg-green-50">
                    <CardContent className="pt-6">
                        <p className="text-green-700 font-medium">{success}</p>
                    </CardContent>
                </Card>
            )}

            {/* Payment Provider Selection */}
            {!currentSubscription && (
                <Card className="border-2 border-[#E8D4B8]">
                    <CardHeader>
                        <CardTitle className="text-xl text-[#8B7355] flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Choose Payment Provider
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <button
                                onClick={() => setSelectedPaymentProvider('STRIPE')}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                    selectedPaymentProvider === 'STRIPE'
                                        ? 'border-[#8B2E3C] bg-[#F5E8EA]'
                                        : 'border-[#E8D4B8] hover:border-[#D9C19D]'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Globe className="h-6 w-6 text-[#8B2E3C]" />
                                    <div className="text-left">
                                        <div className="font-semibold text-[#8B7355]">Stripe</div>
                                        <div className="text-sm text-[#6B5A42]">International payments</div>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => setSelectedPaymentProvider('PAYSTACK')}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                    selectedPaymentProvider === 'PAYSTACK'
                                        ? 'border-[#8B2E3C] bg-[#F5E8EA]'
                                        : 'border-[#E8D4B8] hover:border-[#D9C19D]'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <DollarSign className="h-6 w-6 text-[#8B2E3C]" />
                                    <div className="text-left">
                                        <div className="font-semibold text-[#8B7355]">Paystack</div>
                                        <div className="text-sm text-[#6B5A42]">Nigeria & Africa</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Current Subscription */}
            {currentSubscription && (
                <Card className="border-2 border-[#E8D4B8]">
                    <CardHeader>
                        <CardTitle className="text-xl text-[#8B7355] flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Current Plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-[#8B7355]">{currentSubscription.plan.name}</h3>
                                <p className="text-[#6B5A42] mt-1">{currentSubscription.plan.description}</p>
                                {currentSubscription.paymentProvider && (
                                    <p className="text-sm text-[#A68F75] mt-1">
                                        Payment via: {currentSubscription.paymentProvider}
                                    </p>
                                )}
                                {currentSubscription.nextBillingDate && (
                                    <p className="text-sm text-[#A68F75] mt-2">
                                        {currentSubscription.cancelAtPeriodEnd
                                            ? `Cancels on ${new Date(currentSubscription.nextBillingDate).toLocaleDateString()}`
                                            : `Next billing: ${new Date(currentSubscription.nextBillingDate).toLocaleDateString()}`}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-[#8B2E3C]">
                                    ${currentSubscription.plan.priceMonthly}
                                    <span className="text-lg text-[#6B5A42]">/month</span>
                                </div>
                                {!currentSubscription.cancelAtPeriodEnd && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleCancel}
                                        className="mt-2 border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                        Cancel Subscription
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Usage Statistics */}
            {usage && (
                <Card className="border-2 border-[#E8D4B8]">
                    <CardHeader>
                        <CardTitle className="text-xl text-[#8B7355] flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Usage Statistics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#6B5A42]">Photos</span>
                                    <span className="text-sm font-medium text-[#8B7355]">
                                        {usage.photosUsed} / {formatLimit(usage.photosLimit)}
                                    </span>
                                </div>
                                <div className="h-2 bg-[#F5E6D3] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#8B2E3C] transition-all duration-300"
                                        style={{ width: `${getUsagePercentage(usage.photosUsed, usage.photosLimit)}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#6B5A42]">Videos</span>
                                    <span className="text-sm font-medium text-[#8B7355]">
                                        {usage.videosUsed} / {formatLimit(usage.videosLimit)}
                                    </span>
                                </div>
                                <div className="h-2 bg-[#F5E6D3] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#8B2E3C] transition-all duration-300"
                                        style={{ width: `${getUsagePercentage(usage.videosUsed, usage.videosLimit)}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#6B5A42]">Albums</span>
                                    <span className="text-sm font-medium text-[#8B7355]">
                                        {usage.albumsUsed} / {formatLimit(usage.albumsLimit)}
                                    </span>
                                </div>
                                <div className="h-2 bg-[#F5E6D3] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#8B2E3C] transition-all duration-300"
                                        style={{ width: `${getUsagePercentage(usage.albumsUsed, usage.albumsLimit)}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#6B5A42]">Storage</span>
                                    <span className="text-sm font-medium text-[#8B7355]">
                                        {usage.storageUsedGB.toFixed(2)} GB / {formatLimit(usage.storageLimitGB)} GB
                                    </span>
                                </div>
                                <div className="h-2 bg-[#F5E6D3] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#8B2E3C] transition-all duration-300"
                                        style={{ width: `${getUsagePercentage(usage.storageUsedGB, usage.storageLimitGB)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Available Plans */}
            <div>
                <h2 className="text-2xl font-bold text-[#8B7355] mb-6">Available Plans</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => {
                        const isCurrentPlan = currentSubscription?.planId === plan.id;
                        const isFreePlan = plan.tier === 'FREE';
                        return (
                            <Card
                                key={plan.id}
                                className={`border-2 ${getTierColor(plan.tier)} ${isCurrentPlan ? 'ring-2 ring-[#8B2E3C]' : ''}`}
                            >
                                <CardHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        {getTierIcon(plan.tier)}
                                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    </div>
                                    <div className="text-3xl font-bold">
                                        ${plan.priceMonthly}
                                        <span className="text-lg font-normal">/month</span>
                                    </div>
                                    <p className="text-sm mt-2 opacity-80">{plan.description}</p>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 mb-6">
                                        <li className="flex items-center gap-2 text-sm">
                                            <Check className="h-4 w-4" />
                                            {formatLimit(plan.maxPhotos)} photos
                                        </li>
                                        <li className="flex items-center gap-2 text-sm">
                                            <Check className="h-4 w-4" />
                                            {formatLimit(plan.maxVideos)} videos
                                        </li>
                                        <li className="flex items-center gap-2 text-sm">
                                            <Check className="h-4 w-4" />
                                            {formatLimit(plan.maxAlbums)} albums
                                        </li>
                                        <li className="flex items-center gap-2 text-sm">
                                            <Check className="h-4 w-4" />
                                            {formatLimit(plan.totalStorageGB)} GB storage
                                        </li>
                                        <li className="flex items-center gap-2 text-sm">
                                            <Check className="h-4 w-4" />
                                            Max {plan.maxPhotoSizeMB}MB per photo
                                        </li>
                                        {plan.allowVideos && (
                                            <li className="flex items-center gap-2 text-sm">
                                                <Check className="h-4 w-4" />
                                                Max {plan.maxVideoSizeMB}MB per video
                                            </li>
                                        )}
                                    </ul>
                                    {isCurrentPlan ? (
                                        <Button variant="secondary" className="w-full" disabled>
                                            Current Plan
                                        </Button>
                                    ) : isFreePlan ? (
                                        <Button
                                            variant="primary"
                                            className="w-full"
                                            onClick={() => handleSubscribe(plan.id)}
                                            disabled={processingPlanId === plan.id}
                                        >
                                            {processingPlanId === plan.id ? 'Processing...' : 'Get Started'}
                                        </Button>
                                    ) : currentSubscription ? (
                                        <Button
                                            variant="primary"
                                            className="w-full"
                                            onClick={() => handleSwitchPlan(plan.id)}
                                            disabled={processingPlanId === plan.id}
                                        >
                                            {processingPlanId === plan.id ? 'Switching...' : 'Switch Plan'}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            className="w-full"
                                            onClick={() => handleSubscribe(plan.id)}
                                            disabled={processingPlanId === plan.id}
                                        >
                                            {processingPlanId === plan.id ? 'Processing...' : 'Subscribe'}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
