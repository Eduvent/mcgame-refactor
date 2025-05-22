// src/domain/events/OperationExecutedEvent.js
class OperationExecutedEvent {
    constructor(operation, buyer, seller) {
        this.operation = operation;
        this.buyer = buyer;
        this.seller = seller;
        this.timestamp = new Date();
    }
}

module.exports = OperationExecutedEvent;