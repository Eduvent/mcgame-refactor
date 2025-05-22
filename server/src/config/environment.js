// src/config/environment.js
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Debug: Verificar que las variables se cargaron
console.log('MongoDB URI from env:', process.env.MONGODB_URI ? 'Loaded' : 'Not loaded');
console.log('Current directory:', __dirname);
console.log('Looking for .env at:', path.join(__dirname, '../../../.env'));

const environment = {
    // Application
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT) || 5000,
    API_VERSION: process.env.API_VERSION || '1.0.0',

    // Database
    DATABASE: {
        URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/trading_simulator',
        OPTIONS: {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        }
    },

    // Security
    SECURITY: {
        JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        JWT_EXPIRE: process.env.JWT_EXPIRE || '1d',
        BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12
    },

    // CORS
    CORS: {
        ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
        METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        CREDENTIALS: true
    },

    // Rate Limiting
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 100,
        AUTH_MAX_REQUESTS: 5,
        ORDER_MAX_REQUESTS: 10
    },

    // Trading Configuration
    TRADING: {
        INITIAL_USD_BALANCE: parseFloat(process.env.INITIAL_USD_BALANCE) || 1000,
        INITIAL_PEN_BALANCE: parseFloat(process.env.INITIAL_PEN_BALANCE) || 3500,
        BASE_COMMISSION_RATE: parseFloat(process.env.BASE_COMMISSION_RATE) || 0.005,
        MIN_OPERATION_AMOUNT: parseFloat(process.env.MIN_OPERATION_AMOUNT) || 100,
        MAX_ACTIVE_ORDERS: parseInt(process.env.MAX_ACTIVE_ORDERS) || 5,
        REFERENCE_BUY_RATE: parseFloat(process.env.REFERENCE_BUY_RATE) || 3.55,
        REFERENCE_SELL_RATE: parseFloat(process.env.REFERENCE_SELL_RATE) || 3.57
    },

    // Logging
    LOGGING: {
        LEVEL: process.env.LOG_LEVEL || 'info',
        MAX_SIZE: '5m',
        MAX_FILES: 5
    }
};

// Validation
function validateEnvironment() {
    const required = [
        'DATABASE.URI',
        'SECURITY.JWT_SECRET'
    ];

    const missing = required.filter(key => {
        const keys = key.split('.');
        let obj = environment;
        for (const k of keys) {
            if (!obj[k]) return true;
            obj = obj[k];
        }
        return false;
    });

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

validateEnvironment();

module.exports = environment;