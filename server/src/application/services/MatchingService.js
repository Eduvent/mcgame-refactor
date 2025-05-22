// src/application/services/MatchingService.js
const Operation = require('../../domain/entities/Operation');
const { ORDER_TYPES } = require('../../shared/constants/orderTypes');
const logger = require('../../shared/utils/logger');

class MatchingService {
    constructor(
        orderRepository,
        operationRepository,
        userRepository,
        balanceService,
        eventBus
    ) {
        this.orderRepository = orderRepository;
        this.operationRepository = operationRepository;
        this.userRepository = userRepository;
        this.balanceService = balanceService;
        this.eventBus = eventBus;
    }

    async processOrderMatching(newOrder) {
        try {
            // Find matching orders
            const matchingOrders = await this.orderRepository.findMatchingOrders(newOrder);

            let remainingAmount = newOrder.usdAmount;
            const executedOperations = [];

            for (const matchOrder of matchingOrders) {
                if (remainingAmount <= 0) break;

                // Determine match amount
                const matchAmount = Math.min(remainingAmount, matchOrder.usdAmount);

                // Determine operation exchange rate
                const operationRate = this._determineOperationRate(newOrder, matchOrder);

                // Execute the operation
                const operation = await this._executeOperation(newOrder, matchOrder, matchAmount, operationRate);
                executedOperations.push(operation);

                // Update remaining amount
                remainingAmount -= matchAmount;

                // Update matched order
                matchOrder.partialMatch(matchAmount);
                await this.orderRepository.update(matchOrder.id, matchOrder);
            }

            // Update original order if partially or fully matched
            if (remainingAmount < newOrder.usdAmount) {
                if (remainingAmount <= 0) {
                    newOrder.markAsCompleted();
                } else {
                    newOrder.usdAmount = remainingAmount;
                }
                await this.orderRepository.update(newOrder.id, newOrder);
            }

            // Process all executed operations
            for (const operation of executedOperations) {
                await this._processOperationEffects(operation);
            }

            return executedOperations;
        } catch (error) {
            logger.error('Order matching error:', error);
            throw error;
        }
    }

    async _executeOperation(buyOrder, sellOrder, matchAmount, exchangeRate) {
        // Determine buyer and seller orders
        const [actualBuyOrder, actualSellOrder] = buyOrder.type === ORDER_TYPES.BUY
            ? [buyOrder, sellOrder]
            : [sellOrder, buyOrder];

        // Get buyer and seller
        const [buyer, seller] = await Promise.all([
            this.userRepository.findById(actualBuyOrder.userId),
            this.userRepository.findById(actualSellOrder.userId)
        ]);

        // Calculate commissions
        const penAmount = matchAmount * exchangeRate;
        const buyerCommission = buyer.calculateCommission(penAmount);
        const sellerCommission = seller.calculateCommission(penAmount);

        // Create operation
        const operation = new Operation({
            buyOrderId: actualBuyOrder.id,
            sellOrderId: actualSellOrder.id,
            buyerId: buyer.id,
            sellerId: seller.id,
            usdAmount: matchAmount,
            exchangeRate: exchangeRate,
            date: new Date(),
            buyerCommission: buyerCommission,
            sellerCommission: sellerCommission
        });

        // Save operation
        const savedOperation = await this.operationRepository.create(operation);

        logger.info(`Operation executed: ${savedOperation.id} - ${matchAmount} USD at ${exchangeRate}`);

        return savedOperation;
    }

    async _processOperationEffects(operation) {
        // Update user balances
        await this.balanceService.processOperationBalances(operation);

        // Publish operation executed event
        await this.eventBus.publish('OperationExecuted', operation);
    }

    _determineOperationRate(newOrder, matchOrder) {
        // The operation rate is typically the maker's (existing order) rate
        return matchOrder.exchangeRate;
    }
}

module.exports = MatchingService;