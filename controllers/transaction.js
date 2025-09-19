

// ============================================================================
// controllers/transactionController.js
const Transaction = require('../model/transaction');

const transactionController = {
  // Effectuer un transfert
  async effectuerTransfert(req, res) {
    try {
      const transaction = new Transaction();
      const { 
        acteur_type, 
        numero_compte_expediteur, 
        numero_compte_destinataire, 
        montant 
      } = req.body;

      // Validation basique
      if (!acteur_type || !numero_compte_expediteur || !numero_compte_destinataire || !montant) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis'
        });
      }

      if (montant <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Le montant doit être positif'
        });
      }

      const resultat = await transaction.effectuerTransfert(
        acteur_type,
        numero_compte_expediteur,
        numero_compte_destinataire,
        montant
      );

      res.json({
        success: true,
        message: 'Transfert effectué avec succès',
        data: resultat
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Effectuer un retrait
  async effectuerRetrait(req, res) {
    try {
      const transaction = new Transaction();
      const { distributeur, numero_compte_client, montant } = req.body;

      if (!distributeur || !numero_compte_client || !montant) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis'
        });
      }

      if (montant <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Le montant doit être positif'
        });
      }

      const resultat = await transaction.effectuerRetrait(
        distributeur,
        numero_compte_client,
        montant
      );

      res.json({
        success: true,
        message: 'Retrait effectué avec succès',
        data: resultat
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Annuler un transfert
  async annulerTransfert(req, res) {
    try {
      const transaction = new Transaction();
      const { acteur_id, acteur_type } = req.body;
      const { transactionId } = req.params;

      if (!acteur_id || !acteur_type) {
        return res.status(400).json({
          success: false,
          message: 'ID acteur et type requis'
        });
      }

      const resultat = await transaction.annulerTransfert(
        acteur_id,
        acteur_type,
        transactionId
      );

      res.json({
        success: true,
        message: 'Transfert annulé avec succès',
        data: resultat
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Obtenir l'historique d'un compte
  async getHistorique(req, res) {
    try {
      const transaction = new Transaction();
      const { acteur_id } = req.params;

      const historique = await transaction.getTransactionsByCompte(acteur_id);

      res.json({
        success: true,
        data: historique
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = transactionController;