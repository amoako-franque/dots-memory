import prisma from '../config/db';
import subscriptionService from './subscription.service';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/errors';

export class UsageService {
    /**
     * Get user's current usage statistics
     */
    async getUserUsage(userId: string) {
        let usage = await prisma.usageStats.findUnique({
            where: { userId },
        });

        if (!usage) {
            usage = await prisma.usageStats.create({
                data: {
                    userId,
                    photoCount: 0,
                    videoCount: 0,
                    albumCount: 0,
                    storageUsedBytes: 0,
                },
            });
        }

        return usage;
    }

    /**
     * Check if user can upload more photos
     */
    async canUploadPhoto(userId: string): Promise<{ allowed: boolean; reason?: string }> {
        const [usage, limits, user] = await Promise.all([
            this.getUserUsage(userId),
            subscriptionService.getSubscriptionLimits(userId),
            prisma.user.findUnique({
                where: { id: userId },
                select: { trialEndsAt: true, trialStartedAt: true },
            }),
        ]);

        if (!limits) {
            return { allowed: false, reason: 'No subscription plan found' };
        }

        const isTrialActive = user?.trialEndsAt && new Date() < user.trialEndsAt;

        if (isTrialActive) {
            if (usage.photoCount >= 3) {
                return {
                    allowed: false,
                    reason: 'Trial limit reached: You can upload up to 3 photos during your 15-day trial. Upgrade to continue uploading.'
                };
            }
        }

        const trialExpired = await subscriptionService.isTrialExpired(userId);
        if (trialExpired) {
            const subscription = await subscriptionService.getUserSubscription(userId);
            if (!subscription || subscription.status === 'TRIAL' || subscription.status === 'EXPIRED') {
                return { allowed: false, reason: 'Trial period has expired. Please upgrade to continue.' };
            }
        }

        if (!isTrialActive && limits.maxPhotos !== -1 && usage.photoCount >= limits.maxPhotos) {
            return {
                allowed: false,
                reason: `Photo limit reached (${limits.maxPhotos} photos). Please upgrade your plan.`
            };
        }

        const storageLimitBytes = BigInt(limits.totalStorageGB) * BigInt(1024 * 1024 * 1024);
        if (storageLimitBytes > 0 && usage.storageUsedBytes >= storageLimitBytes) {
            return {
                allowed: false,
                reason: `Storage limit reached (${limits.totalStorageGB}GB). Please upgrade your plan.`
            };
        }

        return { allowed: true };
    }

    /**
     * Check if user can upload videos
     */
    async canUploadVideo(userId: string): Promise<{ allowed: boolean; reason?: string }> {
        const [usage, limits] = await Promise.all([
            this.getUserUsage(userId),
            subscriptionService.getSubscriptionLimits(userId),
        ]);

        if (!limits) {
            return { allowed: false, reason: 'No subscription plan found' };
        }

        const trialExpired = await subscriptionService.isTrialExpired(userId);
        if (trialExpired) {
            const subscription = await subscriptionService.getUserSubscription(userId);
            if (!subscription || subscription.status === 'TRIAL' || subscription.status === 'EXPIRED') {
                return { allowed: false, reason: 'Trial period has expired. Please upgrade to continue.' };
            }
        }

        if (!limits.allowVideos) {
            return {
                allowed: false,
                reason: 'Video uploads not allowed on your current plan. Please upgrade.'
            };
        }

        if (limits.maxVideos !== -1 && usage.videoCount >= limits.maxVideos) {
            return {
                allowed: false,
                reason: `Video limit reached (${limits.maxVideos} videos). Please upgrade your plan.`
            };
        }

        const storageLimitBytes = BigInt(limits.totalStorageGB) * BigInt(1024 * 1024 * 1024);
        if (storageLimitBytes > 0 && usage.storageUsedBytes >= storageLimitBytes) {
            return {
                allowed: false,
                reason: `Storage limit reached (${limits.totalStorageGB}GB). Please upgrade your plan.`
            };
        }

        return { allowed: true };
    }

    /**
     * Check if user can create more albums
     */
    async canCreateAlbum(userId: string): Promise<{ allowed: boolean; reason?: string }> {
        const [usage, limits] = await Promise.all([
            this.getUserUsage(userId),
            subscriptionService.getSubscriptionLimits(userId),
        ]);

        if (!limits) {
            return { allowed: false, reason: 'No subscription plan found' };
        }

        const trialExpired = await subscriptionService.isTrialExpired(userId);
        if (trialExpired) {
            const subscription = await subscriptionService.getUserSubscription(userId);
            if (!subscription || subscription.status === 'TRIAL' || subscription.status === 'EXPIRED') {
                return { allowed: false, reason: 'Trial period has expired. Please upgrade to continue.' };
            }
        }

        if (limits.maxAlbums !== -1 && usage.albumCount >= limits.maxAlbums) {
            return {
                allowed: false,
                reason: `Album limit reached (${limits.maxAlbums} albums). Please upgrade your plan.`
            };
        }

        return { allowed: true };
    }

    /**
     * Validate file size against subscription limits
     */
    async validateFileSize(
        userId: string,
        fileSizeBytes: number,
        isVideo: boolean = false
    ): Promise<{ valid: boolean; reason?: string }> {
        const limits = await subscriptionService.getSubscriptionLimits(userId);

        if (!limits) {
            return { valid: false, reason: 'No subscription plan found' };
        }

        const fileSizeMB = fileSizeBytes / (1024 * 1024);
        const maxSizeMB = isVideo ? limits.maxVideoSizeMB : limits.maxPhotoSizeMB;

        if (fileSizeMB > maxSizeMB) {
            return {
                valid: false,
                reason: `File size (${fileSizeMB.toFixed(2)}MB) exceeds limit of ${maxSizeMB}MB for your plan.`
            };
        }

        return { valid: true };
    }

