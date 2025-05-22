// src/api/routes/orderRoutes.js
const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { orderLimiter } = require('../middlewares/rateLimiter');

const createOrderRoutes = (container) => {
    const router = express.Router();
    const orderController = container.resolve('orderController');
    const authMiddleware = container.resolve('authMiddleware');

    // All routes require authentication
    router.use(authMiddleware.authenticateUser());

    // Order management
    router.post('/', orderLimiter, asyncHandler(orderController.createOrder));
    router.delete('/:orderId', asyncHandler(orderController.cancelOrder));
    router.get('/my-orders', asyncHandler(orderController.getUserOrders));
    router.get('/balance', asyncHandler(orderController.getUserBalance));

    return router;
};

module.exports = createOrderRoutes;