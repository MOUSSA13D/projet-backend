// routes/compte.js
const express = require('express');
const router = express.Router();
const compteController = require('../controllers/compte');
const {verifierToken} = require('../middlewere/authentification');

// 📌 Créer un compte



// 📌 Obtenir tous les comptes
router.get('/all', verifierToken, compteController.getAllComptes);


// 📌 Obtenir un compte par numéro
router.get('/numero/:numero', verifierToken, compteController.getCompteByNumber);



// 📌 Obtenir un compte par ID utilisateur
router.get('/compte/:userId', verifierToken, compteController.getCompteByUserId);







module.exports = router;
