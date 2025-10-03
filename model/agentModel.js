// model/agentModel.js
const mongoose = require('mongoose');

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
  },
  photo: {
    type: String,
    default: null
  }
}, {
  timestamps: {
    createdAt: 'date_creation',
    updatedAt: 'date_modification'
  }
});

agentSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

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

  async getAgentByIdWithPassword(id) {
    try {
      const agent = await this.model.findById(id).select('+mot_de_passe');
      if (!agent) return null;
      
      return {
        id: agent._id.toString(),
        nom: agent.nom,
        prenom: agent.prenom,
        email: agent.email,
        mot_de_passe: agent.mot_de_passe,
        solde: agent.solde,
        photo: agent.photo,
        date_creation: agent.date_creation,
        date_modification: agent.date_modification
      };
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

  async updatePassword(id, hashedPassword) {
    try {
      const result = await this.model.findByIdAndUpdate(
        id,
        { mot_de_passe: hashedPassword },
        { new: true }
      );
      return result ? result.toJSON() : null;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du mot de passe: ${error.message}`);
    }
  }
}

module.exports = Agent;