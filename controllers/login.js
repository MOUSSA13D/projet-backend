const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { findByEmail, findById, verifyPassword } = require('../model/utilisateurModel');
const Compte = require('../model/compteModel');
const Agent = require('../model/agentModel');

// Générer un token JWT
const genererToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

async function login(req, res) {
  const { identifiant, mot_de_passe } = req.body;

  if (!identifiant || !mot_de_passe) {
    return res.status(400).json({ success: false, message: 'Identifiant et mot de passe requis.' });
  }

  try {
    // === 1️⃣ Authentification Agent (par email) ===
    if (identifiant.includes('@')) {
      const agentModel = new Agent();
      const agent = await agentModel.findByEmail(identifiant);
      if (!agent) {
        return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
      }

      if (mot_de_passe !== agent.mot_de_passe) {
        return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
      }

      const { mot_de_passe: _, ...agentSansMotDePasse } = agent;
      return res.json({
        success: true,
        type: 'agent',
        data: agentSansMotDePasse,
        token: genererToken(agent.id, 'agent'),
      });
    }

    // === 2️⃣ Authentification Utilisateur (par numéro de compte) ===
    const compteModel = new Compte();
    const compte = await compteModel.findByAccountNumber(identifiant);
    if (!compte) {
      return res.status(401).json({ success: false, message: 'Numéro de compte ou mot de passe incorrect.' });
    }

    const utilisateur = await findById(compte.utilisateur_id);
    if (!utilisateur) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    // Vérifier le statut
    if (utilisateur.statut === 'bloqué') {
      return res.status(403).json({ success: false, message: 'Votre compte est bloqué. Contactez l’administrateur.' });
    }

    // Vérification du mot de passe
    const motDePasseValide = await verifyPassword(mot_de_passe, utilisateur.mot_de_passe);
    if (!motDePasseValide) {
      return res.status(401).json({ success: false, message: 'Numéro de compte ou mot de passe incorrect.' });
    }

    const { mot_de_passe: _, ...utilisateurSansMotDePasse } = utilisateur;

    res.json({
      success: true,
      type: utilisateur.role,
      data: utilisateurSansMotDePasse,
      compte,
      token: genererToken(utilisateur.id, utilisateur.role),
    });
  } catch (err) {
    console.error('Erreur lors de la connexion :', err.message);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
}



module.exports = { login };
