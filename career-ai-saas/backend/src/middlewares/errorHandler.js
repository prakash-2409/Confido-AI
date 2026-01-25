/**
 * Global Error Handler Middleware
 * 
 * Provides centralized error handling with:
 * - Standardized error response format
 * - Environment-specific error details
 * - HTTP status code mapping
 * - Error logging
 */

const config = require('../config/env');

/**
 * Custom API Error class
 */
class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Global error handler middleware
 * Must be registered AFTER all routes
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let details = err.details || null;

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        details = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message,
        }));
    }

    // Handle Mongoose duplicate key errors
    if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate Entry';
        const field = Object.keys(err.keyPattern)[0];
        details = { field, message: `${field} already exists` };
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Log error for debugging
    console.error('🚨 Error:', {
        statusCode,
        message,
        path: req.path,
        method: req.method,
        ...(config.env === 'development' && { stack: err.stack }),
    });

    // Prepare response
    const response = {
        success: false,
        error: {
            message,
            statusCode,
            ...(details && { details }),
            ...(config.env === 'development' && {
                stack: err.stack,
                path: req.path,
                method: req.method,
            }),
        },
    };

    res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 * Must be registered BEFORE error handler
 */
const notFoundHandler = (req, res, next) => {
    const error = new ApiError(
        404,
        `Route not found: ${req.method} ${req.path}`
    );
    next(error);
};

module.exports = {
    errorHandler,
    notFoundHandler,
    ApiError,
};
