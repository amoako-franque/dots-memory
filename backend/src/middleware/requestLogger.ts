import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logRequest, logResponse } from '../utils/logger';

declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
            startTime?: number;
        }
    }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    req.correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    req.startTime = Date.now();

    res.setHeader('X-Correlation-ID', req.correlationId);

    logRequest(req);

    res.on('finish', () => {
        logResponse(req, res);
    });

    next();
};
