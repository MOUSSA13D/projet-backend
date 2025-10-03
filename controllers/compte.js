

// ============================================================================
// controllers/compteController.js
const Compte = require('../model/compteModel');

const compteController = {



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




};

module.exports = compteController;