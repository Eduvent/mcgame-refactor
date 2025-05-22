// src/api/routes/authRoutes.js
const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { authLimiter } = require('../middlewares/rateLimiter');

const createAuthRoutes = (container) => {
    const router = express.Router();
    const authController = container.resolve('authController');
    const authMiddleware = container.resolve('authMiddleware');

    // Public routes with rate limiting
    router.post('/register', authLimiter, asyncHandler(authController.register));
    router.post('/login', authLimiter, asyncHandler(authController.login));

    // Protected routes
    router.get('/profile',
        authMiddleware.authenticateUser(),
        asyncHandler(authController.getProfile)
    );

    return router;
};

module.exports = createAuthRoutes;