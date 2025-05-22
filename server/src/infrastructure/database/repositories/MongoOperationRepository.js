// src/infrastructure/database/repositories/MongoOperationRepository.js
const IOperationRepository = require('../../../domain/repositories/IOperationRepository');
const Operation = require('../../../domain/entities/Operation');
const { NotFoundError } = require('../../../shared/errors/BusinessErrors');

// For now, we'll use in-memory storage since Operation model isn't created yet
class MongoOperationRepository extends IOperationRepository {
    constructor() {
        super();
        this.operations = new Map();
        this.nextId = 1;
    }

    async create(operationData) {
        const operation = operationData instanceof Operation ? operationData : new Operation(operationData);

        if (!operation.id) {
            operation.id = this.nextId.toString();
            this.nextId++;
        }

        this.operations.set(operation.id, operation);
        return operation;
    }

    async findById(id) {
        const operation = this.operations.get(id);
        return operation || null;
    }

    async findAll(filters = {}) {
        const operations = Array.from(this.operations.values());

        // Apply basic filters
        let filtered = operations;

        if (filters.userId) {
            filtered = filtered.filter(op =>
                op.buyerId === filters.userId || op.sellerId === filters.userId
            );
        }

        if (filters.startDate) {
            filtered = filtered.filter(op => op.date >= filters.startDate);
        }

        if (filters.endDate) {
            filtered = filtered.filter(op => op.date <= filters.endDate);
        }

        return filtered;
    }

    async findByUser(userId) {
        const operations = Array.from(this.operations.values());
        return operations.filter(op =>
            op.buyerId === userId || op.sellerId === userId
        );
    }

    async findLatest(limit = 10) {
        const operations = Array.from(this.operations.values());
        return operations
            .sort((a, b) => b.date - a.date)
            .slice(0, limit);
    }

    async getTotalVolume() {
        const operations = Array.from(this.operations.values());
        return operations.reduce((sum, op) => sum + op.usdAmount, 0);
    }

    async getVolumeByPeriod(startDate, endDate) {
        const operations = Array.from(this.operations.values());
        const filtered = operations.filter(op =>
            op.date >= startDate && op.date <= endDate
        );
        return filtered.reduce((sum, op) => sum + op.usdAmount, 0);
    }
}

module.exports = MongoOperationRepository;