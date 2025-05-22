// src/api/routes/marketRoutes.js
const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');

const createMarketRoutes = (container) => {
    const router = express.Router();
    const marketController = container.resolve('marketController');
    const authMiddleware = container.resolve('authMiddleware');

    // All routes require authentication
    router.use(authMiddleware.authenticateUser());

    // Public market data
    router.get('/', asyncHandler(marketController.getMarketStatus));
    router.get('/ranking', asyncHandler(marketController.getRanking));

    // Admin only routes
    router.post('/status',
        authMiddleware.requireAdmin(),
        asyncHandler(marketController.changeMarketStatus)
    );

    router.post('/ranking/recalculate',
        authMiddleware.requireAdmin(),
        asyncHandler(marketController.recalculateRanking)
    );

    router.post('/ranking/reset',
        authMiddleware.requireAdmin(),
        asyncHandler(marketController.resetRanking)
    );

    return router;
};

module.exports = createMarketRoutes;