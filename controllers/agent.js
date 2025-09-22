

  const Agent = require('../model/agentModel');
const agentModel = new Agent();

const agentController = {


   async getAgentById(req, res) {
    try {
      const agent = new Agent();
      const agentData = await agent.getAgentById(req.params.id);
      
      if (!agentData) {
        return res.status(404).json({ success: false, message: 'Agent introuvable' });
      }
      
      res.json({ success: true, data: agentData });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },





};

module.exports = agentController;
