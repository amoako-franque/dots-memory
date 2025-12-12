import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: {
            message: 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        return `${req.ip}-${req.get('user-agent')}`;
    },
});

export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: {
        success: false,
        error: {
            message: 'Too many authentication attempts, please try again later',
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed attempts
    keyGenerator: (req) => {
        return `${req.ip}-${req.get('user-agent')}`;
    },
});

export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        error: {
            message: 'Too many password reset requests, please try again later',
            code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `${req.ip}`;
    },
});

export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        error: {
            message: 'Too many uploads, please try again later',
            code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const deviceId = req.headers['x-device-id'] as string;
        return deviceId || req.ip || 'unknown';
    },
});

export const accessCodeVerificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes
    message: {
        success: false,
        error: {
            message: 'Too many access code verification attempts, please try again later',
            code: 'ACCESS_CODE_RATE_LIMIT_EXCEEDED',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed attempts
    keyGenerator: (req) => {
        const identifier = req.params?.identifier || req.body?.identifier || 'unknown';
        const deviceId = req.headers['x-device-id'] as string;
        return `${req.ip}-${identifier}-${deviceId || 'unknown'}`;
    },
});

export const albumViewLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute per IP/album combination
    message: {
        success: false,
        error: {
            message: 'Too many requests. Please wait a moment.',
            code: 'VIEW_RATE_LIMIT_EXCEEDED',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        const albumId = req.params?.id || req.params?.albumId || 'unknown';
        return `${req.ip}-${albumId}`;
    },
});

