import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../types/api.js';

/**
 * Validation schema types
 */
export interface ValidationRule {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
}

export interface ValidationSchema {
    [key: string]: ValidationRule;
}

/**
 * Validate request body against schema
 */
export function validateBody(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors = validateObject(req.body, schema);

        if (errors.length > 0) {
            res.status(400).json(
                errorResponse('Validation failed', errors.join(', '))
            );
            return;
        }

        next();
    };
}

/**
 * Validate query parameters against schema
 */
export function validateQuery(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors = validateObject(req.query, schema);

        if (errors.length > 0) {
            res.status(400).json(
                errorResponse('Query validation failed', errors.join(', '))
            );
            return;
        }

        next();
    };
}

/**
 * Validate route parameters against schema
 */
export function validateParams(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors = validateObject(req.params, schema);

        if (errors.length > 0) {
            res.status(400).json(
                errorResponse('Parameter validation failed', errors.join(', '))
            );
            return;
        }

        next();
    };
}

/**
 * Core validation function
 */
function validateObject(obj: any, schema: ValidationSchema): string[] {
    const errors: string[] = [];

    // Check required fields
    for (const [key, rule] of Object.entries(schema)) {
        if (rule.required && (obj[key] === undefined || obj[key] === null)) {
            errors.push(`${key} is required`);
            continue;
        }

        const value = obj[key];
        if (value === undefined || value === null) continue;

        // Type validation
        if (rule.type) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== rule.type) {
                errors.push(`${key} must be of type ${rule.type}`);
                continue;
            }
        }

        // String/Number validation
        if (rule.type === 'string' || rule.type === 'number') {
            if (rule.min !== undefined && value.length < rule.min) {
                errors.push(`${key} must be at least ${rule.min} characters`);
            }
            if (rule.max !== undefined && value.length > rule.max) {
                errors.push(`${key} must be at most ${rule.max} characters`);
            }
        }

        // Number specific validation
        if (rule.type === 'number') {
            if (rule.min !== undefined && value < rule.min) {
                errors.push(`${key} must be at least ${rule.min}`);
            }
            if (rule.max !== undefined && value > rule.max) {
                errors.push(`${key} must be at most ${rule.max}`);
            }
        }

        // Pattern validation
        if (rule.pattern && rule.type === 'string') {
            if (!rule.pattern.test(value)) {
                errors.push(`${key} format is invalid`);
            }
        }

        // Enum validation
        if (rule.enum && !rule.enum.includes(value)) {
            errors.push(`${key} must be one of: ${rule.enum.join(', ')}`);
        }
    }

    return errors;
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
    // Pagination parameters
    pagination: {
        limit: { type: 'number' as const, min: 1, max: 1000 },
        offset: { type: 'number' as const, min: 0 }
    },

    // Card ID parameter
    cardId: {
        id: { required: true, type: 'string' as const, min: 1 }
    },

    // Card quantity update
    quantityUpdate: {
        quantity: { required: true, type: 'number' as const, min: 0 }
    },

    // Search filters
    cardFilters: {
        search: { type: 'string' as const, max: 100 },
        type: { type: 'string' as const, max: 50 },
        race: { type: 'string' as const, max: 50 },
        attribute: { type: 'string' as const, max: 50 },
        archetype: { type: 'string' as const, max: 50 },
        level: { type: 'number' as const, min: 1, max: 12 },
        minAtk: { type: 'number' as const, min: 0 },
        maxAtk: { type: 'number' as const, min: 0 },
        minDef: { type: 'number' as const, min: 0 },
        maxDef: { type: 'number' as const, min: 0 }
    }
};