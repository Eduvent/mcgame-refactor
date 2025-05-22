const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Internal dependencies
const setupContainer = require('./config/container');
const { errorHandler } = require('./api/middlewares/errorHandler');
const { generalLimiter } = require('./api/middlewares/rateLimiter');
const createApiRoutes = require('./api/routes');
const logger = require('./shared/utils/logger');

class Server {
    constructor() {
        this.app = express();
        this.server = null;
        this.container = null;
    }

    async initialize() {
        try {
            // Setup dependency injection container
            this.container = setupContainer();
            const config = this.container.resolve('config');

            // Connect to database
            const mongoConnection = this.container.resolve('mongoConnection');
            await mongoConnection.connect();

            // Setup Express middleware
            this.setupMiddleware(config);

            // Setup routes
            this.setupRoutes();

            // Setup error handling
            this.setupErrorHandling();

            // Create HTTP server
            this.server = http.createServer(this.app);

            // Setup Socket.IO
            this.setupSocketIO(config);

            logger.info('Server initialized successfully');
        } catch (error) {
            logger.error('Server initialization failed:', error);
            throw error;
        }
    }

    setupMiddleware(config) {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: false, // Disable for development
            crossOriginEmbedderPolicy: false
        }));

        // Compression
        this.app.use(compression());

        // CORS
        this.app.use(cors({
            origin: config.CORS.ORIGIN,
            methods: config.CORS.METHODS,
            credentials: config.CORS.CREDENTIALS
        }));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        if (config.NODE_ENV !== 'test') {
            this.app.use(morgan('combined', {
                stream: { write: message => logger.info(message.trim()) }
            }));
        }

        // Rate limiting
        this.app.use(generalLimiter);

        // Request ID for tracking
        this.app.use((req, res, next) => {
            req.id = Math.random().toString(36).substr(2, 9);
            res.setHeader('X-Request-ID', req.id);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: this.container.resolve('config').API_VERSION
            });
        });

        // API routes
        this.app.use('/api', createApiRoutes(this.container));

        // Serve static files in production
        if (process.env.NODE_ENV === 'production') {
            this.app.use(express.static('public'));
            this.app.get('*', (req, res) => {
                res.sendFile(path.resolve('public', 'index.html'));
            });
        }

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: `Route ${req.originalUrl} not found`,
                timestamp: new Date().toISOString()
            });
        });
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use(errorHandler);

        // Unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.gracefulShutdown();
        });

        // Uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            this.gracefulShutdown();
        });

        // Graceful shutdown signals
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received, shutting down gracefully');
            this.gracefulShutdown();
        });

        process.on('SIGINT', () => {
            logger.info('SIGINT received, shutting down gracefully');
            this.gracefulShutdown();
        });
    }

    setupSocketIO(config) {
        const socketIO = this.container.resolve('socketIO');
        socketIO.server = this.server; // Set the server
        const io = socketIO.setup();

        // Make IO available to other services
        this.app.set('io', io);

        logger.info('Socket.IO configured successfully');
    }

    async start() {
        const config = this.container.resolve('config');

        this.server.listen(config.PORT, () => {
            logger.info(`🚀 Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
            logger.info(`📊 Health check available at http://localhost:${config.PORT}/health`);
            logger.info(`🔗 API base URL: http://localhost:${config.PORT}/api`);
        });
    }

    async gracefulShutdown() {
        logger.info('Starting graceful shutdown...');

        if (this.server) {
            this.server.close(() => {
                logger.info('HTTP server closed');
            });
        }

        // Close database connection
        try {
            const mongoConnection = this.container.resolve('mongoConnection');
            await mongoConnection.disconnect();
            logger.info('Database connection closed');
        } catch (error) {
            logger.error('Error closing database connection:', error);
        }

        process.exit(0);
    }
}

// Start server if this file is run directly
if (require.main === module) {
    const server = new Server();

    server.initialize()
        .then(() => server.start())
        .catch((error) => {
            logger.error('Failed to start server:', error);
            process.exit(1);
        });
}

module.exports = Server;