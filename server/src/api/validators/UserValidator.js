// src/api/validators/UserValidator.js
const Joi = require('joi');
const { ValidationError } = require('../../shared/errors/BusinessErrors');

class UserValidator {
    static registrationSchema = Joi.object({
        name: Joi.string()
            .min(2)
            .max(100)
            .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
            .required()
            .messages({
                'string.pattern.base': 'Name can only contain letters and spaces',
                'string.min': 'Name must be at least 2 characters long',
                'string.max': 'Name cannot exceed 100 characters',
                'any.required': 'Name is required'
            }),

        email: Joi.string()
            .email()
            .lowercase()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),

        dni: Joi.string()
            .pattern(/^\d{8}$/)
            .required()
            .messages({
                'string.pattern.base': 'DNI must be exactly 8 digits',
                'any.required': 'DNI is required'
            }),

        phone: Joi.string()
            .pattern(/^9\d{8}$/)
            .required()
            .messages({
                'string.pattern.base': 'Phone must be 9 digits starting with 9',
                'any.required': 'Phone number is required'
            })
    });

    static loginSchema = Joi.object({
        email: Joi.string().email(),
        dni: Joi.string().pattern(/^\d{8}$/)
    }).xor('email', 'dni').messages({
        'object.xor': 'Please provide either email or DNI, but not both'
    });

    static validateRegistration(data) {
        const { error, value } = this.registrationSchema.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const messages = error.details.map(detail => detail.message);
            throw new ValidationError(messages.join(', '));
        }

        return value;
    }

    static validateLogin(data) {
        const { error, value } = this.loginSchema.validate(data, {
            stripUnknown: true
        });

        if (error) {
            throw new ValidationError(error.details[0].message);
        }

        return value;
    }
}

module.exports = UserValidator;