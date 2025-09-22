// routes/compte.js
const express = require('express');
const router = express.Router();
const compteController = require('../controllers/compte');

// 📌 Créer un compte



// 📌 Obtenir tous les comptes
router.get('/all', compteController.getAllComptes);


// 📌 Obtenir un compte par numéro
router.get('/numero/:numero', compteController.getCompteByNumber);



// 📌 Obtenir un compte par ID utilisateur
router.get('/compte/:userId', compteController.getCompteByUserId);







module.exports = router;
