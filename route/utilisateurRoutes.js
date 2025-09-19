// routes/utilisateur.js
const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateur');

// ✅ Créer un utilisateur
router.post('/', utilisateurController.createUser);

// ✅ Connexion utilisateur
// router.post('/login', utilisateurController.login);

// ✅ Obtenir tous les utilisateurs
router.get('/', utilisateurController.getAllUsers);

// ✅ Obtenir un utilisateur par ID
router.get('/:id', utilisateurController.getUserById);

// ✅ Mettre à jour le statut d’un utilisateur
router.put('/:id/statut', utilisateurController.updateStatus);

// ✅ Mettre à jour les infos d’un utilisateur
router.put('/:id', utilisateurController.updateUser);

module.exports = router;
