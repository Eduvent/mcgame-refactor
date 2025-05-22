// src/infrastructure/database/repositories/MongoUserRepository.js
const IUserRepository = require('../../../domain/repositories/IUserRepository');
const User = require('../../../domain/entities/User');
const UserModel = require('../mongodb/models/UserModel');
const { NotFoundError } = require('../../../shared/errors/BusinessErrors');

class MongoUserRepository extends IUserRepository {
    async findById(id) {
        const userDoc = await UserModel.findById(id);
        return userDoc ? this._mapToEntity(userDoc) : null;
    }

    async findByEmail(email) {
        const userDoc = await UserModel.findOne({ email });
        return userDoc ? this._mapToEntity(userDoc) : null;
    }

    async findByDni(dni) {
        const userDoc = await UserModel.findOne({ dni });
        return userDoc ? this._mapToEntity(userDoc) : null;
    }

    async findByEmailOrDni(email, dni) {
        const query = { $or: [] };
        if (email) query.$or.push({ email });
        if (dni) query.$or.push({ dni });

        if (query.$or.length === 0) return null;

        const userDoc = await UserModel.findOne(query);
        return userDoc ? this._mapToEntity(userDoc) : null;
    }

    async create(userData) {
        const userDoc = new UserModel(this._mapToModel(userData));
        await userDoc.save();
        return this._mapToEntity(userDoc);
    }

    async update(id, userData) {
        const userDoc = await UserModel.findByIdAndUpdate(
            id,
            this._mapToModel(userData),
            { new: true, runValidators: true }
        );

        if (!userDoc) {
            throw new NotFoundError('User');
        }

        return this._mapToEntity(userDoc);
    }

    async delete(id) {
        const result = await UserModel.findByIdAndDelete(id);
        return result !== null;
    }

    async findAll(filters = {}) {
        const mongoFilters = this._buildMongoFilters(filters);
        const userDocs = await UserModel.find(mongoFilters);
        return userDocs.map(doc => this._mapToEntity(doc));
    }

    async findByRole(role) {
        const userDocs = await UserModel.find({ role });
        return userDocs.map(doc => this._mapToEntity(doc));
    }

    async updateRanking(rankingData) {
        const bulkOps = rankingData.map(item => ({
            updateOne: {
                filter: { _id: item.userId },
                update: {
                    profit_percentage: item.profitPercentage,
                    ranking_position: item.position
                }
            }
        }));

        await UserModel.bulkWrite(bulkOps);
    }

    // Private mapping methods
    _mapToEntity(userDoc) {
        return new User({
            id: userDoc._id.toString(),
            name: userDoc.name,
            email: userDoc.email,
            dni: userDoc.dni,
            phone: userDoc.phone,
            usdBalance: userDoc.usd_balance,
            penBalance: userDoc.pen_balance,
            initialUsd: userDoc.initial_usd,
            initialPen: userDoc.initial_pen,
            profitPercentage: userDoc.profit_percentage,
            rankingPosition: userDoc.ranking_position,
            completedOperations: userDoc.completed_operations,
            role: userDoc.role,
            commissionRate: userDoc.commission_rate,
            registrationDate: userDoc.registration_date,
            lastLogin: userDoc.last_login
        });
    }

    _mapToModel(userData) {
        const user = userData instanceof User ? userData : userData;

        return {
            name: user.name,
            email: user.email,
            dni: user.dni,
            phone: user.phone,
            usd_balance: user.usdBalance,
            pen_balance: user.penBalance,
            initial_usd: user.initialUsd,
            initial_pen: user.initialPen,
            profit_percentage: user.profitPercentage,
            ranking_position: user.rankingPosition,
            completed_operations: user.completedOperations,
            role: user.role,
            commission_rate: user.commissionRate,
            registration_date: user.registrationDate,
            last_login: user.lastLogin
        };
    }

    _buildMongoFilters(filters) {
        const mongoFilters = {};

        if (filters.role) mongoFilters.role = filters.role;
        if (filters.minBalance) mongoFilters.usd_balance = { $gte: filters.minBalance };
        if (filters.registeredAfter) mongoFilters.registration_date = { $gte: filters.registeredAfter };

        return mongoFilters;
    }
}

module.exports = MongoUserRepository;