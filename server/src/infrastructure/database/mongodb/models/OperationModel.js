// src/infrastructure/database/mongodb/models/OperationModel.js
const mongoose = require('mongoose');

const OperationSchema = new mongoose.Schema({
    buy_order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    sell_order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    buyer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seller_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    date: {
        type: Date,
        default: Date.now
    },
    buyer_commission: {
        type: Number,
        required: true,
        min: [0, 'Buyer commission cannot be negative']
    },
    seller_commission: {
        type: Number,
        required: true,
        min: [0, 'Seller commission cannot be negative']
    }
}, {
    timestamps: true
});

// Indexes for better performance
OperationSchema.index({ buyer_id: 1 });
OperationSchema.index({ seller_id: 1 });
OperationSchema.index({ date: -1 });
OperationSchema.index({ buy_order_id: 1, sell_order_id: 1 });

module.exports = mongoose.model('Operation', OperationSchema);