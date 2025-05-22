// src/application/services/AuthService.js
const jwt = require('jsonwebtoken');
const { UserValidator } = require('../../api/validators/UserValidator');
const {
    UserAlreadyExistsError,
    InvalidCredentialsError,
    ValidationError
} = require('../../shared/errors/BusinessErrors');
const User = require('../../domain/entities/User');
const logger = require('../../shared/utils/logger');

class AuthService {
    constructor(userRepository, logRepository, configService, eventBus) {
        this.userRepository = userRepository;
        this.logRepository = logRepository;
        this.configService = configService;
        this.eventBus = eventBus;
    }

    async register(userData) {
        try {
            // Validate input data
            const validatedData = UserValidator.validateRegistration(userData);

            // Check if user already exists
            await this._checkUserDoesNotExist(validatedData.email, validatedData.dni);

            // Get initial configuration
            const config = await this.configService.getInitialConfig();

            // Create user entity
            const user = new User({
                name: validatedData.name,
                email: validatedData.email,
                dni: validatedData.dni,
                phone: validatedData.phone,
                usdBalance: config.initialUsdBalance,
                penBalance: config.initialPenBalance,
                initialUsd: config.initialUsdBalance,
                initialPen: config.initialPenBalance,
                role: 'user',
                commissionRate: config.baseCommissionRate,
                registrationDate: new Date(),
                lastLogin: new Date()
            });

            // Save user
            const savedUser = await this.userRepository.create(user);

            // Log registration
            await this._logUserAction(savedUser.id, 'USER_REGISTERED', {
                name: savedUser.name,
                email: savedUser.email
            });

            // Publish event
            await this.eventBus.publish('UserRegistered', savedUser);

            // Generate token
            const token = this._generateToken(savedUser.id);

            return {
                user: this._mapUserForResponse(savedUser),
                token
            };
        } catch (error) {
            logger.error('Registration error:', error);
            throw error;
        }
    }

    async login(credentials) {
        try {
            // Validate credentials
            const validatedCredentials = UserValidator.validateLogin(credentials);

            // Find user
            const user = await this._findUserByCredentials(validatedCredentials);

            if (!user) {
                throw new InvalidCredentialsError();
            }

            // Update last login
            user.updateLastLogin();
            await this.userRepository.update(user.id, user);

            // Log login
            await this._logUserAction(user.id, 'USER_LOGIN', {
                loginDate: new Date()
            });

            // Publish event
            await this.eventBus.publish('UserLoggedIn', user);

            // Generate token
            const token = this._generateToken(user.id);

            return {
                user: this._mapUserForResponse(user),
                token
            };
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    }

    async getUserProfile(userId) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError('User');
        }

        return this._mapUserForResponse(user);
    }

    // Private methods
    async _checkUserDoesNotExist(email, dni) {
        const existingUser = await this.userRepository.findByEmailOrDni(email, dni);
        if (existingUser) {
            throw new UserAlreadyExistsError();
        }
    }

    async _findUserByCredentials(credentials) {
        if (credentials.email) {
            return await this.userRepository.findByEmail(credentials.email);
        }
        if (credentials.dni) {
            return await this.userRepository.findByDni(credentials.dni);
        }
        return null;
    }

    async _logUserAction(userId, action, details) {
        await this.logRepository.create({
            userId,
            action,
            details,
            date: new Date()
        });
    }

    _generateToken(userId) {
        return jwt.sign(
            { id: userId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '1d' }
        );
    }

    _mapUserForResponse(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            dni: user.dni,
            phone: user.phone,
            role: user.role,
            usdBalance: user.usdBalance,
            penBalance: user.penBalance,
            commissionRate: user.commissionRate,
            profitPercentage: user.profitPercentage,
            rankingPosition: user.rankingPosition,
            completedOperations: user.completedOperations,
            registrationDate: user.registrationDate
        };
    }
}

module.exports = AuthService;