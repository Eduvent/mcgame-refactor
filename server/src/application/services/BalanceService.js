// src/application/services/BalanceService.js
const logger = require('../../shared/utils/logger');

class BalanceService {
    constructor(userRepository, rankingService, eventBus) {
        this.userRepository = userRepository;
        this.rankingService = rankingService;
        this.eventBus = eventBus;
    }

    async processOperationBalances(operation) {
        try {
            // Get buyer and seller
            const [buyer, seller] = await Promise.all([
                this.userRepository.findById(operation.buyerId),
                this.userRepository.findById(operation.sellerId)
            ]);

            // Process buyer balance (receives USD)
            if (!buyer.isTrader()) {
                buyer.executeBuyOperation(operation.usdAmount);
                await this.userRepository.update(buyer.id, buyer);

                // Emit balance update event
                await this.eventBus.publish('BalanceUpdated', {
                    userId: buyer.id,
                    newBalance: {
                        usdBalance: buyer.usdBalance,
                        penBalance: buyer.penBalance
                    }
                });
            }

            // Process seller balance (receives PEN minus commission)
            if (!seller.isTrader()) {
                const penAmount = operation.usdAmount * operation.exchangeRate;
                seller.executeSellOperation(penAmount);
                await this.userRepository.update(seller.id, seller);

                // Emit balance update event
                await this.eventBus.publish('BalanceUpdated', {
                    userId: seller.id,
                    newBalance: {
                        usdBalance: seller.usdBalance,
                        penBalance: seller.penBalance
                    }
                });
            }

            // Update ranking after balance changes
            await this.rankingService.recalculateRanking();

            logger.info(`Balances processed for operation: ${operation.id}`);
        } catch (error) {
            logger.error('Balance processing error:', error);
            throw error;
        }
    }

    async getUserBalance(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User');
        }

        return {
            usdBalance: user.usdBalance,
            penBalance: user.penBalance,
            profitPercentage: user.profitPercentage
        };
    }
}

module.exports = BalanceService;