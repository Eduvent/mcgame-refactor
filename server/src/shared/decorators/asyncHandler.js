// src/shared/decorators/asyncHandler.js
/**
 * Async handler decorator for Express routes
 * Automatically catches async errors and passes them to next()
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
