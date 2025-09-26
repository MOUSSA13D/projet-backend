// routes/utilisateur.js
const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateur');
const upload = require('../middlewere/upload');
const { verifierToken } = require('../middlewere/authentification');

// Créer un utilisateur avec photo
router.post('/creerutilisateur', verifierToken, upload.single('photo'), utilisateurController.createUser);

// router.post('/login', utilisateurController.login);
router.get('/allUtilisateur', verifierToken, utilisateurController.getAllUsers);

router.get('/:id', verifierToken, utilisateurController.getUserById);

router.put('/:id/statut', verifierToken, utilisateurController.updateStatus);

router.put('/update/:id', verifierToken, upload.single('photo'), utilisateurController.updateUser);

router.post('/forgot-password', utilisateurController.forgotPassword);

router.put('/:id/change-password', verifierToken, utilisateurController.changePassword);


module.exports = router;
