import prisma from '../config/db';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/errors';

class ReactionService {
    async addReaction(mediaId: string, deviceId: string, emoji: string) {
        try {
            const media = await prisma.media.findUnique({
                where: { id: mediaId },
                select: { id: true, status: true },
            });

            if (!media || media.status === 'DELETED') {
                throw new NotFoundError('Media');
            }

            const reaction = await prisma.reaction.upsert({
                where: {
                    mediaId_deviceId_emoji: {
                        mediaId,
                        deviceId,
                        emoji,
                    },
                },
                create: {
                    mediaId,
                    deviceId,
                    emoji,
                },
                update: {},
            });

            await this.updateReactionCount(mediaId);

            return reaction;
        } catch (error) {
            logger.error('Failed to add reaction', { error, mediaId, deviceId, emoji });
            throw error;
        }
    }

    async removeReaction(mediaId: string, deviceId: string, emoji: string) {
        try {
            await prisma.reaction.delete({
                where: {
                    mediaId_deviceId_emoji: {
                        mediaId,
                        deviceId,
                        emoji,
                    },
                },
            });

            await this.updateReactionCount(mediaId);
        } catch (error) {
            logger.error('Failed to remove reaction', { error, mediaId, deviceId, emoji });
            throw error;
        }
    }

    async getReactions(mediaId: string) {
        const reactions = await prisma.reaction.findMany({
            where: { mediaId },
            select: {
                emoji: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const grouped = reactions.reduce((acc: Record<string, number>, r: { emoji: string }) => {
            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
            return acc;
        }, {});

        return {
            reactions: Object.entries(grouped).map(([emoji, count]) => ({
                emoji,
                count,
            })),
            total: reactions.length,
        };
    }

    private async updateReactionCount(mediaId: string) {
        const count = await prisma.reaction.count({
            where: { mediaId },
        });

        await prisma.media.update({
            where: { id: mediaId },
            data: { reactionCount: count },
        });
    }
}

export default new ReactionService();
