// src/domain/repositories/IOrderRepository.js
class IOrderRepository {
    async findById(id) {
        throw new Error('Method not implemented');
    }

    async create(orderData) {
        throw new Error('Method not implemented');
    }

    async update(id, orderData) {
        throw new Error('Method not implemented');
    }

    async delete(id) {
        throw new Error('Method not implemented');
    }

    async findActiveOrdersByUser(userId) {
        throw new Error('Method not implemented');
    }

    async findActiveOrdersByType(type) {
        throw new Error('Method not implemented');
    }

    async findMatchingOrders(order) {
        throw new Error('Method not implemented');
    }

    async findOrdersForMarket() {
        throw new Error('Method not implemented');
    }

    async countActiveOrdersByUserAndType(userId, type) {
        throw new Error('Method not implemented');
    }
}

module.exports = IOrderRepository;