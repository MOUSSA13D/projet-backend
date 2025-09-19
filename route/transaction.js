// routes/transaction.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction');

// 📌 Effectuer un transfert
router.post('/transfert', transactionController.effectuerTransfert);

// 📌 Effectuer un retrait
router.post('/retrait', transactionController.effectuerRetrait);

// 📌 Annuler un transfert
router.post('/annuler/:transactionId', transactionController.annulerTransfert);

// 📌 Obtenir l'historique d'un compte
router.get('/historique/:compte_id', transactionController.getHistorique);

module.exports = router;
