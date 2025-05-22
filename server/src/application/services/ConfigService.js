// src/application/services/ConfigService.js - Service de configuración
const { NotFoundError } = require('../../shared/errors/BusinessErrors');
const logger = require('../../shared/utils/logger');

class ConfigService {
    constructor(configRepository) {
        this.configRepository = configRepository;
        this._cache = null;
        this._cacheExpiry = null;
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    }

    async getCurrentConfig() {
        // Check cache first
        if (this._cache && this._cacheExpiry && Date.now() < this._cacheExpiry) {
            return this._cache;
        }

        try {
            // For now, return static config based on environment
            const environment = require('../../config/environment');

            const config = {
                marketStatus: 'closed', // Default to closed
                initialUsdBalance: environment.TRADING.INITIAL_USD_BALANCE,
                initialPenBalance: environment.TRADING.INITIAL_PEN_BALANCE,
                baseCommissionRate: environment.TRADING.BASE_COMMISSION_RATE,
                minOperationAmount: environment.TRADING.MIN_OPERATION_AMOUNT,
                maxActiveOrders: environment.TRADING.MAX_ACTIVE_ORDERS,
                referenceBuyRate: environment.TRADING.REFERENCE_BUY_RATE,
                referenceSellRate: environment.TRADING.REFERENCE_SELL_RATE
            };

            // Cache the config
            this._cache = config;
            this._cacheExpiry = Date.now() + this.CACHE_TTL;

            return config;
        } catch (error) {
            logger.error('Error loading configuration:', error);
            throw error;
        }
    }

    async getInitialConfig() {
        const config = await this.getCurrentConfig();
        return {
            initialUsdBalance: config.initialUsdBalance,
            initialPenBalance: config.initialPenBalance,
            baseCommissionRate: config.baseCommissionRate
        };
    }

    async changeMarketStatus(status, adminId) {
        // For now, just return the new status
        // In a real implementation, this would update the database
        logger.info(`Market status changed to ${status} by admin ${adminId}`);

        // Invalidate cache
        this._cache = null;
        this._cacheExpiry = null;

        return {
            marketStatus: status,
            lastUpdate: new Date()
        };
    }

    invalidateCache() {
        this._cache = null;
        this._cacheExpiry = null;
    }
}

module.exports = ConfigService;