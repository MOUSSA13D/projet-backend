// routes/compte.js
const express = require('express');
const router = express.Router();
const compteController = require('../controllers/compte');

// 📌 Créer un compte
router.post('/', compteController.createCompte);

// 📌 Obtenir tous les comptes
router.get('/', compteController.getAllComptes);

// 📌 Obtenir un compte par numéro
router.get('/numero/:numero', compteController.getCompteByNumber);

// 📌 Obtenir un compte par ID utilisateur
router.get('/utilisateur/:userId', compteController.getCompteByUserId);

// 📌 Obtenir le solde d'un compte (par ID)
router.get('/:id/solde', compteController.getSolde);

// 📌 Mettre à jour le statut d'un compte
router.patch('/:id/statut', compteController.updateStatut);

// 📌 Vérifier si un compte est actif
router.get('/check/:numero', compteController.checkStatus);

module.exports = router;
