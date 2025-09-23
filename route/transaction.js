// routes/transaction.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction');
const { verifierToken } = require('../middlewere/authentification');

// 📌 Effectuer un transfert
router.post('/transfert', transactionController.effectuerTransfert);


// 📌 Effectuer un retrait
router.post('/retrait', verifierToken, transactionController.effectuerRetrait);


// 📌 Annuler un transfert
router.post('/annuler/:transactionId', verifierToken, transactionController.annulerTransfert);


// 📌 Obtenir l'historique d'un compte
router.get('/historique/:id', verifierToken, transactionController.getHistorique);

// 📌 Obtenir toutes les transactions
router.get('/all', verifierToken, transactionController.getAllTransactions);


module.exports = router;
