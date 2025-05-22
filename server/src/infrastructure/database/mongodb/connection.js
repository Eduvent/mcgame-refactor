// src/infrastructure/database/mongodb/connection.js
const mongoose = require('mongoose');
const logger = require('../../../shared/utils/logger');

class MongoConnection {
    constructor(config) {
        this.config = config;
        this.connection = null;
    }

    async connect() {
        try {
            const options = {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                ...this.config.OPTIONS
            };

            console.log('Attempting to connect to:', this.config.URI);

            this.connection = await mongoose.connect(this.config.URI, options);

            logger.info(`MongoDB Connected: ${this.connection.connection.host}`);

            // Handle connection events
            mongoose.connection.on('error', (error) => {
                logger.error('MongoDB connection error:', error);
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
            });

            return this.connection;
        } catch (error) {
            logger.error('Error connecting to MongoDB:', error);
            process.exit(1);
        }
    }

    async disconnect() {
        if (this.connection) {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed');
        }
    }

    getConnection() {
        return this.connection;
    }
}

module.exports = MongoConnection;