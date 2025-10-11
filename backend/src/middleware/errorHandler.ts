import { Request, Response, NextFunction } from 'express';
import { errorResponse, ApiError } from '../types/api.js';

/**
 * Global error handling middleware
 * Catches all unhandled errors and formats them consistently
 */
export function errorHandler(
    error: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error('Unhandled error:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    res.status(statusCode).json(
        errorResponse(message, 'An unexpected error occurred')
    );
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json(
        errorResponse(`Route ${req.method} ${req.path} not found`, 'The requested resource was not found')
    );
}

/**
 * Async error wrapper to catch async route handler errors
 */
export function asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}