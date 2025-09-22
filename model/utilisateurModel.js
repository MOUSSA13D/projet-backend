// models/utilisateurModel.js
const { getDB } = require('../config/basedonne');
const bcrypt = require('bcryptjs');

async function createUser(userData) {
  const db = getDB();
  const { nom, prenom, email, mot_de_passe, cni, telephone, naissance, role, photo } = userData;
  const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

  const query = `
    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, cni, telephone, naissance, role, photo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.execute(query, [
    nom, prenom, email, hashedPassword, cni, telephone, naissance, role, photo
  ]);

  if (role === 'client') {
    await db.execute('INSERT INTO clients (utilisateur_id) VALUES (?)', [result.insertId]);
  } else if (role === 'distributeur') {
    await db.execute('INSERT INTO distributeurs (utilisateur_id) VALUES (?)', [result.insertId]);
  }

  return { id: result.insertId, ...userData, mot_de_passe: undefined };
}



// Trouver un utilisateur par email
async function findByEmail(email) {
  const db = getDB();
  const [rows] = await db.execute('SELECT * FROM utilisateurs WHERE email = ?', [email]);
  return rows[0] || null;
}



// Trouver un utilisateur par ID
async function findById(id) {
  const db = getDB();
  const [rows] = await db.execute('SELECT * FROM utilisateurs WHERE id = ?', [id]);
  return rows[0] || null;
}



// Vérifier le mot de passe
async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// Mettre à jour le statut
async function updateStatus(id, statut) {
  const db = getDB();
  const [result] = await db.execute('UPDATE utilisateurs SET statut = ? WHERE id = ?', [statut, id]);
  return result.affectedRows > 0;
}


// Obtenir tous les utilisateurs
async function getAllUsers() {
  const db = getDB();
  const [rows] = await db.execute(
    'SELECT id, nom, prenom, email, cni, telephone, role, statut, date_creation FROM utilisateurs'
  );
  return rows;
}

// Mettre à jour un utilisateur
async function updateUser(id, userData) {
  const db = getDB();
  const { nom, prenom, telephone, email, cni, photo } = userData;

  let query, params;
  if (photo) {
    query = `
      UPDATE utilisateurs 
      SET nom = ?, prenom = ?, email = ?, cni = ?, photo = ?, telephone = ? 
      WHERE id = ?
    `;
    params = [nom, prenom, email, cni, photo, telephone, id];
  } else {
    query = `
      UPDATE utilisateurs 
      SET nom = ?, prenom = ?, email = ?, cni = ?, telephone = ? 
      WHERE id = ?
    `;
    params = [nom, prenom, email, cni, telephone, id];
  }

  const [result] = await db.execute(query, params);
  return result.affectedRows > 0;
}





module.exports = {
  createUser,
  findByEmail,
  findById,
  verifyPassword,
  updateStatus,
  getAllUsers,
  updateUser
};
