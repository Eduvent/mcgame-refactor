// src/api/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');
const { TooManyRequestsError } = require('../../shared/errors/BusinessErrors');

// General rate limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        throw new TooManyRequestsError();
    }
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later'
    },
    skipSuccessfulRequests: true
});

// Order creation limiter
const orderLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 order requests per minute
    message: {
        success: false,
        message: 'Too many order requests, please slow down'
    }
});

module.exports = {
    generalLimiter,
    authLimiter,
    orderLimiter
};