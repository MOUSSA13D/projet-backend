const Agent = require('../model/agentModel');
const { findById, verifyPassword } = require('../model/utilisateurModel');
const Compte = require('../model/compteModel');

async function login(req, res) {
  const { identifiant, mot_de_passe } = req.body;
  const agentModel = new Agent();

  if (!identifiant || !mot_de_passe) {
    return res.status(400).json({ success: false, message: 'Identifiant et mot de passe requis' });
  }

  try {
    if (identifiant.includes('@')) {
      // === Authentification Agent par email ===
      const agent = await agentModel.findByEmail(identifiant);

      if (mot_de_passe !== agent.mot_de_passe) {
        return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
      }

      const { mot_de_passe: _, ...agentSansMotDePasse } = agent;
      return res.json({ success: true, type: 'agent', data: agentSansMotDePasse });
    } else {
      // === Authentification Utilisateur par numéro de compte ===
      const compteModel = new Compte();
      const compte = await compteModel.findByAccountNumber(identifiant);
      if (!compte) {
        return res.status(401).json({ success: false, message: 'Numéro de compte ou mot de passe incorrect' });
      }

      const utilisateur = await findById(compte.utilisateur_id);
      if (!utilisateur || !(await verifyPassword(mot_de_passe, utilisateur.mot_de_passe))) {
        return res.status(401).json({ success: false, message: 'Numéro de compte ou mot de passe incorrect' });
      }
      const { mot_de_passe: _, ...utilisateurSansMotDePasse } = utilisateur;
      return res.json({ success: true, type: 'utilisateur', data: utilisateurSansMotDePasse, compte: compte });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { login };
