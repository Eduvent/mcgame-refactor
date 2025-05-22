// src/shared/errors/BusinessErrors.js
const BaseError = require('./BaseError');

class ValidationError extends BaseError {
    constructor(message = 'Validation failed') {
        super(message, 400);
    }
}

class NotFoundError extends BaseError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
    }
}

class UnauthorizedError extends BaseError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
    }
}

class ForbiddenError extends BaseError {
    constructor(message = 'Access forbidden') {
        super(message, 403);
    }
}

class ConflictError extends BaseError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}

class UserAlreadyExistsError extends ConflictError {
    constructor() {
        super('User already exists with this email or DNI');
    }
}

class InvalidCredentialsError extends UnauthorizedError {
    constructor() {
        super('Invalid credentials provided');
    }
}

class InsufficientFundsError extends ValidationError {
    constructor(message = 'Insufficient funds for this operation') {
        super(message);
    }
}

class MarketClosedError extends ValidationError {
    constructor() {
        super('Market is currently closed');
    }
}

class TooManyRequestsError extends BaseError {
    constructor(message = 'Too many requests') {
        super(message, 429);
    }
}

module.exports = {
    BaseError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    UserAlreadyExistsError,
    InvalidCredentialsError,
    InsufficientFundsError,
    MarketClosedError,
    TooManyRequestsError
};