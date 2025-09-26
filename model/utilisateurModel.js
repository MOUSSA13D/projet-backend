// model/utilisateurModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schéma pour l'utilisateur
const utilisateurSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mot_de_passe: {
    type: String,
    required: true
  },
  cni: {
    type: String,
    required: true,
    unique: true
  },
  telephone: {
    type: String,
    required: true
  },
  naissance: {
    type: Date,
    required: true
  },
  role: {
    type: String,
    enum: ['client', 'distributeur', 'admin'],
    required: true
  },
  photo: {
    type: String,
    required: true
  },
  statut: {
    type: String,
    enum: ['actif', 'bloqué'],
    default: 'actif'
  }
}, {
  timestamps: {
    createdAt: 'date_creation',
    updatedAt: 'date_modification'
  }
});

// Transformer automatiquement _id en id et gérer utilisateur_id quand peuplé
utilisateurSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    // Ne pas renvoyer le mot de passe par accident
    if (ret.mot_de_passe) delete ret.mot_de_passe;
    return ret;
  }
});

const UtilisateurModel = mongoose.model('Utilisateur', utilisateurSchema, 'utilisateurs');

// Créer un utilisateur
async function createUser(userData) {
  try {
    const { nom, prenom, email, mot_de_passe, cni, telephone, naissance, role, photo } = userData;
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const utilisateur = new UtilisateurModel({
      nom,
      prenom,
      email: email.toLowerCase(),
      mot_de_passe: hashedPassword,
      cni,
      telephone,
      naissance,
      role,
      photo
    });

    const savedUtilisateur = await utilisateur.save();
    const userObj = savedUtilisateur.toJSON();
    // mot_de_passe déjà supprimé dans transform mais on s'assure
    if (userObj.mot_de_passe) delete userObj.mot_de_passe;
    return userObj;
  } catch (error) {
    throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`);
  }
}

// Trouver un utilisateur par email
async function findByEmail(email) {
  try {
    const utilisateur = await UtilisateurModel.findOne({
      email: email.toLowerCase()
    });
    return utilisateur ? utilisateur.toJSON() : null;
  } catch (error) {
    throw new Error(`Erreur lors de la recherche par email: ${error.message}`);
  }
}

// Trouver un utilisateur par ID
async function findById(id) {
  try {
    const utilisateur = await UtilisateurModel.findById(id);
    return utilisateur ? utilisateur.toJSON() : null;
  } catch (error) {
    throw new Error(`Erreur lors de la recherche par ID: ${error.message}`);
  }
}

// Vérifier le mot de passe
async function verifyPassword(plainPassword, hashedPassword) {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new Error(`Erreur lors de la vérification du mot de passe: ${error.message}`);
  }
}

// Mettre à jour le statut
async function updateStatus(id, statut) {
  try {
    const result = await UtilisateurModel.findByIdAndUpdate(
      id,
      { statut },
      { new: true }
    );
    return result !== null;
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
  }
}

// Obtenir tous les utilisateurs
async function getAllUsers() {
  try {
    const utilisateurs = await UtilisateurModel.find({},
      'nom prenom email cni telephone role statut photo date_creation'
    );
    return utilisateurs.map(u => u.toJSON());
  } catch (error) {
    throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
  }
}

// Mettre à jour un utilisateur
async function updateUser(id, userData) {
  try {
    const { nom, prenom, telephone, email, cni, photo } = userData;

    const updateData = {
      nom,
      prenom,
      email: email.toLowerCase(),
      cni,
      telephone
    };

    if (photo) {
      updateData.photo = photo;
    }

    const result = await UtilisateurModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return result !== null;
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour de l'utilisateur: ${error.message}`);
  }
}

// Mettre à jour le mot de passe
async function updatePassword(id, nouveauMotDePasse) {
  try {
    const hashedPassword = await bcrypt.hash(nouveauMotDePasse, 10);

    const result = await UtilisateurModel.findByIdAndUpdate(
      id,
      { mot_de_passe: hashedPassword },
      { new: true }
    );

    return result !== null;
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour du mot de passe: ${error.message}`);
  }
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  verifyPassword,
  updateStatus,
  getAllUsers,
  updateUser,
  updatePassword
};
