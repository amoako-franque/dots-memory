import prisma from '../config/db';
import logger from '../utils/logger';
import { generateViewerHash, getStartOfDay } from '../utils/viewerHash';

type AnalyticsEventType = 'ALBUM_VIEW' | 'ALBUM_SCAN' | 'MEDIA_UPLOAD' | 'MEDIA_VIEW' | 'MEDIA_DOWNLOAD' | 'BULK_DOWNLOAD';

interface TrackEventParams {
    albumId: string;
    eventType: AnalyticsEventType;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    country?: string;
    city?: string;
    metadata?: any;
}

interface AlbumStats {
    totalViews: number;
    totalScans: number;
    totalUploads: number;
    totalDownloads: number;
    uniqueDevices: number;
    viewsByDay: Array<{ date: string; count: number }>;
    topCountries: Array<{ country: string; count: number }>;
}

interface AnalyticsEvent {
    eventType: AnalyticsEventType;
    deviceId: string | null;
    country: string | null;
    timestamp: Date;
}

class AnalyticsService {
    async trackEvent(params: TrackEventParams): Promise<void> {
        try {
            await prisma.albumAnalytics.create({
                data: {
                    albumId: params.albumId,
                    eventType: params.eventType,
                    deviceId: params.deviceId,
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                    country: params.country,
                    city: params.city,
                    metadata: params.metadata,
                },
            });

            logger.debug('Analytics event tracked', {
                albumId: params.albumId,
                eventType: params.eventType,
            });
        } catch (error) {
            logger.error('Failed to track analytics event', { error, params });
        }
    }

    async getAlbumStats(albumId: string, days: number = 30): Promise<AlbumStats> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const events = await prisma.albumAnalytics.findMany({
            where: {
                albumId,
                timestamp: {
                    gte: startDate,
                },
            },
            select: {
                eventType: true,
                deviceId: true,
                country: true,
                timestamp: true,
            },
        });

        const totalViews = events.filter((e: AnalyticsEvent) => e.eventType === 'ALBUM_VIEW').length;
        const totalScans = events.filter((e: AnalyticsEvent) => e.eventType === 'ALBUM_SCAN').length;
        const totalUploads = events.filter((e: AnalyticsEvent) => e.eventType === 'MEDIA_UPLOAD').length;
        const totalDownloads = events.filter((e: AnalyticsEvent) =>
            e.eventType === 'MEDIA_DOWNLOAD' || e.eventType === 'BULK_DOWNLOAD'
        ).length;

        const uniqueDevices = new Set(
            events.filter((e: AnalyticsEvent) => e.deviceId).map((e: AnalyticsEvent) => e.deviceId)
        ).size;

        const viewsByDayMap = new Map<string, number>();
        events
            .filter((e: AnalyticsEvent) => e.eventType === 'ALBUM_VIEW')
            .forEach((e: AnalyticsEvent) => {
                const date = e.timestamp.toISOString().split('T')[0];
                viewsByDayMap.set(date, (viewsByDayMap.get(date) || 0) + 1);
            });

