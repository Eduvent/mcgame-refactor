// src/shared/utils/logger.js
const winston = require('winston');
const path = require('path');

class Logger {
    constructor() {
        this.logger = this.createLogger();
    }

    createLogger() {
        const logFormat = winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
            winston.format.prettyPrint()
        );

        const logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            defaultMeta: {
                service: 'trading-simulator',
                version: process.env.API_VERSION || '1.0.0'
            },
            transports: [
                // Write all logs error (and below) to `error.log`
                new winston.transports.File({
                    filename: path.join(process.cwd(), 'logs', 'error.log'),
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                }),
                // Write all logs to `combined.log`
                new winston.transports.File({
                    filename: path.join(process.cwd(), 'logs', 'combined.log'),
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                })
            ],
            // Handle exceptions and rejections
            exceptionHandlers: [
                new winston.transports.File({
                    filename: path.join(process.cwd(), 'logs', 'exceptions.log')
                })
            ],
            rejectionHandlers: [
                new winston.transports.File({
                    filename: path.join(process.cwd(), 'logs', 'rejections.log')
                })
            ]
        });

        // Add console transport in development
        if (process.env.NODE_ENV !== 'production') {
            logger.add(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple(),
                    winston.format.printf(({ level, message, timestamp, ...meta }) => {
                        return `${timestamp} [${level}]: ${message} ${
                            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
                        }`;
                    })
                )
            }));
        }

        return logger;
    }

    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    error(message, meta = {}) {
        this.logger.error(message, meta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    // Structured logging methods
    logUserAction(userId, action, details = {}) {
        this.info('User action', {
            userId,
            action,
            details,
            timestamp: new Date().toISOString()
        });
    }

    logOrderEvent(orderId, event, details = {}) {
        this.info('Order event', {
            orderId,
            event,
            details,
            timestamp: new Date().toISOString()
        });
    }

    logOperationEvent(operationId, event, details = {}) {
        this.info('Operation event', {
            operationId,
            event,
            details,
            timestamp: new Date().toISOString()
        });
    }

    logSystemEvent(event, details = {}) {
        this.info('System event', {
            event,
            details,
            timestamp: new Date().toISOString()
        });
    }
}

// Export singleton instance
module.exports = new Logger();