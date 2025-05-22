// src/domain/entities/Operation.js
class Operation {
    constructor(data) {
        this.id = data.id;
        this.buyOrderId = data.buyOrderId;
        this.sellOrderId = data.sellOrderId;
        this.buyerId = data.buyerId;
        this.sellerId = data.sellerId;
        this.usdAmount = data.usdAmount;
        this.exchangeRate = data.exchangeRate;
        this.date = data.date || new Date();
        this.buyerCommission = data.buyerCommission;
        this.sellerCommission = data.sellerCommission;
    }

    calculatePenAmount() {
        return this.usdAmount * this.exchangeRate;
    }

    getTotalCommissions() {
        return this.buyerCommission + this.sellerCommission;
    }

    toPlainObject() {
        return {
            id: this.id,
            buyOrderId: this.buyOrderId,
            sellOrderId: this.sellOrderId,
            buyerId: this.buyerId,
            sellerId: this.sellerId,
            usdAmount: this.usdAmount,
            exchangeRate: this.exchangeRate,
            date: this.date,
            buyerCommission: this.buyerCommission,
            sellerCommission: this.sellerCommission
        };
    }
}

module.exports = Operation;