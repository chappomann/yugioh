// Standard API response interface
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp?: string;
}

// Error handler middleware type
export interface ApiError extends Error {
    statusCode?: number;
}

// Helper function to create consistent API responses
export function createApiResponse<T>(
    success: boolean,
    data?: T,
    error?: string,
    message?: string
): ApiResponse<T> {
    return {
        success,
        data,
        error,
        message,
        timestamp: new Date().toISOString()
    };
}

// Helper function for success responses
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
    return createApiResponse(true, data, undefined, message);
}

// Helper function for error responses
export function errorResponse(error: string, message?: string): ApiResponse {
    return createApiResponse(false, undefined, error, message);
}