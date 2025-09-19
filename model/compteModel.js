// models/compteModel.js
const { getDB } = require('../config/basedonne');

class Compte {
  // Générer un numéro de compte unique
  generateAccountNumber() {
    return 'ACC' + Date.now() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  }

  // Créer un compte
  async createCompte(utilisateur_id) {
    const db = getDB();
    const numero_compte = this.generateAccountNumber();

    const query = `
      INSERT INTO comptes (numero_compte, utilisateur_id, solde)
      VALUES (?, ?, ?)
    `;

    const [result] = await db.execute(query, [numero_compte, utilisateur_id, 0]);
    return {
      id: result.insertId,
      numero_compte,
      utilisateur_id,
      solde: 0,
      statut: 'actif',
    };
  }

  // Trouver un compte par ID utilisateur
  async findByUserId(utilisateur_id) {
    const db = getDB();
    const query = `
      SELECT c.*, u.nom, u.prenom, u.email
      FROM comptes c
      JOIN utilisateurs u ON c.utilisateur_id = u.id
      WHERE c.utilisateur_id = ?
    `;
    const [rows] = await db.execute(query, [utilisateur_id]);
    return rows[0] || null;
  }

  // Trouver un compte par numéro de compte
  async findByAccountNumber(numero_compte) {
    const db = getDB();
   
    const [rows] = await db.execute('SELECT * FROM comptes WHERE numero_compte = ?', [numero_compte]);
    return rows[0] || null;
  }

  // Trouver un compte par ID
  async findById(id) {
    const db = getDB();
    const query = `
      SELECT c.*, u.nom, u.prenom, u.email
      FROM comptes c
      JOIN utilisateurs u ON c.utilisateur_id = u.id
      WHERE c.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  }

  // Mettre à jour le solde d'un compte
  async updateSolde(id, nouveauSolde) {
    const db = getDB();
    const query = 'UPDATE comptes SET solde = ? WHERE numero_compte = ?';
    const [result] = await db.execute(query, [nouveauSolde, id]);
    return result.affectedRows > 0;
  }

  // Obtenir le solde d'un compte
  async getSolde(id) {
    const db = getDB();
    const query = 'SELECT solde FROM comptes WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0]?.solde || 0;
  }

  // Changer le statut d'un compte
  async updateStatut(id, statut) {
    const db = getDB();
    const query = 'UPDATE comptes SET statut = ? WHERE id = ?';
    const [result] = await db.execute(query, [statut, id]);
    return result.affectedRows > 0;
  }

  // Obtenir tous les comptes
  async getAllComptes() {
    const db = getDB();
    const query = `
      SELECT c.*, u.nom, u.prenom, u.email, u.role
      FROM comptes c
      JOIN utilisateurs u ON c.utilisateur_id = u.id
      ORDER BY c.date_creation DESC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  // Vérifier si un compte existe et est actif
  async isAccountActive(numero_compte) {
    const db = getDB();
    const query = 'SELECT statut FROM comptes WHERE numero_compte = ?';
    const [rows] = await db.execute(query, [numero_compte]);
    return rows[0]?.statut === 'actif';
  }
}

module.exports = Compte;
