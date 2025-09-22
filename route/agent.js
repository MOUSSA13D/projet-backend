

const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent');
const {verifierToken} = require('../middlewere/authentification');
// router.get('/:id/solde', agentController.getSolde);
// Route pour obtenir un agent par ID
router.get('/:id', verifierToken,  agentController.getAgentById);

module.exports = router;


