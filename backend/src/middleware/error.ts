import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, ConflictError, NotFoundError, AuthenticationError } from '../utils/errors';
import { logError } from '../utils/logger';
import logger from '../utils/logger';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const correlationId = req.correlationId || `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const errorContext = {
        correlationId,
        method: req.method,
        url: req.url,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: (req as any).user?.userId || (req as any).user?.id,
        body: req.body,
        query: req.query,
        params: req.params,
        timestamp: new Date().toISOString(),
    };

    if (err instanceof AppError) {
        const logContext = {
            ...errorContext,
            statusCode: err.statusCode,
            errorCode: err.code,
            isOperational: err.isOperational,
            ...err.context,
        };

        if (err.isOperational) {
            logger.warn('Operational error', {
                errorName: err.name,
                errorMessage: err.message,
                ...logContext,
                stack: err.stack,
            });
        } else {
            logger.error('Non-operational error', {
                errorName: err.name,
                errorMessage: err.message,
                ...logContext,
                stack: err.stack,
            });
        }
    } else {
        logger.error('Unhandled error', {
            errorName: err.name,
            errorMessage: err.message,
            stack: err.stack,
            ...errorContext,
        });
    }

    if (err instanceof AppError) {
        const response: any = {
            success: false,
            error: {
                message: err.message,
                code: err.code || 'UNKNOWN_ERROR',
                correlationId,
            },
        };

        if ((process.env.NODE_ENV !== 'production' || err.statusCode >= 500) && err.context) {
            response.error.context = err.context;
        }

        if (err instanceof ValidationError && err.context?.details) {
            response.error.details = err.context.details;
        }

        return res.status(err.statusCode).json(response);
    }

    if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as any;

        if (prismaError.code === 'P2002') {
            const target = prismaError.meta?.target;
            const field = Array.isArray(target) ? target.join(', ') : 'field';

            logger.warn('Prisma duplicate entry', {
                ...errorContext,
                prismaCode: prismaError.code,
                target,
            });

            return res.status(409).json({
                success: false,
                error: {
                    message: `A record with this ${field} already exists`,
                    code: 'DUPLICATE_ENTRY',
                    correlationId,
                    ...(process.env.NODE_ENV !== 'production' && { field }),
                },
            });
        }

        if (prismaError.code === 'P2025') {
            logger.warn('Prisma record not found', {
                ...errorContext,
                prismaCode: prismaError.code,
            });

            return res.status(404).json({
                success: false,
                error: {
                    message: 'Record not found',
                    code: 'NOT_FOUND',
                    correlationId,
                },
            });
        }

        logger.error('Unhandled Prisma error', {
            ...errorContext,
            prismaCode: prismaError.code,
            prismaMeta: prismaError.meta,
            stack: err.stack,
        });
    }

    if (err.name === 'ZodError') {
        const zodError = err as any;

        logger.warn('Validation error', {
            ...errorContext,
            validationErrors: zodError.errors,
        });

        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: zodError.errors.map((e: any) => ({
                    path: e.path.join('.'),
                    message: e.message,
                    code: e.code,
                    received: e.received,
                    expected: e.expected,
                })),
                correlationId,
            },
        });
    }

    if (err.name === 'JsonWebTokenError') {
        logger.warn('Invalid JWT token', {
            ...errorContext,
        });

        return res.status(401).json({
            success: false,
            error: {
                message: 'Invalid token',
                code: 'INVALID_TOKEN',
                correlationId,
            },
        });
    }

    if (err.name === 'TokenExpiredError') {
        logger.warn('Token expired', {
            ...errorContext,
        });

        return res.status(401).json({
            success: false,
            error: {
                message: 'Token expired',
                code: 'TOKEN_EXPIRED',
                correlationId,
            },
        });
    }

    logger.error('Unhandled error', {
        ...errorContext,
        errorName: err.name,
        errorMessage: err.message,
        stack: err.stack,
    });

    res.status(500).json({
        success: false,
        error: {
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred. Please contact support with the correlation ID.'
                : err.message,
            code: 'INTERNAL_ERROR',
            correlationId,
            ...(process.env.NODE_ENV !== 'production' && {
                errorName: err.name,
                stack: err.stack,
            }),
        },
    });
};
