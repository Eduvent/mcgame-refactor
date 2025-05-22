// src/config/container.js - Dependency Injection Container Completo
const Container = require('../shared/utils/Container');

// Domain
const User = require('../domain/entities/User');
const Order = require('../domain/entities/Order');
const Operation = require('../domain/entities/Operation');
const EventBus = require('../domain/events/EventBus');

// Infrastructure
const MongoConnection = require('../infrastructure/database/mongodb/connection');
const MongoUserRepository = require('../infrastructure/database/repositories/MongoUserRepository');
const MongoOrderRepository = require('../infrastructure/database/repositories/MongoOrderRepository');
const MongoOperationRepository = require('../infrastructure/database/repositories/MongoOperationRepository');
const SocketIOConfig = require('../infrastructure/messaging/socketio/socketConfig');

// Application Services
const AuthService = require('../application/services/AuthService');
const OrderService = require('../application/services/OrderService');
const MatchingService = require('../application/services/MatchingService');
const BalanceService = require('../application/services/BalanceService');
const RankingService = require('../application/services/RankingService');
const MarketService = require('../application/services/MarketService');
const ConfigService = require('../application/services/ConfigService');

// API Layer
const AuthController = require('../api/controllers/AuthController');
const OrderController = require('../api/controllers/OrderController');
const MarketController = require('../api/controllers/MarketController');
const AuthMiddleware = require('../api/middlewares/authMiddleware');

// Validators
const UserValidator = require('../api/validators/UserValidator');
const OrderValidator = require('../api/validators/OrderValidator');

// Utils
const logger = require('../shared/utils/logger');

function setupContainer() {
    const container = new Container();

    // Configuration
    container.register('config', () => require('./environment'), true);
    container.register('logger', () => logger, true);

    // Event Bus (Singleton)
    container.register('eventBus', () => new EventBus(), true);

    // Database Connection
    container.register('mongoConnection', () => {
        const config = container.resolve('config');
        return new MongoConnection(config.DATABASE);
    }, true);

    // Repositories (Singletons)
    container.register('userRepository', () => new MongoUserRepository(), true);
    container.register('orderRepository', () => new MongoOrderRepository(), true);
    container.register('operationRepository', () => new MongoOperationRepository(), true);

    // Configuration Service
    container.register('configService', () => new ConfigService(
        container.resolve('userRepository')
    ), true);

    // Application Services
    container.register('authService', () => new AuthService(
        container.resolve('userRepository'),
        container.resolve('operationRepository'), // Using as log repository
        container.resolve('configService'),
        container.resolve('eventBus')
    ));

    container.register('matchingService', () => new MatchingService(
        container.resolve('orderRepository'),
        container.resolve('operationRepository'),
        container.resolve('userRepository'),
        container.resolve('balanceService'),
        container.resolve('eventBus')
    ));

    container.register('balanceService', () => new BalanceService(
        container.resolve('userRepository'),
        container.resolve('rankingService'),
        container.resolve('eventBus')
    ));

    container.register('rankingService', () => new RankingService(
        container.resolve('userRepository'),
        container.resolve('configService'),
        container.resolve('eventBus')
    ));

    container.register('orderService', () => new OrderService(
        container.resolve('orderRepository'),
        container.resolve('userRepository'),
        container.resolve('configService'),
        container.resolve('matchingService'),
        container.resolve('eventBus')
    ));

    container.register('marketService', () => new MarketService(
        container.resolve('orderRepository'),
        container.resolve('operationRepository'),
        container.resolve('configService')
    ));

    // API Controllers
    container.register('authController', () => new AuthController(
        container.resolve('authService')
    ));

    container.register('orderController', () => new OrderController(
        container.resolve('orderService'),
        container.resolve('balanceService')
    ));

    container.register('marketController', () => new MarketController(
        container.resolve('marketService'),
        container.resolve('rankingService'),
        container.resolve('configService')
    ));

    // Middlewares
    container.register('authMiddleware', () => new AuthMiddleware(
        container.resolve('userRepository')
    ));

    // Socket.IO
    container.register('socketIO', () => new SocketIOConfig(
        null, // Will be set later with server
        container.resolve('config'),
        container.resolve('userRepository')
    ));

    return container;
}

module.exports = setupContainer;