

const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent');

// router.post('/login', agentController.login);
router.get('/:id/solde', agentController.getSolde);
// Route pour obtenir un agent par ID
router.get('/:id', agentController.getAgentById);

module.exports = router;


