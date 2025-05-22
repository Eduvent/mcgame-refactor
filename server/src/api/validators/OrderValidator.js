// src/api/validators/OrderValidator.js
const Joi = require('joi');
const { ValidationError } = require('../../shared/errors/BusinessErrors');
const { ORDER_TYPES } = require('../../shared/constants/orderTypes');

class OrderValidator {
    static createOrderSchema = Joi.object({
        type: Joi.string()
            .valid(...Object.values(ORDER_TYPES))
            .required()
            .messages({
                'any.only': 'Order type must be buy or sell',
                'any.required': 'Order type is required'
            }),

        usdAmount: Joi.number()
            .positive()
            .precision(2)
            .min(0.01)
            .required()
            .messages({
                'number.positive': 'USD amount must be positive',
                'number.min': 'USD amount must be at least 0.01',
                'any.required': 'USD amount is required'
            }),

        exchangeRate: Joi.number()
            .positive()
            .precision(3)
            .min(0.001)
            .max(20)
            .required()
            .messages({
                'number.positive': 'Exchange rate must be positive',
                'number.min': 'Exchange rate must be at least 0.001',
                'number.max': 'Exchange rate cannot exceed 20',
                'any.required': 'Exchange rate is required'
            })
    });

    static validateOrderCreation(data) {
        const { error, value } = this.createOrderSchema.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const messages = error.details.map(detail => detail.message);
            throw new ValidationError(messages.join(', '));
        }

        return value;
    }
}

module.exports = OrderValidator;