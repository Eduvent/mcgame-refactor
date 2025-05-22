// src/domain/events/EventBus.js
class EventBus {
    constructor() {
        this.handlers = new Map();
    }

    subscribe(eventName, handler) {
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, []);
        }
        this.handlers.get(eventName).push(handler);
    }

    unsubscribe(eventName, handler) {
        if (!this.handlers.has(eventName)) return;

        const handlers = this.handlers.get(eventName);
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    async publish(eventName, eventData) {
        if (!this.handlers.has(eventName)) return;

        const handlers = this.handlers.get(eventName);
        const promises = handlers.map(handler => {
            try {
                return Promise.resolve(handler(eventData));
            } catch (error) {
                console.error(`Error in event handler for ${eventName}:`, error);
                return Promise.resolve();
            }
        });

        await Promise.allSettled(promises);
    }
}

module.exports = EventBus;