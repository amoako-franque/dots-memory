import prisma from '../config/db';
import logger from './logger';

const subscriptionPlans = [
    {
        tier: 'FREE',
        name: 'Free Tier',
        description: '14-day trial with basic features. Perfect for trying out the platform.',
        priceMonthly: 0,
        maxPhotos: 4,
        maxVideos: 0,
        maxAlbums: 1,
        maxPhotoSizeMB: 5,
        maxVideoSizeMB: 0,
        maxVideoLengthSec: 0,
        totalStorageGB: 0, // 20MB = 0.02GB, rounded to 0
        allowVideos: false,
    },
    {
        tier: 'BASIC',
        name: 'Basic Plan',
        description: 'Great for personal use with moderate photo and video sharing needs.',
        priceMonthly: 4.99,
        maxPhotos: 50,
        maxVideos: 10,
        maxAlbums: 5,
        maxPhotoSizeMB: 25,
        maxVideoSizeMB: 50,
        maxVideoLengthSec: 60,
        totalStorageGB: 2,
        allowVideos: true,
    },
    {
        tier: 'PRO',
        name: 'Pro Plan',
        description: 'Perfect for professionals and power users who need more storage and flexibility.',
        priceMonthly: 9.99,
        maxPhotos: 200,
        maxVideos: 50,
        maxAlbums: 20,
        maxPhotoSizeMB: 100,
        maxVideoSizeMB: 200,
        maxVideoLengthSec: 300,
        totalStorageGB: 10,
        allowVideos: true,
    },
];

export async function seedSubscriptionPlans() {
    try {
        logger.info('Seeding subscription plans...');

        let createdCount = 0;
        let skippedCount = 0;

        for (const planData of subscriptionPlans) {
            const existingPlan = await prisma.subscriptionPlan.findUnique({
                where: { tier: planData.tier as any },
            });

            if (existingPlan) {
                logger.debug(`Skipping existing subscription plan: ${planData.tier}`);
                skippedCount++;
            } else {
                await prisma.subscriptionPlan.create({
                    data: planData as any,
                });
                logger.info(`Created subscription plan: ${planData.tier}`);
                createdCount++;
            }
        }

        if (createdCount > 0) {
            logger.info(`Subscription plans seeded successfully: ${createdCount} created, ${skippedCount} skipped`);
        } else {
            logger.info(`All subscription plans already exist: ${skippedCount} skipped`);
        }

        return { created: createdCount, skipped: skippedCount };
    } catch (error) {
        logger.error('Failed to seed subscription plans', { error });
        throw error;
    }
}

if (require.main === module) {
    seedSubscriptionPlans()
        .then(() => {
            logger.info('Seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Seeding failed', { error });
            process.exit(1);
        });
}

