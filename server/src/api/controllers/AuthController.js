// src/api/controllers/AuthController.js
const { BaseError } = require('../../shared/errors/BaseError');
const logger = require('../../shared/utils/logger');

class AuthController {
    constructor(authService) {
        this.authService = authService;

        // Bind methods to preserve 'this' context
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
        this.getProfile = this.getProfile.bind(this);
    }

    async register(req, res, next) {
        try {
            const result = await this.authService.register(req.body);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const result = await this.authService.login(req.body);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req, res, next) {
        try {
            const user = await this.authService.getUserProfile(req.user.id);

            res.status(200).json({
                success: true,
                message: 'Profile retrieved successfully',
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;