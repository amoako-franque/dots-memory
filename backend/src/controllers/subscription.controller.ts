import { Request, Response, NextFunction } from 'express';
import subscriptionService from '../services/subscription.service';
import usageService from '../services/usage.service';
import prisma from '../config/db';
import logger from '../utils/logger';

class SubscriptionController {
    /**
     * Get all available subscription plans
     */
    async getPlans(req: Request, res: Response, next: NextFunction) {
        try {
            const plans = await subscriptionService.getAvailablePlans();

            res.json({
                success: true,
                data: { plans },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user's current subscription
     */
    async getCurrentSubscription(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: { message: 'Unauthorized' },
                });
            }

            const subscription = await subscriptionService.getUserSubscription(userId);
            const isTrialActive = await subscriptionService.isTrialActive(userId);
            const isTrialExpired = await subscriptionService.isTrialExpired(userId);

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { trialStartedAt: true, trialEndsAt: true },
            });

            res.json({
                success: true,
                data: {
                    subscription,
                    trial: {
                        isActive: isTrialActive,
                        isExpired: isTrialExpired,
                        startedAt: user?.trialStartedAt,
                        endsAt: user?.trialEndsAt,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user's usage statistics
     */
    async getUsage(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: { message: 'Unauthorized' },
                });
            }

            const usageSummary = await usageService.getUsageSummary(userId);

            res.json({
                success: true,
                data: usageSummary,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get subscription limits for current user
     */
    async getLimits(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: { message: 'Unauthorized' },
                });
            }

            const limits = await subscriptionService.getSubscriptionLimits(userId);

            res.json({
                success: true,
                data: { limits },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create checkout session for subscription
     */
    async createCheckoutSession(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            const { planId, paymentProvider, successUrl, cancelUrl } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: { message: 'Unauthorized' },
                });
            }

            if (!planId || !paymentProvider) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Plan ID and payment provider are required' },
                });
            }

            if (!['STRIPE', 'PAYSTACK'].includes(paymentProvider)) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Invalid payment provider. Use STRIPE or PAYSTACK' },
                });
            }

            const defaultSuccessUrl = successUrl || `${req.protocol}://${req.get('host')}/subscription?success=true`;
            const defaultCancelUrl = cancelUrl || `${req.protocol}://${req.get('host')}/subscription?canceled=true`;

            const checkout = await subscriptionService.createCheckoutSession(
                userId,
                planId,
                paymentProvider,
                defaultSuccessUrl,
                defaultCancelUrl
            );

            logger.info('Checkout session created', { userId, planId, paymentProvider });

            res.json({
                success: true,
                data: checkout,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Switch subscription to a new plan
     */
    async switchPlan(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            const { planId } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: { message: 'Unauthorized' },
                });
            }

            if (!planId) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Plan ID is required' },
                });
            }

            const subscription = await subscriptionService.switchSubscription(userId, planId);

            logger.info('Subscription switched via API', { userId, planId });

            res.json({
                success: true,
                data: { subscription },
                message: 'Subscription switched successfully',
            });
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'PLAN_NOT_FOUND' || error.message === 'NO_ACTIVE_SUBSCRIPTION') {
                    return res.status(404).json({
                        success: false,
                        error: { message: error.message },
                    });
                }
                if (error.message === 'SAME_PLAN' || error.message === 'NO_PAYMENT_PROVIDER') {
                    return res.status(400).json({
                        success: false,
                        error: { message: error.message },
                    });
                }
            }
            next(error);
        }
    }

    /**
     * Cancel current subscription
     */
    async cancelSubscription(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            const { cancelImmediately } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: { message: 'Unauthorized' },
                });
            }

            const subscription = await subscriptionService.cancelSubscription(
                userId,
                cancelImmediately === true
            );

            logger.info('Subscription cancelled via API', { userId, cancelImmediately });

            res.json({
                success: true,
                data: { subscription },
                message: cancelImmediately
                    ? 'Subscription cancelled immediately'
                    : 'Subscription will be cancelled at the end of the billing period',
            });
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'NO_ACTIVE_SUBSCRIPTION') {
                    return res.status(404).json({
                        success: false,
                        error: { message: 'No active subscription found' },
                    });
                }
            }
            next(error);
        }
    }
}

export default new SubscriptionController();
