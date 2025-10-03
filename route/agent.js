// routes/agent.js
const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent');
const { verifierToken } = require('../middlewere/authentification');
const upload = require('../middlewere/upload');

// Route pour créer un nouvel agent (POST)

// Route pour obtenir tous les agents (GET)
router.get('/allAgent',  agentController.getAllAgents);

// Route pour obtenir un agent par ID (GET)
router.get('/:id', verifierToken, agentController.getAgentById);

// Route pour mettre à jour un agent (PUT)

router.post('/create', verifierToken, upload.single('photo'), agentController.createAgent);
router.put('/update/:id', verifierToken, upload.single('photo'), agentController.updateAgent);


// MODIFIÉ: Route PUT pour mise à jour du profil (sans mot de passe)
router.put('/:id', verifierToken, agentController.updateAgent);

// NOUVEAU: Route PATCH pour changement de mot de passe
router.patch('/:id/password', verifierToken, agentController.changePassword);


module.exports = router;