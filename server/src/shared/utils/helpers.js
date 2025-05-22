// src/shared/utils/helpers.js
class Helpers {
    /**
     * Format currency to specified decimal places
     */
    static formatCurrency(value, decimals = 2) {
        if (typeof value !== 'number') {
            throw new Error('Value must be a number');
        }
        return Number(value.toFixed(decimals));
    }

    /**
     * Format exchange rate to 3 decimal places
     */
    static formatExchangeRate(rate) {
        return this.formatCurrency(rate, 3);
    }

    /**
     * Calculate portfolio value in USD
     */
    static calculatePortfolioValue(usdBalance, penBalance, exchangeRate) {
        return usdBalance + (penBalance / exchangeRate);
    }

    /**
     * Calculate profit percentage
     */
    static calculateProfit(initialValue, currentValue) {
        if (initialValue === 0) return 0;
        return ((currentValue - initialValue) / initialValue) * 100;
    }

    /**
     * Generate standard API response
     */
    static generateResponse(success, message, data = null) {
        const response = {
            success,
            message,
            timestamp: new Date().toISOString()
        };

        if (data !== null) {
            response.data = data;
        }

        return response;
    }

    /**
     * Sleep for specified milliseconds
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retry function with exponential backoff
     */
    static async retry(fn, maxRetries = 3, baseDelay = 1000) {
        let lastError;

        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (i === maxRetries) {
                    throw lastError;
                }

                const delay = baseDelay * Math.pow(2, i);
                await this.sleep(delay);
            }
        }
    }

    /**
     * Deep clone object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }

        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }

        return cloned;
    }

    /**
     * Sanitize user input
     */
    static sanitizeString(str) {
        if (typeof str !== 'string') return str;

        return str
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .substring(0, 1000); // Limit length
    }

    /**
     * Generate random string
     */
    static generateRandomString(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';

        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return result;
    }

    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate DNI format (8 digits)
     */
    static isValidDNI(dni) {
        const dniRegex = /^\d{8}$/;
        return dniRegex.test(dni);
    }

    /**
     * Validate phone format (9 digits starting with 9)
     */
    static isValidPhone(phone) {
        const phoneRegex = /^9\d{8}$/;
        return phoneRegex.test(phone);
    }

    /**
     * Convert string to boolean
     */
    static parseBoolean(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        return Boolean(value);
    }

    /**
     * Get pagination info
     */
    static getPaginationInfo(page, limit, total) {
        const currentPage = Math.max(1, parseInt(page) || 1);
        const itemsPerPage = Math.max(1, Math.min(100, parseInt(limit) || 10));
        const totalPages = Math.ceil(total / itemsPerPage);
        const offset = (currentPage - 1) * itemsPerPage;

        return {
            currentPage,
            itemsPerPage,
            totalPages,
            totalItems: total,
            offset,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1
        };
    }
}

module.exports = Helpers;
