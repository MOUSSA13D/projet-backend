// routes/utilisateur.js
const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateur');
const upload = require('../middlewere/upload');
const verifierToken = require('../middlewere/authentification');

// // ✅ Créer un utilisateur
// router.post('/creerutilisateur', utilisateurController.createUser);
// Créer un utilisateur avec photo
router.post('/creerutilisateur', upload.single('photo'), utilisateurController.createUser);

// ✅ Connexion utilisateur
// router.post('/login', utilisateurController.login);

// ✅ Obtenir tous les utilisateurs
router.get('/allUtilisateur', utilisateurController.getAllUsers);


// ✅ Obtenir un utilisateur par ID
router.get('/:id', utilisateurController.getUserById);


// ✅ Mettre à jour le statut d’un utilisateur
router.put('/:id/statut', utilisateurController.updateStatus);



// ✅ Mettre à jour les infos d’un utilisateur
router.put('/update/:id', upload.single('photo'), utilisateurController.updateUser);


module.exports = router;
