// routes/utilisateur.js
const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateur');
const upload = require('../middlewere/upload');
const { verifierToken } = require('../middlewere/authentification');

// // ✅ Créer un utilisateur
// router.post('/creerutilisateur', utilisateurController.createUser);
// Créer un utilisateur avec photo
router.post('/creerutilisateur', verifierToken, upload.single('photo'), utilisateurController.createUser);

// ✅ Connexion utilisateur
// router.post('/login', utilisateurController.login);

// ✅ Obtenir tous les utilisateurs
router.get('/allUtilisateur', verifierToken, utilisateurController.getAllUsers);


// ✅ Obtenir un utilisateur par ID
router.get('/:id', verifierToken, utilisateurController.getUserById);


// ✅ Mettre à jour le statut d’un utilisateur
router.put('/:id/statut', verifierToken, utilisateurController.updateStatus);



// ✅ Mettre à jour les infos d’un utilisateur
router.put('/update/:id', verifierToken, upload.single('photo'), utilisateurController.updateUser);


router.post('/forgot-password', utilisateurController.forgotPassword);

// Route pour changer le mot de passe
router.put('/:id/change-password', verifierToken, utilisateurController.changePassword);




module.exports = router;
