// src/api/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../../shared/errors/BusinessErrors');
const { ROLES } = require('../../shared/constants/roles');

class AuthMiddleware {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    authenticateUser() {
        return async (req, res, next) => {
            try {
                let token;

                // Extract token from header
                if (req.headers.authorization?.startsWith('Bearer')) {
                    token = req.headers.authorization.split(' ')[1];
                }

                if (!token) {
                    throw new UnauthorizedError('Access token is required');
                }

                // Verify token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Get user
                const user = await this.userRepository.findById(decoded.id);

                if (!user) {
                    throw new UnauthorizedError('Token user not found');
                }

                // Add user to request
                req.user = user;
                next();
            } catch (error) {
                next(error);
            }
        };
    }

    requireRole(requiredRole) {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    throw new UnauthorizedError('User not authenticated');
                }

                if (!req.user.hasRole(requiredRole)) {
                    throw new ForbiddenError(`${requiredRole} access required`);
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    }

    requireAdmin() {
        return this.requireRole(ROLES.ADMIN);
    }

    requireTrader() {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    throw new UnauthorizedError('User not authenticated');
                }

                if (!req.user.isTrader() && !req.user.isAdmin()) {
                    throw new ForbiddenError('Trader or admin access required');
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    }
}

module.exports = AuthMiddleware;