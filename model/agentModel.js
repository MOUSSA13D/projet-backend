// model/agentModel.js
const mongoose = require('mongoose');

// Schéma pour l'agent
const agentSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mot_de_passe: {
    type: String,
    required: true
  },
  solde: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: { 
    createdAt: 'date_creation',
    updatedAt: 'date_modification' 
  }
});

// Transformer automatiquement _id en id
agentSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Modèle Agent
const AgentModel = mongoose.model('Agent', agentSchema, 'agents');

class Agent {
  constructor() {
    this.model = AgentModel;
  }

  async getAgentById(id) {
    try {
      const agent = await this.model.findById(id);
      return agent ? agent.toJSON() : null;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'agent: ${error.message}`);
    }
  }

  async getAllAgents() {
    try {
      const agents = await this.model.find({});
      return agents.map(agent => agent.toJSON());
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des agents: ${error.message}`);
    }
  }

  async findByEmail(email) {
    try {
      const agent = await this.model.findOne({ email: email.toLowerCase() });
      return agent ? agent.toJSON() : null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche par email: ${error.message}`);
    }
  }

  async updateSolde(id, nouveauSolde) {
    try {
      const result = await this.model.findByIdAndUpdate(
        id, 
        { solde: nouveauSolde },
        { new: true }
      );
      return result ? result.toJSON() : null;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du solde: ${error.message}`);
    }
  }

  async createAgent(agentData) {
    try {
      const agent = new this.model(agentData);
      const savedAgent = await agent.save();
      return savedAgent.toJSON();
    } catch (error) {
      throw new Error(`Erreur lors de la création de l'agent: ${error.message}`);
    }
  }

  async updateAgent(id, updateData) {
    try {
      const result = await this.model.findByIdAndUpdate(
        id, 
        updateData,
        { new: true, runValidators: true }
      );
      return result ? result.toJSON() : null;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de l'agent: ${error.message}`);
    }
  }

  async deleteAgent(id) {
    try {
      const result = await this.model.findByIdAndDelete(id);
      return result ? result.toJSON() : null;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de l'agent: ${error.message}`);
    }
  }
}

module.exports = Agent;
