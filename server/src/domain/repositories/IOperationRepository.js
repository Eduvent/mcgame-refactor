// src/domain/repositories/IOperationRepository.js
class IOperationRepository {
    async create(operationData) {
        throw new Error('Method not implemented');
    }

    async findById(id) {
        throw new Error('Method not implemented');
    }

    async findAll(filters = {}) {
        throw new Error('Method not implemented');
    }

    async findByUser(userId) {
        throw new Error('Method not implemented');
    }

    async findLatest(limit = 10) {
        throw new Error('Method not implemented');
    }

    async getTotalVolume() {
        throw new Error('Method not implemented');
    }

    async getVolumeByPeriod(startDate, endDate) {
        throw new Error('Method not implemented');
    }
}

module.exports = IOperationRepository;