    /**
     * Increment photo count and storage after successful upload
     */
    async incrementPhotoCount(userId: string, fileSizeBytes: bigint) {
        const usage = await this.getUserUsage(userId);

        await prisma.usageStats.update({
            where: { userId },
            data: {
                photoCount: usage.photoCount + 1,
                storageUsedBytes: usage.storageUsedBytes + fileSizeBytes,
                lastPhotoUpload: new Date(),
            },
        });

        logger.info('Photo count incremented', { userId, newCount: usage.photoCount + 1 });
    }

    /**
     * Increment video count and storage after successful upload
     */
    async incrementVideoCount(userId: string, fileSizeBytes: bigint) {
        const usage = await this.getUserUsage(userId);

        await prisma.usageStats.update({
            where: { userId },
            data: {
                videoCount: usage.videoCount + 1,
                storageUsedBytes: usage.storageUsedBytes + fileSizeBytes,
                lastVideoUpload: new Date(),
            },
        });

        logger.info('Video count incremented', { userId, newCount: usage.videoCount + 1 });
    }

    /**
     * Increment album count
     */
    async incrementAlbumCount(userId: string) {
        const usage = await this.getUserUsage(userId);

        await prisma.usageStats.update({
            where: { userId },
            data: {
                albumCount: usage.albumCount + 1,
            },
        });

        logger.info('Album count incremented', { userId, newCount: usage.albumCount + 1 });
    }

    /**
     * Decrement photo count and storage after deletion
     */
    async decrementPhotoCount(userId: string, fileSizeBytes: bigint) {
        const usage = await this.getUserUsage(userId);

        await prisma.usageStats.update({
            where: { userId },
            data: {
                photoCount: Math.max(0, usage.photoCount - 1),
                storageUsedBytes: usage.storageUsedBytes > fileSizeBytes
                    ? usage.storageUsedBytes - fileSizeBytes
                    : BigInt(0),
            },
        });

        logger.info('Photo count decremented', { userId, newCount: Math.max(0, usage.photoCount - 1) });
    }

    /**
     * Decrement video count and storage after deletion
     */
    async decrementVideoCount(userId: string, fileSizeBytes: bigint) {
        const usage = await this.getUserUsage(userId);

        await prisma.usageStats.update({
            where: { userId },
            data: {
                videoCount: Math.max(0, usage.videoCount - 1),
                storageUsedBytes: usage.storageUsedBytes > fileSizeBytes
                    ? usage.storageUsedBytes - fileSizeBytes
                    : BigInt(0),
            },
        });

        logger.info('Video count decremented', { userId, newCount: Math.max(0, usage.videoCount - 1) });
    }

    /**
     * Decrement album count
     */
    async decrementAlbumCount(userId: string) {
        const usage = await this.getUserUsage(userId);

        await prisma.usageStats.update({
            where: { userId },
            data: {
                albumCount: Math.max(0, usage.albumCount - 1),
            },
        });

        logger.info('Album count decremented', { userId, newCount: Math.max(0, usage.albumCount - 1) });
    }

    /**
     * Get usage summary with limits
     */
    async getUsageSummary(userId: string) {
        const [usage, limits] = await Promise.all([
            this.getUserUsage(userId),
            subscriptionService.getSubscriptionLimits(userId),
        ]);

        if (!limits) {
            throw new NotFoundError('Subscription plan', 'NO_SUBSCRIPTION_PLAN', userId);
        }

        const storageLimitBytes = BigInt(limits.totalStorageGB) * BigInt(1024 * 1024 * 1024);
        const storageUsedMB = Number(usage.storageUsedBytes) / (1024 * 1024);
        const storageLimitMB = Number(storageLimitBytes) / (1024 * 1024);

        return {
            usage: {
                photos: usage.photoCount,
                videos: usage.videoCount,
                albums: usage.albumCount,
                storageUsedMB: Math.round(storageUsedMB * 100) / 100,
            },
            limits: {
                photos: limits.maxPhotos === -1 ? 'unlimited' : limits.maxPhotos,
                videos: limits.maxVideos === -1 ? 'unlimited' : limits.maxVideos,
                albums: limits.maxAlbums === -1 ? 'unlimited' : limits.maxAlbums,
                storageLimitMB: Math.round(storageLimitMB * 100) / 100,
                maxPhotoSizeMB: limits.maxPhotoSizeMB,
                maxVideoSizeMB: limits.maxVideoSizeMB,
            },
            percentages: {
                photos: limits.maxPhotos === -1 ? 0 : Math.round((usage.photoCount / limits.maxPhotos) * 100),
                videos: limits.maxVideos === -1 ? 0 : Math.round((usage.videoCount / limits.maxVideos) * 100),
                albums: limits.maxAlbums === -1 ? 0 : Math.round((usage.albumCount / limits.maxAlbums) * 100),
                storage: storageLimitBytes > 0
                    ? Math.round((Number(usage.storageUsedBytes) / Number(storageLimitBytes)) * 100)
                    : 0,
            },
        };
    }
}

export default new UsageService();
