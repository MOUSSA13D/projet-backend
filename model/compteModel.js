// model/compteModel.js
const mongoose = require('mongoose');

// Schéma pour le compte
const compteSchema = new mongoose.Schema({
  numero_compte: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  utilisateur_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  solde: {
    type: Number,
    default: 0,
    min: 0
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

// Transformer automatiquement _id en id et formater utilisateur_id proprement
compteSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    // si utilisateur_id est peuplé en tant qu'objet (document), on le laisse tel quel (il aura son propre id)
    if (ret.utilisateur_id && typeof ret.utilisateur_id === 'object') {
      // si la population a laissé un _id non transformé, tenter d'homogénéiser
      if (ret.utilisateur_id._id) {
        // convertir l'objet peuplé en JSON si possible
        if (typeof ret.utilisateur_id.toJSON === 'function') {
          ret.utilisateur_id = ret.utilisateur_id.toJSON();
        } else {
          // fallback : garder tel quel mais s'assurer qu'il y a un id
          ret.utilisateur_id.id = ret.utilisateur_id._id ? ret.utilisateur_id._id.toString() : ret.utilisateur_id.id;
          delete ret.utilisateur_id._id;
        }
      }
    } else if (ret.utilisateur_id) {
      // si c'est un ObjectId, convertir en string
      ret.utilisateur_id = ret.utilisateur_id.toString();
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const CompteModel = mongoose.model('Compte', compteSchema, 'comptes');

class Compte {
  constructor() {
    this.model = CompteModel;
  }

  // Générer un numéro de compte unique
  generateAccountNumber() {
    const timePart = Date.now().toString().slice(-3);
    const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return (timePart + randomPart).slice(-5);
  }

  // Créer un compte
  async createCompte(utilisateur_id) {
    try {
      const numero_compte = this.generateAccountNumber();

      const compte = new this.model({
        numero_compte,
        utilisateur_id,
        solde: 0,
        statut: 'actif'
      });

      const savedCompte = await compte.save();
      return savedCompte.toJSON();
    } catch (error) {
      throw new Error(`Erreur lors de la création du compte: ${error.message}`);
    }
  }

  // Trouver un compte par ID utilisateur
  async findByUserId(utilisateur_id) {
    try {
      const compte = await this.model.findOne({ utilisateur_id })
        .populate('utilisateur_id', 'nom prenom email role statut');
      return compte ? compte.toJSON() : null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche par ID utilisateur: ${error.message}`);
    }
  }

  // Trouver un compte par numéro de compte
  async findByAccountNumber(numero_compte) {
    try {
      const compte = await this.model.findOne({ numero_compte });
      return compte ? compte.toJSON() : null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche par numéro de compte: ${error.message}`);
    }
  }

  // Trouver un compte par ID
  async findById(id) {
    try {
      const compte = await this.model.findById(id)
        .populate('utilisateur_id', 'nom prenom email role statut');
      return compte ? compte.toJSON() : null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche par ID: ${error.message}`);
    }
  }


  // À ajouter dans la classe Compte dans compteModel.js

// Supprimer un compte par ID utilisateur
async deleteCompte(utilisateur_id) {
  try {
    const result = await this.model.findOneAndDelete({ utilisateur_id });
    return result !== null;
  } catch (error) {
    throw new Error(`Erreur lors de la suppression du compte: ${error.message}`);
  }
}

  // Mettre à jour le solde d'un compte (par numéro de compte)
  async updateSolde(numero_compte, nouveauSolde) {
    try {
      const result = await this.model.findOneAndUpdate(
        { numero_compte },
        { solde: nouveauSolde },
        { new: true }
      );
      return result !== null;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du solde: ${error.message}`);
    }
  }

  // Changer le statut d'un compte
  async updateStatut(utilisateur_id, statut) {
    try {
      const result = await this.model.findOneAndUpdate(
        { utilisateur_id },
        { statut },
        { new: true }
      );
      return result !== null;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
  }

  // Obtenir tous les comptes
  async getAllComptes() {
    try {
      const comptes = await this.model.find({})
        .populate('utilisateur_id', 'nom prenom email role')
        .sort({ date_creation: -1 });
      return comptes.map(c => c.toJSON());
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des comptes: ${error.message}`);
    }
  }
}

module.exports = Compte;
