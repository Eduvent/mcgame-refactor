const { ValidationError } = require('../../shared/errors/BusinessErrors');
const { ROLES } = require('../../shared/constants/roles');

class User {
    constructor(data) {
        this._validateConstructorData(data);

        this.id = data.id;
        this.name = data.name;
        this.email = data.email;
        this.dni = data.dni;
        this.phone = data.phone;
        this.usdBalance = data.usdBalance || 0;
        this.penBalance = data.penBalance || 0;
        this.initialUsd = data.initialUsd || 0;
        this.initialPen = data.initialPen || 0;
        this.profitPercentage = data.profitPercentage || 0;
        this.rankingPosition = data.rankingPosition || 0;
        this.completedOperations = data.completedOperations || 0;
        this.role = data.role || ROLES.USER;
        this.commissionRate = data.commissionRate || 0.005;
        this.registrationDate = data.registrationDate || new Date();
        this.lastLogin = data.lastLogin || new Date();
    }

    // Business Logic Methods
    isTrader() {
        return this.role === ROLES.TRADER;
    }

    isAdmin() {
        return this.role === ROLES.ADMIN;
    }

    isRegularUser() {
        return this.role === ROLES.USER;
    }

    hasRole(role) {
        return this.role === role;
    }

    hasSufficientUsdBalance(amount) {
        if (this.isTrader()) return true; // Traders have unlimited funds
        return this.usdBalance >= amount;
    }

    hasSufficientPenBalance(amount) {
        if (this.isTrader()) return true; // Traders have unlimited funds
        return this.penBalance >= amount;
    }

    calculateCommission(amount) {
        return amount * this.commissionRate;
    }

    canAffordOrder(orderType, usdAmount, exchangeRate) {
        if (this.isTrader()) return true;

        if (orderType === 'buy') {
            const penAmount = usdAmount * exchangeRate;
            const commission = this.calculateCommission(penAmount);
            const totalPenRequired = penAmount + commission;
            return this.hasSufficientPenBalance(totalPenRequired);
        } else {
            return this.hasSufficientUsdBalance(usdAmount);
        }
    }

    reserveFunds(orderType, usdAmount, exchangeRate) {
        if (this.isTrader()) return; // Traders don't need to reserve funds

        if (orderType === 'buy') {
            const penAmount = usdAmount * exchangeRate;
            const commission = this.calculateCommission(penAmount);
            const totalPenRequired = penAmount + commission;

            if (!this.hasSufficientPenBalance(totalPenRequired)) {
                throw new ValidationError('Insufficient PEN balance');
            }

            this.penBalance -= totalPenRequired;
        } else {
            if (!this.hasSufficientUsdBalance(usdAmount)) {
                throw new ValidationError('Insufficient USD balance');
            }

            this.usdBalance -= usdAmount;
        }
    }

    releaseFunds(orderType, usdAmount, exchangeRate) {
        if (this.isTrader()) return; // Traders don't have reserved funds

        if (orderType === 'buy') {
            const penAmount = usdAmount * exchangeRate;
            const commission = this.calculateCommission(penAmount);
            const totalPenReserved = penAmount + commission;
            this.penBalance += totalPenReserved;
        } else {
            this.usdBalance += usdAmount;
        }
    }

    executeBuyOperation(usdAmount) {
        if (!this.isTrader()) {
            this.usdBalance += usdAmount;
            this.completedOperations += 1;
        }
    }

    executeSellOperation(penAmount) {
        if (!this.isTrader()) {
            const commission = this.calculateCommission(penAmount);
            this.penBalance += (penAmount - commission);
            this.completedOperations += 1;
        }
    }

    updateProfit(profitPercentage) {
        this.profitPercentage = profitPercentage;
    }

    updateRankingPosition(position) {
        this.rankingPosition = position;
    }

    updateLastLogin() {
        this.lastLogin = new Date();
    }

    // Validation
    _validateConstructorData(data) {
        if (!data.name || typeof data.name !== 'string') {
            throw new ValidationError('Name is required and must be a string');
        }
        if (!data.email || typeof data.email !== 'string') {
            throw new ValidationError('Email is required and must be a string');
        }
        if (!data.dni || typeof data.dni !== 'string') {
            throw new ValidationError('DNI is required and must be a string');
        }
    }

    // Serialization for persistence
    toPlainObject() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            dni: this.dni,
            phone: this.phone,
            usdBalance: this.usdBalance,
            penBalance: this.penBalance,
            initialUsd: this.initialUsd,
            initialPen: this.initialPen,
            profitPercentage: this.profitPercentage,
            rankingPosition: this.rankingPosition,
            completedOperations: this.completedOperations,
            role: this.role,
            commissionRate: this.commissionRate,
            registrationDate: this.registrationDate,
            lastLogin: this.lastLogin
        };
    }
}

module.exports = User;