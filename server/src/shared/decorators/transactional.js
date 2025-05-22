// src/shared/decorators/transactional.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Transactional decorator for database operations
 * Automatically handles transaction lifecycle
 */
const transactional = (fn) => {
    return async function(...args) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Add session to the last argument if it's an object
            const lastArg = args[args.length - 1];
            if (typeof lastArg === 'object' && lastArg !== null) {
                lastArg.session = session;
            } else {
                args.push({ session });
            }

            const result = await fn.apply(this, args);

            await session.commitTransaction();
            return result;
        } catch (error) {
            await session.abortTransaction();
            logger.error('Transaction failed:', error);
            throw error;
        } finally {
            session.endSession();
        }
    };
};

module.exports = transactional;