// src/api/controllers/OrderController.js
class OrderController {
    constructor(orderService, balanceService) {
        this.orderService = orderService;
        this.balanceService = balanceService;

        // Bind methods
        this.createOrder = this.createOrder.bind(this);
        this.cancelOrder = this.cancelOrder.bind(this);
        this.getUserOrders = this.getUserOrders.bind(this);
        this.getUserBalance = this.getUserBalance.bind(this);
    }

    async createOrder(req, res, next) {
        try {
            const order = await this.orderService.createOrder(req.body, req.user.id);

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                data: { order }
            });
        } catch (error) {
            next(error);
        }
    }

    async cancelOrder(req, res, next) {
        try {
            const { orderId } = req.params;
            const order = await this.orderService.cancelOrder(orderId, req.user.id);

            res.status(200).json({
                success: true,
                message: 'Order cancelled successfully',
                data: { order }
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserOrders(req, res, next) {
        try {
            const orders = await this.orderService.getUserOrders(req.user.id);

            res.status(200).json({
                success: true,
                message: 'User orders retrieved successfully',
                data: orders
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserBalance(req, res, next) {
        try {
            const balance = await this.balanceService.getUserBalance(req.user.id);

            res.status(200).json({
                success: true,
                message: 'User balance retrieved successfully',
                data: balance
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = OrderController;