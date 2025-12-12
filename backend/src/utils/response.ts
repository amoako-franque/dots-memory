import { Response } from 'express';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200) => {
    const response: ApiResponse<T> = {
        success: true,
        data,
    };
    return res.status(statusCode).json(response);
};

export const sendError = (
    res: Response,
    code: string,
    message: string,
    statusCode = 400,
    details?: any
) => {
    const response: ApiResponse<null> = {
        success: false,
        error: {
            code,
            message,
            details,
        },
    };
    return res.status(statusCode).json(response);
};
