const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { findByEmail } = require('../model/utilisateurModel');

const genererToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

async function login(req, res) {
  try {
    const { identifiant, mot_de_passe } = req.body;

    if (!identifiant || !mot_de_passe) {
      return res.status(400).json({ 
        success: false, 
        message: 'Identifiant et mot de passe requis.' 
      });
    }

    const utilisateur = await findByEmail(identifiant);

    if (!utilisateur) {
      return res.status(401).json({ 
        success: false, 
        message: 'Identifiant ou mot de passe incorrect' 
      });
    }

    const passwordOk = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!passwordOk) {
      return res.status(401).json({ 
        success: false, 
        message: 'Identifiant ou mot de passe incorrect' 
      });
    }

    const token = genererToken(utilisateur._id, utilisateur.role);

    // ✅ Réponse correcte avec la structure attendue par le frontend
    res.status(200).json({
      success: true,
      token,
      type: utilisateur.role, // ✅ Ajouter le type (role)
      data: {
        id: utilisateur._id,
        identifiant: utilisateur.identifiant,
        role: utilisateur.role
      }
    });

  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
}

module.exports = { login };