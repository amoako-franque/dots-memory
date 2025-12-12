import { Request, Response, NextFunction } from 'express';
import reactionService from '../services/reaction.service';
import { ValidationError } from '../utils/errors';

class ReactionController {
    async addReaction(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { emoji } = req.body;
            const deviceId = req.headers['x-device-id'] as string || req.user?.userId || 'anonymous';

            if (!emoji) {
                throw new ValidationError('Emoji is required');
            }

            const validEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];
            if (!validEmojis.includes(emoji)) {
                throw new ValidationError('Invalid emoji');
            }

            const reaction = await reactionService.addReaction(id, deviceId, emoji);

            res.status(201).json({
                success: true,
                data: { reaction },
            });
        } catch (error) {
            next(error);
        }
    }

    async removeReaction(req: Request, res: Response, next: NextFunction) {
        try {
            const { id, emoji } = req.params;
            const deviceId = req.headers['x-device-id'] as string || req.user?.userId || 'anonymous';

            await reactionService.removeReaction(id, deviceId, decodeURIComponent(emoji));

            res.json({
                success: true,
                data: { message: 'Reaction removed' },
            });
        } catch (error) {
            next(error);
        }
    }

    async getReactions(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const reactions = await reactionService.getReactions(id);

            res.json({
                success: true,
                data: reactions,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new ReactionController();
