// controllers/agentController.js
const Agent = require('../model/agentModel');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

const agentController = {
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

  async createAgent(req, res) {
    try {
      const { nom, prenom, email, mot_de_passe, solde } = req.body;

      if (!nom || !prenom || !email || !mot_de_passe) {
        return res.status(400).json({
          success: false,
          message: 'Les champs nom, prénom, email et mot de passe sont obligatoires'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format d\'email invalide'
        });
      }

      if (mot_de_passe.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 6 caractères'
        });
      }

      const agent = new Agent();

      const existingAgent = await agent.findByEmail(email);
      if (existingAgent) {
        // Supprimer la photo téléchargée si l'email existe déjà
        if (req.file) {
          await fs.unlink(req.file.path).catch(err => console.error(err));
        }
        return res.status(409).json({
          success: false,
          message: 'Un agent avec cet email existe déjà'
        });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);

      const agentData = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.toLowerCase().trim(),
        mot_de_passe: hashedPassword,
        solde: solde || 0,
        photo: req.file ? req.file.filename : null
      };

      const nouvelAgent = await agent.createAgent(agentData);

      const { mot_de_passe: _, ...agentResponse } = nouvelAgent;

      res.status(201).json({
        success: true,
        message: 'Agent créé avec succès',
        data: agentResponse
      });

    } catch (error) {
      // Supprimer la photo en cas d'erreur
      if (req.file) {
        await fs.unlink(req.file.path).catch(err => console.error(err));
      }
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message 
      });
    }
  },

  async getAllAgents(req, res) {
    try {
      const agent = new Agent();
      const agents = await agent.getAllAgents();

      const agentsSansMotDePasse = agents.map(agent => {
        const { mot_de_passe, ...agentData } = agent;
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

  async updateAgent(req, res) {
    try {
      const { id } = req.params;
      const { nom, prenom, email } = req.body;

      // Validation des champs
      if (!nom && !prenom && !email && !req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucune donnée à mettre à jour'
        });
      }

      // Validation de l'email si fourni
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          // Supprimer la photo téléchargée si l'email est invalide
          if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error(err));
          }
          return res.status(400).json({
            success: false,
            message: 'Format d\'email invalide'
          });
        }

        // Vérifier si l'email n'est pas déjà utilisé par un autre agent
        const agent = new Agent();
        const existingAgent = await agent.findByEmail(email);
        
        if (existingAgent && existingAgent.id !== id) {
          // Supprimer la photo téléchargée si l'email existe déjà
          if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error(err));
          }
          return res.status(409).json({
            success: false,
            message: 'Cet email est déjà utilisé par un autre agent'
          });
        }
      }

      const agent = new Agent();
      
      // Récupérer l'ancienne photo si elle existe
      const agentActuel = await agent.getAgentById(id);
      if (!agentActuel) {
        // Supprimer la nouvelle photo si l'agent n'existe pas
        if (req.file) {
          await fs.unlink(req.file.path).catch(err => console.error(err));
        }
        return res.status(404).json({
          success: false,
          message: 'Agent introuvable'
        });
      }

      const updateData = {};
      if (nom) updateData.nom = nom.trim();
      if (prenom) updateData.prenom = prenom.trim();
      if (email) updateData.email = email.toLowerCase().trim();
      
      // Gestion de la photo
      if (req.file) {
        updateData.photo = req.file.filename;
        
        // Supprimer l'ancienne photo si elle existe
        if (agentActuel.photo) {
          const oldPhotoPath = path.join(__dirname, '../uploads', agentActuel.photo);
          await fs.unlink(oldPhotoPath).catch(err => 
            console.error('Erreur lors de la suppression de l\'ancienne photo:', err)
          );
        }
      }

      const updatedAgent = await agent.updateAgent(id, updateData);

      const { mot_de_passe, ...agentResponse } = updatedAgent;

      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: agentResponse
      });

    } catch (error) {
      // Supprimer la photo en cas d'erreur
      if (req.file) {
        await fs.unlink(req.file.path).catch(err => console.error(err));
      }
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { ancien_mot_de_passe, nouveau_mot_de_passe, confirmer_mot_de_passe } = req.body;

      if (!ancien_mot_de_passe || !nouveau_mot_de_passe || !confirmer_mot_de_passe) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs sont obligatoires'
        });
      }

      if (nouveau_mot_de_passe !== confirmer_mot_de_passe) {
        return res.status(400).json({
          success: false,
          message: 'Les mots de passe ne correspondent pas'
        });
      }

      if (nouveau_mot_de_passe.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
        });
      }

      const agent = new Agent();
      const agentData = await agent.getAgentByIdWithPassword(id);
      
      if (!agentData) {
        return res.status(404).json({
          success: false,
          message: 'Agent introuvable'
        });
      }

      const isPasswordValid = await bcrypt.compare(ancien_mot_de_passe, agentData.mot_de_passe);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Mot de passe actuel incorrect'
        });
      }

      const isSamePassword = await bcrypt.compare(nouveau_mot_de_passe, agentData.mot_de_passe);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: 'Le nouveau mot de passe doit être différent de l\'ancien'
        });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, saltRounds);

      const updatedAgent = await agent.updatePassword(id, hashedPassword);

      if (!updatedAgent) {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour du mot de passe'
        });
      }

      res.json({
        success: true,
        message: 'Mot de passe modifié avec succès'
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