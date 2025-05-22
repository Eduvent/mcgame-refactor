// src/domain/entities/Order.js
const { ValidationError } = require('../../shared/errors/BusinessErrors');
const { ORDER_TYPES, ORDER_STATUS } = require('../../shared/constants/orderTypes');

class Order {
    constructor(data) {
        this._validateConstructorData(data);

        this.id = data.id;
        this.userId = data.userId;
        this.type = data.type;
        this.usdAmount = data.usdAmount;
        this.exchangeRate = data.exchangeRate;
        this.status = data.status || ORDER_STATUS.ACTIVE;
        this.creationDate = data.creationDate || new Date();
        this.executionDate = data.executionDate;
        this.visibleInMarket = data.visibleInMarket !== false; // Default to true
        this.isResidual = data.isResidual || false;
    }

    // Business Logic Methods
    isBuyOrder() {
        return this.type === ORDER_TYPES.BUY;
    }

    isSellOrder() {
        return this.type === ORDER_TYPES.SELL;
    }

    isActive() {
        return this.status === ORDER_STATUS.ACTIVE;
    }

    isCompleted() {
        return this.status === ORDER_STATUS.COMPLETED;
    }

    isCancelled() {
        return this.status === ORDER_STATUS.CANCELLED;
    }

    canMatch(otherOrder) {
        // Can't match with same user's order (unless it's a trader)
        if (this.userId === otherOrder.userId) return false;

        // Must be opposite types
        if (this.type === otherOrder.type) return false;

        // Both must be active
        if (!this.isActive() || !otherOrder.isActive()) return false;

        // Price compatibility
        if (this.isBuyOrder() && otherOrder.isSellOrder()) {
            return this.exchangeRate >= otherOrder.exchangeRate;
        }

        if (this.isSellOrder() && otherOrder.isBuyOrder()) {
            return this.exchangeRate <= otherOrder.exchangeRate;
        }

        return false;
    }

    calculatePenAmount() {
        return this.usdAmount * this.exchangeRate;
    }

    markAsCompleted() {
        this.status = ORDER_STATUS.COMPLETED;
        this.executionDate = new Date();
    }

    markAsCancelled() {
        this.status = ORDER_STATUS.CANCELLED;
        this.executionDate = new Date();
    }

    partialMatch(matchedAmount) {
        if (matchedAmount >= this.usdAmount) {
            this.markAsCompleted();
        } else {
            this.usdAmount -= matchedAmount;
            this.executionDate = new Date();
        }
    }

    // Validation
    _validateConstructorData(data) {
        if (!data.userId) {
            throw new ValidationError('User ID is required');
        }
        if (!Object.values(ORDER_TYPES).includes(data.type)) {
            throw new ValidationError('Invalid order type');
        }
        if (!data.usdAmount || data.usdAmount <= 0) {
            throw new ValidationError('USD amount must be positive');
        }
        if (!data.exchangeRate || data.exchangeRate <= 0) {
            throw new ValidationError('Exchange rate must be positive');
        }
    }

    toPlainObject() {
        return {
            id: this.id,
            userId: this.userId,
            type: this.type,
            usdAmount: this.usdAmount,
            exchangeRate: this.exchangeRate,
            status: this.status,
            creationDate: this.creationDate,
            executionDate: this.executionDate,
            visibleInMarket: this.visibleInMarket,
            isResidual: this.isResidual
        };
    }
}

module.exports = Order;