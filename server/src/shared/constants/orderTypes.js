// src/shared/constants/orderTypes.js
const ORDER_TYPES = {
    BUY: 'buy',
    SELL: 'sell'
};

const ORDER_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const ORDER_CONSTRAINTS = {
    MIN_USD_AMOUNT: 0.01,
    MAX_USD_AMOUNT: 1000000,
    MIN_EXCHANGE_RATE: 0.001,
    MAX_EXCHANGE_RATE: 20,
    MAX_ACTIVE_ORDERS_PER_TYPE: 5
};

module.exports = {
    ORDER_TYPES,
    ORDER_STATUS,
    ORDER_CONSTRAINTS
};