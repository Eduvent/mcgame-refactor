// src/infrastructure/database/mongodb/models/UserModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    dni: {
        type: String,
        required: [true, 'DNI is required'],
        unique: true,
        trim: true,
        match: [/^\d{8}$/, 'DNI must be 8 digits']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^9\d{8}$/, 'Phone must be 9 digits starting with 9']
    },
    password: {
        type: String,
        minlength: 6,
        select: false
    },
    usd_balance: {
        type: Number,
        default: 0,
        min: [0, 'USD balance cannot be negative']
    },
    pen_balance: {
        type: Number,
        default: 0,
        min: [0, 'PEN balance cannot be negative']
    },
    initial_usd: {
        type: Number,
        default: 0
    },
    initial_pen: {
        type: Number,
        default: 0
    },
    profit_percentage: {
        type: Number,
        default: 0
    },
    ranking_position: {
        type: Number,
        default: 0
    },
    completed_operations: {
        type: Number,
        default: 0,
        min: [0, 'Completed operations cannot be negative']
    },
    role: {
        type: String,
        enum: ['user', 'trader', 'admin'],
        default: 'user'
    },
    commission_rate: {
        type: Number,
        default: 0.005,
        min: [0, 'Commission rate cannot be negative'],
        max: [0.1, 'Commission rate cannot exceed 10%']
    },
    registration_date: {
        type: Date,
        default: Date.now
    },
    last_login: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ dni: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ ranking_position: 1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }

    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    next();
});

// Instance method to check password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to generate JWT
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '1d' }
    );
};

module.exports = mongoose.model('User', UserSchema);