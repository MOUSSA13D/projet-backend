// controllers/agent.js
const Agent = require('../model/agentModel');
const bcrypt = require('bcrypt');

const agentController = {
  // Méthode existante
  async getAgentById(req, res) {
    try {
      const agent = new Agent();
      const agentData = await agent.getAgentById(req.params.id);
      
      if (!agentData) {
        return res.status(404).json({ 
          success: false, 
          message: 'Agent introuvable' 
        });
      }
      
      // Supprimer le mot de passe de la réponse
      const { mot_de_passe, ...agentSansMotDePasse } = agentData;
      
      res.json({ 
        success: true, 
        data: agentSansMotDePasse 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  // Nouvelle méthode pour créer un agent
  async createAgent(req, res) {
    try {
      const { nom, prenom, email, mot_de_passe, solde } = req.body;

      // Validation des données requises
      if (!nom || !prenom || !email || !mot_de_passe) {
        return res.status(400).json({
          success: false,
          message: 'Les champs nom, prénom, email et mot de passe sont obligatoires'
        });
      }

      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format d\'email invalide'
        });
      }

      // Validation du mot de passe (minimum 6 caractères)
      if (mot_de_passe.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 6 caractères'
        });
      }

      const agent = new Agent();

      // Vérifier si l'email existe déjà
      const existingAgent = await agent.findByEmail(email);
      if (existingAgent) {
        return res.status(409).json({
          success: false,
          message: 'Un agent avec cet email existe déjà'
        });
      }

      // Hacher le mot de passe
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);

      // Préparer les données de l'agent
      const agentData = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.toLowerCase().trim(),
        mot_de_passe: hashedPassword,
        solde: solde || 0
      };

      // Créer l'agent
      const nouvelAgent = await agent.createAgent(agentData);

      // Supprimer le mot de passe de la réponse
      const { mot_de_passe: _, ...agentResponse } = nouvelAgent.toObject();

      res.status(201).json({
        success: true,
        message: 'Agent créé avec succès',
        data: agentResponse
      });

    } catch (error) {
      // Gestion des erreurs de validation MongoDB
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Erreur de validation',
          errors: errors
        });
      }

      // Gestion des erreurs de duplication (email unique)
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Un agent avec cet email existe déjà'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Méthode pour obtenir tous les agents
  async getAllAgents(req, res) {
    try {
      const agent = new Agent();
      const agents = await agent.getAllAgents();

      // Supprimer les mots de passe de la réponse
      const agentsSansMotDePasse = agents.map(agent => {
        const { mot_de_passe, ...agentData } = agent.toObject();
        return agentData;
      });

      res.json({
        success: true,
        data: agentsSansMotDePasse,
        count: agentsSansMotDePasse.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Méthode pour mettre à jour un agent
  async updateAgent(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Supprimer les champs qui ne doivent pas être mis à jour directement
      delete updateData.mot_de_passe;
      delete updateData._id;
      delete updateData.__v;

      const agent = new Agent();
      const updatedAgent = await agent.updateAgent(id, updateData);

      if (!updatedAgent) {
        return res.status(404).json({
          success: false,
          message: 'Agent introuvable'
        });
      }

      // Supprimer le mot de passe de la réponse
      const { mot_de_passe, ...agentResponse } = updatedAgent.toObject();

      res.json({
        success: true,
        message: 'Agent mis à jour avec succès',
        data: agentResponse
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Méthode pour supprimer un agent
  async deleteAgent(req, res) {
    try {
      const { id } = req.params;

      const agent = new Agent();
      const deleted = await agent.deleteAgent(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Agent introuvable'
        });
      }

      res.json({
        success: true,
        message: 'Agent supprimé avec succès'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = agentController;