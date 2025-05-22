// src/api/controllers/MarketController.js
class MarketController {
    constructor(marketService, rankingService, configService) {
        this.marketService = marketService;
        this.rankingService = rankingService;
        this.configService = configService;

        // Bind methods
        this.getMarketStatus = this.getMarketStatus.bind(this);
        this.getRanking = this.getRanking.bind(this);
        this.changeMarketStatus = this.changeMarketStatus.bind(this);
        this.recalculateRanking = this.recalculateRanking.bind(this);
        this.resetRanking = this.resetRanking.bind(this);
    }

    async getMarketStatus(req, res, next) {
        try {
            const marketData = await this.marketService.getOrderBook();

            // Enrich data for current user
            const enrichedData = {
                ...marketData,
                buyOrders: marketData.buyOrders.map(order => ({
                    ...order,
                    isOwn: order.userId === req.user.id
                })),
                sellOrders: marketData.sellOrders.map(order => ({
                    ...order,
                    isOwn: order.userId === req.user.id
                }))
            };

            res.status(200).json({
                success: true,
                message: 'Market status retrieved successfully',
                data: enrichedData
            });
        } catch (error) {
            next(error);
        }
    }

    async getRanking(req, res, next) {
        try {
            const ranking = await this.rankingService.getRanking();

            // Mark current user
            const enrichedRanking = ranking.map(item => ({
                ...item,
                isCurrentUser: item.id === req.user.id
            }));

            res.status(200).json({
                success: true,
                message: 'Ranking retrieved successfully',
                data: { ranking: enrichedRanking }
            });
        } catch (error) {
            next(error);
        }
    }

    async changeMarketStatus(req, res, next) {
        try {
            const { status } = req.body;
            const config = await this.configService.changeMarketStatus(status, req.user.id);

            res.status(200).json({
                success: true,
                message: `Market is now ${status}`,
                data: { config }
            });
        } catch (error) {
            next(error);
        }
    }

    async recalculateRanking(req, res, next) {
        try {
            const ranking = await this.rankingService.recalculateRanking();

            res.status(200).json({
                success: true,
                message: 'Ranking recalculated successfully',
                data: { ranking }
            });
        } catch (error) {
            next(error);
        }
    }

    async resetRanking(req, res, next) {
        try {
            await this.rankingService.resetRanking(req.user.id);

            res.status(200).json({
                success: true,
                message: 'Ranking reset successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = MarketController;