class IUserRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async findByDni(dni) {
    throw new Error('Method not implemented');
  }

  async findByEmailOrDni(email, dni) {
    throw new Error('Method not implemented');
  }

  async create(userData) {
    throw new Error('Method not implemented');
  }

  async update(id, userData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async findAll(filters = {}) {
    throw new Error('Method not implemented');
  }

  async findByRole(role) {
    throw new Error('Method not implemented');
  }

  async updateRanking(rankingData) {
    throw new Error('Method not implemented');
  }
}

module.exports = IUserRepository;
