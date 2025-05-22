// src/infrastructure/messaging/socketio/socketConfig.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../../../shared/utils/logger');

class SocketIOConfig {
    constructor(server, config, userRepository) {
        this.server = server;
        this.config = config;
        this.userRepository = userRepository;
        this.io = null;
    }

    setup() {
        this.io = socketIO(this.server, {
            cors: {
                origin: this.config.corsOrigin,
                methods: ['GET', 'POST'],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token ||
                    socket.handshake.headers.authorization?.split(' ')[1];

                if (!token) {
                    return next(new Error('Authentication required'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await this.userRepository.findById(decoded.id);

                if (!user) {
                    return next(new Error('User not found'));
                }

                socket.user = user;
                logger.info(`User connected: ${user.name} (${socket.id})`);
                next();
            } catch (error) {
                logger.error('Socket authentication error:', error);
                next(new Error('Invalid token'));
            }
        });

        // Connection handling
        this.io.on('connection', (socket) => {
            this._handleConnection(socket);
        });

        return this.io;
    }

    _handleConnection(socket) {
        const user = socket.user;

        // Join user-specific rooms
        socket.join('market');
        socket.join(`user:${user.id}`);

        if (user.isAdmin()) {
            socket.join('admin');
        } else if (user.isTrader()) {
            socket.join('trader');
        }

        // Handle events
        socket.on('subscribe:orderbook', () => {
            socket.join('orderbook');
        });

        socket.on('subscribe:ranking', () => {
            socket.join('ranking');
        });

        socket.on('disconnect', () => {
            logger.info(`User disconnected: ${user.name} (${socket.id})`);
        });

        // Error handling
        socket.on('error', (error) => {
            logger.error(`Socket error for user ${user.name}:`, error);
        });
    }

    getIO() {
        return this.io;
    }

    // Event emission methods
    emitToUser(userId, event, data) {
        this.io.to(`user:${userId}`).emit(event, data);
    }

    emitToMarket(event, data) {
        this.io.to('market').emit(event, data);
    }

    emitToAdmins(event, data) {
        this.io.to('admin').emit(event, data);
    }

    emitToTraders(event, data) {
        this.io.to('trader').emit(event, data);
    }

    emitToAll(event, data) {
        this.io.emit(event, data);
    }
}

module.exports = SocketIOConfig;