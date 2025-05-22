// src/domain/events/OrderCreatedEvent.js
class OrderCreatedEvent {
    constructor(order, user) {
        this.order = order;
        this.user = user;
        this.timestamp = new Date();
    }
}

module.exports = OrderCreatedEvent;