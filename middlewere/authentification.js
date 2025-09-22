const jwt = require('jsonwebtoken');
const { findById } = require('../model/utilisateurModel');

// Middleware de vérification du token
const verifierToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Accès non autorisé : token manquant.' });
  }

  try {
    // Décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur
    const utilisateur = await findById(decoded.id);
    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    // Vérifier le statut (bloqué)
    if (utilisateur.statut === 'bloqué') {
      return res.status(403).json({ message: 'Votre compte est bloqué. Contactez l’administrateur.' });
    }

    // Ajouter les infos de l'utilisateur dans la requête
    req.utilisateur = {
      id: utilisateur.id,
      role: utilisateur.role,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré. Veuillez vous reconnecter.' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide.' });
    } else {
      return res.status(500).json({ message: 'Erreur interne lors de la vérification du token.' });
    }
  }
};

module.exports = { verifierToken };
