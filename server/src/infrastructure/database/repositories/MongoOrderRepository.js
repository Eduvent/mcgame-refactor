// src/infrastructure/database/repositories/MongoOrderRepository.js
const IOrderRepository = require('../../../domain/repositories/IOrderRepository');
const Order = require('../../../domain/entities/Order');
const OrderModel = require('../mongodb/models/OrderModel');
const { NotFoundError } = require('../../../shared/errors/BusinessErrors');
const { ORDER_TYPES, ORDER_STATUS } = require('../../../shared/constants/orderTypes');

class MongoOrderRepository extends IOrderRepository {
    async findById(id) {
        const orderDoc = await OrderModel.findById(id).populate('user_id', 'name role');
        return orderDoc ? this._mapToEntity(orderDoc) : null;
    }

    async create(orderData) {
        const orderDoc = new OrderModel(this._mapToModel(orderData));
        await orderDoc.save();
        return this._mapToEntity(orderDoc);
    }

    async update(id, orderData) {
        const orderDoc = await OrderModel.findByIdAndUpdate(
            id,
            this._mapToModel(orderData),
            { new: true, runValidators: true }
        );

        if (!orderDoc) {
            throw new NotFoundError('Order');
        }

        return this._mapToEntity(orderDoc);
    }

    async delete(id) {
        const result = await OrderModel.findByIdAndDelete(id);
        return result !== null;
    }

    async findActiveOrdersByUser(userId) {
        const orderDocs = await OrderModel.find({
            user_id: userId,
            status: ORDER_STATUS.ACTIVE
        }).sort({ creation_date: -1 });

        return orderDocs.map(doc => this._mapToEntity(doc));
    }

    async findActiveOrdersByType(type) {
        const orderDocs = await OrderModel.find({
            type,
            status: ORDER_STATUS.ACTIVE,
            visible_in_market: true
        })
            .populate('user_id', 'name role')
            .sort({
                exchange_rate: type === ORDER_TYPES.BUY ? -1 : 1,
                creation_date: 1
            });

        return orderDocs.map(doc => this._mapToEntity(doc));
    }

    async findMatchingOrders(order) {
        const matchType = order.type === ORDER_TYPES.BUY ? ORDER_TYPES.SELL : ORDER_TYPES.BUY;

        let priceFilter = {};
        let sortOrder = {};

        if (order.type === ORDER_TYPES.BUY) {
            // For buy orders, find sell orders with rate <= buy rate
            priceFilter = { exchange_rate: { $lte: order.exchangeRate } };
            sortOrder = { exchange_rate: 1, creation_date: 1 }; // Cheapest first
        } else {
            // For sell orders, find buy orders with rate >= sell rate
            priceFilter = { exchange_rate: { $gte: order.exchangeRate } };
            sortOrder = { exchange_rate: -1, creation_date: 1 }; // Highest price first
        }

        const orderDocs = await OrderModel.find({
            type: matchType,
            status: ORDER_STATUS.ACTIVE,
            user_id: { $ne: order.userId },
            ...priceFilter
        })
            .populate('user_id', 'name role')
            .sort(sortOrder);

        return orderDocs.map(doc => this._mapToEntity(doc));
    }

    async findOrdersForMarket() {
        const [buyOrders, sellOrders] = await Promise.all([
            OrderModel.find({
                type: ORDER_TYPES.BUY,
                status: ORDER_STATUS.ACTIVE,
                visible_in_market: true
            })
                .populate('user_id', 'name role')
                .sort({ exchange_rate: -1 })
                .limit(5),

            OrderModel.find({
                type: ORDER_TYPES.SELL,
                status: ORDER_STATUS.ACTIVE,
                visible_in_market: true
            })
                .populate('user_id', 'name role')
                .sort({ exchange_rate: 1 })
                .limit(5)
        ]);

        return {
            buyOrders: buyOrders.map(doc => this._mapToEntity(doc)),
            sellOrders: sellOrders.map(doc => this._mapToEntity(doc))
        };
    }

    async countActiveOrdersByUserAndType(userId, type) {
        return await OrderModel.countDocuments({
            user_id: userId,
            type,
            status: ORDER_STATUS.ACTIVE
        });
    }

    // Private mapping methods
    _mapToEntity(orderDoc) {
        return new Order({
            id: orderDoc._id.toString(),
            userId: orderDoc.user_id._id ? orderDoc.user_id._id.toString() : orderDoc.user_id.toString(),
            type: orderDoc.type,
            usdAmount: orderDoc.usd_amount,
            exchangeRate: orderDoc.exchange_rate,
            status: orderDoc.status,
            creationDate: orderDoc.creation_date,
            executionDate: orderDoc.execution_date,
            visibleInMarket: orderDoc.visible_in_market,
            isResidual: orderDoc.is_residual
        });
    }

    _mapToModel(orderData) {
        const order = orderData instanceof Order ? orderData : orderData;

        return {
            user_id: order.userId,
            type: order.type,
            usd_amount: order.usdAmount,
            exchange_rate: order.exchangeRate,
            status: order.status,
            creation_date: order.creationDate,
            execution_date: order.executionDate,
            visible_in_market: order.visibleInMarket,
            is_residual: order.isResidual
        };
    }
}

module.exports = MongoOrderRepository;
