const jwt = require('jsonwebtoken');
const { findById } = require('../model/utilisateurModel');
const Agent = require('../model/agentModel');

// Middleware de vérification du token
const verifierToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Accès non autorisé : token manquant.' });
  }

  try {
    // Décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔧 SOLUTION : Gérer les agents ET les utilisateurs
    if (decoded.role === 'agent') {
      // === Vérification pour les agents ===
      const agentModel = new Agent();
      const agent = await agentModel.getAgentById(decoded.id);
      
      if (!agent) {
        return res.status(404).json({ message: 'Agent introuvable.' });
      }
      console.log('✅ Agent trouvé dans le middleware auth:', decoded);

      // Les agents n'ont pas de statut "bloqué" dans votre modèle
      // Mais vous pourriez ajouter cette logique si nécessaire

      // Ajouter les infos de l'agent dans la requête
      req.utilisateur = {
        id: agent.id,
        role: 'agent',
        nom: agent.nom,
        prenom: agent.prenom,
        email: agent.email
      };

    } else {
      // === Vérification pour les utilisateurs ===
      const utilisateur = await findById(decoded.id);
      if (!utilisateur) {
        return res.status(404).json({ message: 'Utilisateur introuvable.' });
      }

      // Vérifier le statut (bloqué)
      if (utilisateur.statut === 'bloqué') {
        return res.status(403).json({ message: 'Votre compte est bloqué. Contactez l administrateur.' });
      }

      // Ajouter les infos de l'utilisateur dans la requête
      req.utilisateur = {
        id: utilisateur.id,
        role: utilisateur.role,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
      };
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré. Veuillez vous reconnecter.' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide.' });
    } else {
      console.error('Erreur middleware auth:', err);
      return res.status(500).json({ message: 'Erreur interne lors de la vérification du token.' });
    }
  }
};

module.exports = { verifierToken };