        const viewsByDay = Array.from(viewsByDayMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const countryMap = new Map<string, number>();
        events
            .filter((e: AnalyticsEvent) => e.country)
            .forEach((e: AnalyticsEvent) => {
                countryMap.set(e.country!, (countryMap.get(e.country!) || 0) + 1);
            });

        const topCountries = Array.from(countryMap.entries())
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            totalViews,
            totalScans,
            totalUploads,
            totalDownloads,
            uniqueDevices,
            viewsByDay,
            topCountries,
        };
    }

    async getRecentActivity(albumId: string, limit: number = 50) {
        return await prisma.albumAnalytics.findMany({
            where: { albumId },
            orderBy: { timestamp: 'desc' },
            take: limit,
            select: {
                id: true,
                eventType: true,
                country: true,
                city: true,
                timestamp: true,
                metadata: true,
            },
        });
    }

    /**
     * Track album view with deduplication
     * Only counts one view per unique viewer per album per day
     */
    async trackAlbumView(params: {
        albumId: string;
        ipAddress?: string;
        userAgent?: string;
        deviceId?: string;
        sessionId?: string;
    }): Promise<boolean> {
        try {
            const viewerHash = generateViewerHash(
                params.ipAddress,
                params.userAgent,
                params.sessionId
            );

            const viewedDate = getStartOfDay();

            try {
                await prisma.albumViewLog.create({
                    data: {
                        albumId: params.albumId,
                        viewerHash,
                        ipAddress: params.ipAddress || null,
                        userAgent: params.userAgent || null,
                        deviceId: params.deviceId || null,
                        sessionId: params.sessionId || null,
                        viewedDate,
                    },
                });

                await prisma.album.update({
                    where: { id: params.albumId },
                    data: {
                        viewCount: {
                            increment: 1,
                        },
                    },
                });

                logger.debug('Album view tracked', {
                    albumId: params.albumId,
                    viewerHash: viewerHash.substring(0, 8) + '...',
                });

                return true; // View was counted
            } catch (insertError: any) {
                const errorCode = insertError.code || insertError.meta?.code || insertError.meta?.target
                const errorMessage = insertError.message || ''

                if (
                    errorCode === 'P2002' ||
                    errorMessage.includes('Unique constraint failed') ||
                    errorMessage.includes('Unique constraint')
                ) {
                    return false; // View was not counted (duplicate)
                }

                if (errorCode === 'P2021' || errorMessage.includes('does not exist')) {
                    logger.warn('Album view log table does not exist. Run migrations to enable view tracking.', {
                        albumId: params.albumId,
                        table: insertError.meta?.table,
                    });
                    return false; // View was not counted (table missing)
                }

                logger.error('Unexpected error tracking album view', {
                    albumId: params.albumId,
                    errorCode,
                    errorMessage,
                });
                throw insertError; // Re-throw other errors
            }
        } catch (error) {
            logger.error('Failed to track album view', { error, params });
            return false;
        }
    }

    /**
     * Legacy method - kept for backward compatibility
     * Use trackAlbumView instead for proper deduplication
     */
    async incrementAlbumViews(albumId: string): Promise<void> {
        try {
            await prisma.album.update({
                where: { id: albumId },
                data: {
                    viewCount: {
                        increment: 1,
                    },
                },
            });
        } catch (error) {
            logger.error('Failed to increment album views', { error, albumId });
        }
    }

    async incrementAlbumDownloads(albumId: string): Promise<void> {
        try {
            await prisma.album.update({
                where: { id: albumId },
                data: {
                    downloadCount: {
                        increment: 1,
                    },
                },
            });
        } catch (error) {
            logger.error('Failed to increment album downloads', { error, albumId });
        }
    }

    async incrementMediaViews(mediaId: string): Promise<void> {
        try {
            await prisma.media.update({
                where: { id: mediaId },
                data: {
                    viewCount: {
                        increment: 1,
                    },
                },
            });
        } catch (error) {
            logger.error('Failed to increment media views', { error, mediaId });
        }
    }

    async incrementMediaDownloads(mediaId: string): Promise<void> {
        try {
            await prisma.media.update({
                where: { id: mediaId },
                data: {
                    downloadCount: {
                        increment: 1,
                    },
                },
            });
        } catch (error) {
            logger.error('Failed to increment media downloads', { error, mediaId });
        }
    }

    async updateUniqueContributors(albumId: string): Promise<void> {
        try {
            const uniqueCount = await prisma.media.findMany({
                where: { albumId },
                distinct: ['contributorDeviceId'],
                select: { contributorDeviceId: true },
            });

            await prisma.album.update({
                where: { id: albumId },
                data: {
                    uniqueContributors: uniqueCount.filter((c: { contributorDeviceId: string | null }) => c.contributorDeviceId).length,
                },
            });
        } catch (error) {
            logger.error('Failed to update unique contributors', { error, albumId });
        }
    }
}

export default new AnalyticsService();

