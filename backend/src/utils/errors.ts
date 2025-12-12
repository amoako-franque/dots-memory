/* TODO: Note: logError is now exported from logger.ts to avoid circular dependency */

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code?: string;
    public readonly context?: Record<string, any>;

    constructor(
        message: string,
        statusCode: number = 500,
        code?: string,
        isOperational: boolean = true,
        context?: Record<string, any>
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        this.context = context;

        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
    }
}

export class ValidationError extends AppError {
    constructor(message: string, code: string = 'VALIDATION_ERROR', details?: any) {
        super(message, 400, code, true, { details });
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication failed', code: string = 'AUTH_FAILED') {
        super(message, 401, code);
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'Access denied', code: string = 'ACCESS_DENIED', resource?: string) {
        super(message, 403, code, true, { resource });
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource', code: string = 'NOT_FOUND', resourceId?: string) {
        super(`${resource} not found`, 404, code, true, { resource, resourceId });
    }
}

export class ConflictError extends AppError {
    constructor(message: string, code: string = 'CONFLICT', conflictingField?: string) {
        super(message, 409, code, true, { conflictingField });
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = 'Too many requests', code: string = 'RATE_LIMIT_EXCEEDED', retryAfter?: number) {
        super(message, 429, code, true, { retryAfter });
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = 'Internal server error', code: string = 'INTERNAL_ERROR', originalError?: Error) {
        super(message, 500, code, false, {
            originalError: originalError?.message,
            originalStack: originalError?.stack,
        });
    }
}

export class QuotaExceededError extends AppError {
    constructor(
        message: string,
        resourceType: 'ALBUM' | 'PHOTO' | 'VIDEO' | 'STORAGE',
        current: number,
        limit: number,
        code: string = 'QUOTA_EXCEEDED'
    ) {
        super(message, 403, code, true, {
            resourceType,
            current,
            limit,
        });
    }
}

export class ResourceLimitError extends AppError {
    constructor(
        message: string,
        resourceType: string,
        limit: number,
        code: string = 'RESOURCE_LIMIT_REACHED'
    ) {
        super(message, 403, code, true, {
            resourceType,
            limit,
        });
    }
}

export class FileSizeError extends AppError {
    constructor(
        message: string,
        fileSize: number,
        maxSize: number,
        code: string = 'FILE_SIZE_EXCEEDED'
    ) {
        super(message, 413, code, true, {
            fileSize,
            maxSize,
        });
    }
}

export class ServiceUnavailableError extends AppError {
    constructor(message: string = 'Service temporarily unavailable', code: string = 'SERVICE_UNAVAILABLE', retryAfter?: number) {
        super(message, 503, code, true, { retryAfter });
    }
}

export class BadRequestError extends AppError {
    constructor(message: string, code: string = 'BAD_REQUEST', details?: any) {
        super(message, 400, code, true, { details });
    }
}

