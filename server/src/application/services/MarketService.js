// src/application/services/MarketService.js - Service del mercado
const logger = require('../../shared/utils/logger');
const { ORDER_TYPES } = require('../../shared/constants/orderTypes');

class MarketService {
    constructor(orderRepository, operationRepository, configService) {
        this.orderRepository = orderRepository;
        this.operationRepository = operationRepository;
        this.configService = configService;
    }

    async getOrderBook() {
        try {
            const config = await this.configService.getCurrentConfig();

            // Get orders for market display
            const { buyOrders, sellOrders } = await this.orderRepository.findOrdersForMarket();

            // Get last operation
            const lastOperations = await this.operationRepository.findLatest(1);
            const lastOperation = lastOperations.length > 0 ? lastOperations[0] : null;

            // Calculate best rates
            const bestBuyRate = buyOrders.length > 0
                ? buyOrders[0].exchangeRate
                : config.referenceBuyRate;

            const bestSellRate = sellOrders.length > 0
                ? sellOrders[0].exchangeRate
                : config.referenceSellRate;

            return {
                marketStatus: config.marketStatus,
                bestBuyRate,
                bestSellRate,
                buyOrders: buyOrders.map(order => ({
                    id: order.id,
                    userId: order.userId,
                    amount: order.usdAmount,
                    rate: order.exchangeRate,
                    createdAt: order.creationDate,
                    isTrader: false // This would come from user info
                })),
                sellOrders: sellOrders.map(order => ({
                    id: order.id,
                    userId: order.userId,
                    amount: order.usdAmount,
                    rate: order.exchangeRate,
                    createdAt: order.creationDate,
                    isTrader: false // This would come from user info
                })),
                lastOperation: lastOperation ? {
                    amount: lastOperation.usdAmount,
                    rate: lastOperation.exchangeRate,
                    date: lastOperation.date
                } : null
            };
        } catch (error) {
            logger.error('Error getting order book:', error);
            throw error;
        }
    }

    async getSystemMetrics() {
        try {
            // Get basic metrics
            const operations = await this.operationRepository.findAll();
            const totalVolume = operations.reduce((sum, op) => sum + op.usdAmount, 0);

            const avgPrice = operations.length > 0
                ? operations.reduce((sum, op) => sum + op.exchangeRate, 0) / operations.length
                : 0;

            return {
                totalOperations: operations.length,
                totalVolume: totalVolume.toFixed(2),
                averagePrice: avgPrice.toFixed(3),
                lastUpdate: new Date()
            };
        } catch (error) {
            logger.error('Error getting system metrics:', error);
            throw error;
        }
    }
}

module.exports = MarketService;