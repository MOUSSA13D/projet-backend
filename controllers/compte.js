

// ============================================================================
// controllers/compteController.js
const Compte = require('../model/compteModel');

const compteController = {
  // Créer un compte
  async createCompte(req, res) {
    try {
      const compte = new Compte();
      const { utilisateur_id } = req.body;
      
      if (!utilisateur_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'ID utilisateur requis' 
        });
      }

      const nouveauCompte = await compte.createCompte(utilisateur_id);
      res.status(201).json({ 
        success: true, 
        message: 'Compte créé avec succès',
        data: nouveauCompte 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Obtenir tous les comptes
  async getAllComptes(req, res) {
    try {
      const compte = new Compte();
      const comptes = await compte.getAllComptes();
      res.json({ success: true, data: comptes });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Obtenir un compte par numéro
  async getCompteByNumber(req, res) {
    try {
      const compte = new Compte();
      const compteData = await compte.findByAccountNumber(req.params.numero);
      
      if (!compteData) {
        return res.status(404).json({ success: false, message: 'Compte introuvable' });
      }
      
      res.json({ success: true, data: compteData });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Obtenir un compte par ID utilisateur
  async getCompteByUserId(req, res) {
    try {
      const compte = new Compte();
      const compteData = await compte.findByUserId(req.params.userId);
      
      if (!compteData) {
        return res.status(404).json({ success: false, message: 'Compte introuvable' });
      }
      
      res.json({ success: true, data: compteData });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Obtenir le solde d'un compte
  async getSolde(req, res) {
    try {
      const compte = new Compte();
      const solde = await compte.getSolde(req.params.id);
      res.json({ success: true, data: { solde } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Mettre à jour le statut d'un compte
  async updateStatut(req, res) {
    try {
      const compte = new Compte();
      const { statut } = req.body;
      
      if (!['actif', 'suspendu', 'fermé'].includes(statut)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Statut invalide' 
        });
      }

      const updated = await compte.updateStatut(req.params.id, statut);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Compte introuvable' });
      }
      
      res.json({ 
        success: true, 
        message: 'Statut mis à jour',
        data: { nouveauStatut: statut }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Vérifier si un compte est actif
  async checkStatus(req, res) {
    try {
      const compte = new Compte();
      const isActive = await compte.isAccountActive(req.params.numero);
      res.json({ 
        success: true, 
        data: { 
          numero_compte: req.params.numero,
          est_actif: isActive 
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = compteController;