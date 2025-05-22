// src/application/services/RankingService.js
const logger = require('../../shared/utils/logger');
const { ROLES } = require('../../shared/constants/roles');

class RankingService {
    constructor(userRepository, configService, eventBus) {
        this.userRepository = userRepository;
        this.configService = configService;
        this.eventBus = eventBus;
    }

    async recalculateRanking() {
        try {
            // Get current configuration for reference rates
            const config = await this.configService.getCurrentConfig();

            // Get current market rate (best buy/sell average or reference)
            const currentRate = config.referenceBuyRate; // Simplified for now

            // Get all regular users
            const users = await this.userRepository.findByRole(ROLES.USER);

            // Calculate profit for each user
            const usersWithProfit = users.map(user => {
                const currentValue = this._calculatePortfolioValue(
                    user.usdBalance,
                    user.penBalance,
                    currentRate
                );

                const initialValue = this._calculatePortfolioValue(
                    user.initialUsd,
                    user.initialPen,
                    config.referenceBuyRate
                );

                const profitPercentage = this._calculateProfitPercentage(initialValue, currentValue);

                return {
                    userId: user.id,
                    user: user,
                    profitPercentage: profitPercentage
                };
            });

            // Sort by profit percentage (descending)
            usersWithProfit.sort((a, b) => b.profitPercentage - a.profitPercentage);

            // Assign ranking positions and update users
            const rankingData = usersWithProfit.map((item, index) => ({
                userId: item.userId,
                profitPercentage: item.profitPercentage,
                position: index + 1
            }));

            // Update users with new profit and ranking
            await this.userRepository.updateRanking(rankingData);

            // Get updated ranking for response
            const ranking = await this.getRanking();

            // Publish ranking update event
            await this.eventBus.publish('RankingUpdated', ranking);

            logger.info('Ranking recalculated successfully');

            return ranking;
        } catch (error) {
            logger.error('Ranking calculation error:', error);
            throw error;
        }
    }

    async getRanking() {
        const users = await this.userRepository.findByRole(ROLES.USER);

        return users
            .filter(user => user.rankingPosition > 0)
            .sort((a, b) => a.rankingPosition - b.rankingPosition)
            .map(user => ({
                id: user.id,
                name: user.name,
                profit: `${user.profitPercentage.toFixed(2)}%`,
                position: user.rankingPosition,
                operations: user.completedOperations
            }));
    }

    async resetRanking(adminId) {
        try {
            // Verify admin
            const admin = await this.userRepository.findById(adminId);
            if (!admin || !admin.isAdmin()) {
                throw new UnauthorizedError('Admin access required');
            }

            // Get initial configuration
            const config = await this.configService.getCurrentConfig();

            // Reset all regular users
            const users = await this.userRepository.findByRole(ROLES.USER);

            for (const user of users) {
                user.usdBalance = config.initialUsdBalance;
                user.penBalance = config.initialPenBalance;
                user.initialUsd = config.initialUsdBalance;
                user.initialPen = config.initialPenBalance;
                user.profitPercentage = 0;
                user.rankingPosition = 0;
                user.completedOperations = 0;

                await this.userRepository.update(user.id, user);
            }

            // Publish reset event
            await this.eventBus.publish('RankingReset', { adminId });

            logger.info(`Ranking reset by admin: ${admin.name}`);

            return true;
        } catch (error) {
            logger.error('Ranking reset error:', error);
            throw error;
        }
    }

    // Private methods
    _calculatePortfolioValue(usdBalance, penBalance, exchangeRate) {
        return usdBalance + (penBalance / exchangeRate);
    }

    _calculateProfitPercentage(initialValue, currentValue) {
        if (initialValue === 0) return 0;
        return ((currentValue - initialValue) / initialValue) * 100;
    }
}

module.exports = RankingService;