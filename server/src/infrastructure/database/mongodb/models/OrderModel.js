// src/infrastructure/database/mongodb/models/OrderModel.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['buy', 'sell'],
        required: true
    },
    usd_amount: {
        type: Number,
        required: true,
        min: [0.01, 'USD amount must be positive']
    },
    exchange_rate: {
        type: Number,
        required: true,
        min: [0.01, 'Exchange rate must be positive']
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    creation_date: {
        type: Date,
        default: Date.now
    },
    execution_date: {
        type: Date
    },
    visible_in_market: {
        type: Boolean,
        default: true
    },
    is_residual: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
OrderSchema.index({ user_id: 1, status: 1 });
OrderSchema.index({ type: 1, status: 1, exchange_rate: 1 });
OrderSchema.index({ creation_date: -1 });

module.exports = mongoose.model('Order', OrderSchema);