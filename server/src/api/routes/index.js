// src/api/routes/index.js
const express = require('express');
const createAuthRoutes = require('./authRoutes');
const createOrderRoutes = require('./orderRoutes');
const createMarketRoutes = require('./marketRoutes');

const createApiRoutes = (container) => {
    const router = express.Router();

    // Health check
    router.get('/health', (req, res) => {
        res.json({
            success: true,
            message: 'Trading Simulator API is running',
            timestamp: new Date().toISOString(),
            version: process.env.API_VERSION || '1.0.0'
        });
    });

    // API routes
    router.use('/auth', createAuthRoutes(container));
    router.use('/orders', createOrderRoutes(container));
    router.use('/market', createMarketRoutes(container));

    return router;
};

module.exports = createApiRoutes;