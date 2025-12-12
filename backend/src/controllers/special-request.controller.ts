import { Request, Response, NextFunction } from 'express';
import specialRequestService from '../services/special-request.service';
import { createSpecialRequestSchema } from '../validators/special-request.validator';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';

class SpecialRequestController {
    async create(req: Request, res: Response, next: NextFunction) {
        const correlationId = (req as any).correlationId || `special-request-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        try {
            const validated = createSpecialRequestSchema.parse(req.body);

            const userId = req.user?.userId;
            const ipAddress = req.ip;
            const userAgent = req.get('user-agent');

            logger.info('Special request submission', {
                correlationId,
                userId,
                requestType: validated.requestType,
            });

            const request = await specialRequestService.createRequest(
                validated,
                userId,
                ipAddress,
                userAgent
            );

            res.status(201).json({
                success: true,
                data: {
                    request: {
                        id: request.id,
                        requestType: request.requestType,
                        status: request.status,
                        calculatedPrice: request.calculatedPrice,
                        createdAt: request.createdAt,
                    },
                },
            });
        } catch (error) {
            if (error instanceof Error && error.name === 'ZodError') {
                return next(new ValidationError('Invalid request data', error));
            }
            next(error);
        }
    }

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            const status = req.query.status as string | undefined;

            const requests = await specialRequestService.getRequests(userId, status);

            res.json({
                success: true,
                data: {
                    requests,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;

            const request = await specialRequestService.getRequest(id, userId);

            if (!request) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Special request not found',
                    },
                });
            }

            res.json({
                success: true,
                data: {
                    request,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new SpecialRequestController();

