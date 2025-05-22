// src/application/services/OrderService.js
const { OrderValidator } = require('../../api/validators/OrderValidator');
const Order = require('../../domain/entities/Order');
const {
    ValidationError,
    InsufficientFundsError,
    MarketClosedError,
    NotFoundError,
    UnauthorizedError
} = require('../../shared/errors/BusinessErrors');
const { ORDER_TYPES, ORDER_STATUS } = require('../../shared/constants/orderTypes');
const logger = require('../../shared/utils/logger');

class OrderService {
    constructor(
        orderRepository,
        userRepository,
        configService,
        matchingService,
        eventBus
    ) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.configService = configService;
        this.matchingService = matchingService;
        this.eventBus = eventBus;
    }

    async createOrder(orderData, userId) {
        try {
            // Validate market is open
            await this._validateMarketIsOpen();

            // Validate input data
            const validatedData = OrderValidator.validateOrderCreation(orderData);

            // Get user
            const user = await this._getUserById(userId);

            // Validate order constraints
            await this._validateOrderConstraints(validatedData, user);

            // Create order entity
            const order = new Order({
                userId: user.id,
                type: validatedData.type,
                usdAmount: validatedData.usdAmount,
                exchangeRate: validatedData.exchangeRate,
                creationDate: new Date(),
                visibleInMarket: true
            });

            // Reserve funds for regular users
            if (!user.isTrader()) {
                user.reserveFunds(order.type, order.usdAmount, order.exchangeRate);
                await this.userRepository.update(user.id, user);
            }

            // Save order
            const savedOrder = await this.orderRepository.create(order);

            // Try to match with existing orders
            await this.matchingService.processOrderMatching(savedOrder);

            // Publish event
            await this.eventBus.publish('OrderCreated', { order: savedOrder, user });

            logger.info(`Order created: ${savedOrder.id} by user ${user.name}`);

            return savedOrder;
        } catch (error) {
            logger.error('Create order error:', error);
            throw error;
        }
    }

    async cancelOrder(orderId, userId) {
        try {
            // Validate market is open
            await this._validateMarketIsOpen();

            // Get order
            const order = await this.orderRepository.findById(orderId);
            if (!order) {
                throw new NotFoundError('Order');
            }

            // Get user
            const user = await this._getUserById(userId);

            // Validate ownership or admin rights
            if (order.userId !== userId && !user.isAdmin()) {
                throw new UnauthorizedError('You can only cancel your own orders');
            }

            // Validate order can be cancelled
            if (!order.isActive()) {
                throw new ValidationError('Only active orders can be cancelled');
            }

            // Release reserved funds for regular users
            if (!user.isTrader()) {
                user.releaseFunds(order.type, order.usdAmount, order.exchangeRate);
                await this.userRepository.update(user.id, user);
            }

            // Cancel order
            order.markAsCancelled();
            const cancelledOrder = await this.orderRepository.update(order.id, order);

            // Publish event
            await this.eventBus.publish('OrderCancelled', { order: cancelledOrder, user });

            logger.info(`Order cancelled: ${orderId} by user ${user.name}`);

            return cancelledOrder;
        } catch (error) {
            logger.error('Cancel order error:', error);
            throw error;
        }
    }

    async getUserOrders(userId) {
        const [buyOrders, sellOrders] = await Promise.all([
            this.orderRepository.findActiveOrdersByUser(userId).then(orders =>
                orders.filter(order => order.type === ORDER_TYPES.BUY)
            ),
            this.orderRepository.findActiveOrdersByUser(userId).then(orders =>
                orders.filter(order => order.type === ORDER_TYPES.SELL)
            )
        ]);

        return {
            buyOrders: buyOrders.map(order => this._mapOrderForResponse(order)),
            sellOrders: sellOrders.map(order => this._mapOrderForResponse(order))
        };
    }

    // Private methods
    async _validateMarketIsOpen() {
        const config = await this.configService.getCurrentConfig();
        if (config.marketStatus !== 'open') {
            throw new MarketClosedError();
        }
    }

    async _getUserById(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User');
        }
        return user;
    }

    async _validateOrderConstraints(orderData, user) {
        const config = await this.configService.getCurrentConfig();

        // Validate minimum amount
        if (orderData.usdAmount < config.minOperationAmount) {
            throw new ValidationError(
                `Minimum operation amount is ${config.minOperationAmount} USD`
            );
        }

        // Validate maximum orders for regular users
        if (!user.isTrader()) {
            const activeOrdersCount = await this.orderRepository.countActiveOrdersByUserAndType(
                user.id,
                orderData.type
            );

            if (activeOrdersCount >= 5) {
                throw new ValidationError(
                    `Maximum number of active ${orderData.type} orders (5) reached`
                );
            }

            // Validate sufficient funds
            if (!user.canAffordOrder(orderData.type, orderData.usdAmount, orderData.exchangeRate)) {
                throw new InsufficientFundsError();
            }
        }
    }

    _mapOrderForResponse(order) {
        return {
            id: order.id,
            type: order.type,
            usdAmount: order.usdAmount,
            exchangeRate: order.exchangeRate,
            status: order.status,
            creationDate: order.creationDate,
            penAmount: order.calculatePenAmount()
        };
    }
}

module.exports = OrderService;