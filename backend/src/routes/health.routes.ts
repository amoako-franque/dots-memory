import { Router, Request, Response } from 'express';
import prisma from '../config/db';
import logger from '../utils/logger';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'dots-memory-backend',
        uptime: process.uptime(),
    });
});

router.get('/health/detailed', async (req: Request, res: Response) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'dots-memory-backend',
        uptime: process.uptime(),
        checks: {
            database: 'unknown',
            memory: 'unknown',
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    };

    try {
        await prisma.$queryRaw`SELECT 1`;
        health.checks.database = 'healthy';
    } catch (error) {
        health.status = 'degraded';
        health.checks.database = 'unhealthy';
        logger.error('Database health check failed', { error });
    }

    const memUsage = process.memoryUsage();
    const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
    };

    health.checks.memory = memUsageMB.heapUsed < 500 ? 'healthy' : 'warning';

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
});

router.get('/ready', async (req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ ready: true });
    } catch (error) {
        res.status(503).json({ ready: false });
    }
});

router.get('/live', (req: Request, res: Response) => {
    res.status(200).json({ alive: true });
});

export default router;
