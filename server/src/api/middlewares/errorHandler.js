// src/api/middlewares/errorHandler.js
const logger = require('../../shared/utils/logger');
const { BaseError } = require('../../shared/errors/BaseError');

const errorHandler = (error, req, res, next) => {
    // Log error with request context
    logger.error({
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            statusCode: error.statusCode
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            body: req.body
        },
        user: req.user ? {
            id: req.user.id,
            name: req.user.name,
            role: req.user.role
        } : null
    });

    // Handle known business errors
    if (error instanceof BaseError && error.isOperational) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: messages
        });
    }

    // Handle Mongoose duplicate key errors
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const value = error.keyValue[field];
        return res.status(409).json({
            success: false,
            message: `Duplicate value for ${field}: ${value}`
        });
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // Handle Mongoose cast errors
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    // Unhandled errors
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            name: error.name
        })
    });
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
