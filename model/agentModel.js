const { getDB } = require('../config/basedonne');
const bcrypt = require('bcryptjs');

class Agent {
  constructor() {
    this.db = getDB();
  }

  async getAgent() {
    const [rows] = await this.db.query(`SELECT * FROM agents LIMIT 1`);
    return rows[0];
  }

  async getAgentById(id) {
    const [rows] = await this.db.execute('SELECT * FROM agents WHERE id = ?', [id]);
    return rows[0];
  }

  async getAllAgents() {
    const [rows] = await this.db.query('SELECT * FROM agents');
    return rows;
  }

  async findByEmail(email) {
    const [rows] = await this.db.execute('SELECT * FROM agents WHERE email = ?', [email]);
    return rows[0] || null;
  }

  // modifier solde d'un agent
  async updateSolde(id, nouveauSolde) {
    const [result] = await this.db.execute('UPDATE agents SET solde = ? WHERE id = ?', [nouveauSolde, id]);
    return result.affectedRows > 0;
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = Agent;
