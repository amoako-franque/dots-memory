import { Request, Response, NextFunction } from 'express';
import contactService from '../services/contact.service';
import { createContactMessageSchema } from '../validators/contact.validator';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';

class ContactController {
    async create(req: Request, res: Response, next: NextFunction) {
        const correlationId = (req as any).correlationId || `contact-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        try {
            const validated = createContactMessageSchema.parse(req.body);

            const userId = req.user?.userId;
            const userEmail = req.user?.email || req.body.email;
            const ipAddress = req.ip;
            const userAgent = req.get('user-agent');

            logger.info('Contact message submission', {
                correlationId,
                userId,
                severity: validated.severity,
                hasTags: (validated.tags || []).length > 0,
            });

            const message = await contactService.createMessage(
                validated,
                userId,
                userEmail,
                ipAddress,
                userAgent
            );

            res.status(201).json({
                success: true,
                data: {
                    message: {
                        id: message.id,
                        title: message.title,
                        status: message.status,
                        createdAt: message.createdAt,
                    },
                },
            });
        } catch (error) {
            if (error instanceof Error && error.name === 'ZodError') {
                return next(new ValidationError('Invalid contact message data', 'VALIDATION_ERROR', error));
            }
            logger.error('Error creating contact message', {
                correlationId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            next(error);
        }
    }

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            const status = req.query.status as string;

            const messages = await contactService.getMessages(userId, status);

            res.json({
                success: true,
                data: { messages },
            });
        } catch (error) {
            next(error);
        }
    }

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;

            const message = await contactService.getMessageById(id, userId);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Message not found',
                        code: 'NOT_FOUND',
                    },
                });
            }

            res.json({
                success: true,
                data: { message },
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new ContactController();

