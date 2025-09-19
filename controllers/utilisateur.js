

// ============================================================================
// controllers/utilisateurController.js
const { 
  createUser, 
  findByEmail, 
  findById, 
  // verifyPassword, 
  updateStatus, 
  getAllUsers, 
  updateUser 
} = require('../model/utilisateurModel');
const nodemailer = require('nodemailer');
const Compte = require('../model/compteModel');
const crypto = require('crypto');

function generateRandomPassword(length = 8) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

async function sendAccountEmail(email, nom, prenom, numeroCompte, motDePasse) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'fvdiliuwade@gmail.com',
      pass: 'udjw eykf thgt cxqx'
    }
  });

  const mailOptions = {
    from: 'fvdiliuwade@gmail.com',
    to: email,
    subject: 'Bienvenue ! Votre compte a été créé',
    text: `Bonjour ${prenom} ${nom},\n\nVotre compte a été créé avec succès.\nNuméro de compte : ${numeroCompte}\nMot de passe : ${motDePasse}\n\nMerci.`
  };

  await transporter.sendMail(mailOptions);
}


const utilisateurController = {
  // Créer un utilisateur
  async createUser(req, res) {
    try {
      const { nom, prenom, email, cni, telephone, naissance, role } = req.body;

      if (!nom || !prenom || !email || !cni || !telephone || !naissance || !role) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
      }

      const existingUser = await findByEmail(email);
      if (existingUser) return res.status(409).json({ success: false, message: 'Email déjà utilisé' });

      // Générer un mot de passe aléatoire
      const mot_de_passe = generateRandomPassword(8);

      const nouvelUtilisateur = await createUser({ nom, prenom, email, mot_de_passe, cni, telephone, naissance, role });

      // Créer automatiquement le compte
      const compteModel = new Compte();
      const nouveauCompte = await compteModel.createCompte(nouvelUtilisateur.id);

      // Envoyer le mot de passe et le numéro de compte par email
      await sendAccountEmail(email, nom, prenom, nouveauCompte.numero_compte, mot_de_passe);

      res.status(201).json({
        success: true,
        message: 'Utilisateur et compte créés avec succès, email envoyé',
        data: {
          utilisateur: nouvelUtilisateur,
          compte: nouveauCompte
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },



  // Connexion
  // async login(req, res) {
  //   try {
  //     const { numcompte, mot_de_passe } = req.body;

  //     if (!numcompte || !mot_de_passe) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Email et mot de passe requis'
  //       });
  //     }

  //      const compteModel = new Compte();
  //     const compte = await compteModel.findByAccountNumber(numcompte);
  //     if (!compte) {
  //       return res.status(401).json({
  //         success: false,
  //         message: 'Numéro de compte ou mot de passe incorrect'
  //       });
  //     }


  //     const utilisateur = await findById(compte.utilisateur_id);
  //     if (!utilisateur) {
  //       return res.status(401).json({
  //         success: false,
  //         message: 'Numéro de compte ou mot de passe incorrect'
  //       });
  //     }

  //     const motDePasseValide = await verifyPassword(mot_de_passe, utilisateur.mot_de_passe);
  //     if (!motDePasseValide) {
  //       return res.status(401).json({
  //         success: false,
  //         message: 'Numéro de compte ou mot de passe incorrect'
  //       });
  //     }

  //     // Retirer le mot de passe de la réponse
  //     const { mot_de_passe: _, ...utilisateurSansMotDePasse } = utilisateur;

  //     res.json({
  //       success: true,
  //       message: 'Connexion réussie',
  //       data: utilisateurSansMotDePasse
  //     });
  //   } catch (error) {
  //     res.status(500).json({ success: false, message: error.message });
  //   }
  // },

  // Obtenir tous les utilisateurs
  async getAllUsers(req, res) {
    try {
      const utilisateurs = await getAllUsers();
      res.json({ success: true, data: utilisateurs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Obtenir un utilisateur par ID
  async getUserById(req, res) {
    try {
      const utilisateur = await findById(req.params.id);
      
      if (!utilisateur) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable'
        });
      }

      // Retirer le mot de passe
      const { mot_de_passe: _, ...utilisateurSansMotDePasse } = utilisateur;

      res.json({ success: true, data: utilisateurSansMotDePasse });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Mettre à jour le statut
  async updateStatus(req, res) {
    try {
      const { statut } = req.body;

      if (!['actif', 'suspendu', 'inactif'].includes(statut)) {
        return res.status(400).json({
          success: false,
          message: 'Statut invalide'
        });
      }

      const updated = await updateStatus(req.params.id, statut);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable'
        });
      }

      res.json({
        success: true,
        message: 'Statut mis à jour',
        data: { nouveauStatut: statut }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Mettre à jour un utilisateur
  async updateUser(req, res) {
    try {
      const { nom, prenom, telephone } = req.body;

      if (!nom || !prenom || !telephone) {
        return res.status(400).json({
          success: false,
          message: 'Nom, prénom et téléphone requis'
        });
      }

      const updated = await updateUser(req.params.id, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable'
        });
      }

      res.json({
        success: true,
        message: 'Utilisateur mis à jour avec succès'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = utilisateurController;