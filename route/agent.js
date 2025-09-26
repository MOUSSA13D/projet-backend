// routes/agent.js
const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent');
const { verifierToken } = require('../middlewere/authentification');

// Route pour créer un nouvel agent (POST)
router.post('/', agentController.createAgent);

// Route pour obtenir tous les agents (GET)
router.get('/',  agentController.getAllAgents);

// Route pour obtenir un agent par ID (GET)
router.get('/:id', verifierToken, agentController.getAgentById);

// Route pour mettre à jour un agent (PUT)
router.put('/:id', verifierToken, agentController.updateAgent);

// Route pour supprimer un agent (DELETE)
router.delete('/:id', verifierToken, agentController.deleteAgent);

module.exports = router;