// ============================================================================
// controllers/utilisateurController.js
const { 
  createUser, 
  findByEmail, 
  findById, 
  verifyPassword, 
  updateStatus, 
  getAllUsers, 
  updateUser,
  updatePassword
} = require('../model/utilisateurModel');

const nodemailer = require('nodemailer');
const Compte = require('../model/compteModel');
const crypto = require('crypto');

function generateRandomPassword(length = 6) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

async function sendAccountEmail(email, nom, prenom, numeroCompte, motDePasse) {
  const transporter = nodemailer.createTransporter({
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

async function sendResetPasswordEmail(email, nom, prenom, nouveauMotDePasse) {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: 'fvdiliuwade@gmail.com',
      pass: 'udjw eykf thgt cxqx'
    }
  });

  const mailOptions = {
    from: 'fvdiliuwade@gmail.com',
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    text: `Bonjour ${prenom} ${nom},\n\nVotre mot de passe a été réinitialisé avec succès.\nVotre nouveau mot de passe : ${nouveauMotDePasse}\n\nPour votre sécurité, nous vous recommandons de changer ce mot de passe après votre première connexion.\n\nMerci.`
  };

  await transporter.sendMail(mailOptions);
}

const utilisateurController = {

  // Créer un utilisateur Distributeur ou client
  async createUser(req, res) {
    try {
      const { nom, prenom, email, cni, telephone, naissance, role } = req.body;

      if (!nom || !prenom || !email || !cni || !telephone || !naissance || !role) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
      }

      // Vérifier qu'une photo a bien été envoyée
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'La photo est requise' });
      }

      const existingUser = await findByEmail(email);
      if (existingUser) return res.status(409).json({ success: false, message: 'Email déjà utilisé' });

      // Mot de passe aléatoire
      const mot_de_passe = generateRandomPassword(6);

      // Créer l'utilisateur avec le chemin de la photo
      const nouvelUtilisateur = await createUser({
        nom,
        prenom,
        email,
        mot_de_passe,
        cni,
        telephone,
        naissance,
        role,
        photo: req.file.filename
      });

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

      if (!['actif', 'bloqué'].includes(statut)) {
        return res.status(400).json({
          success: false,
          message: 'Statut invalide'
        });
      }

      const updated = await updateStatus(req.params.id, statut);

      // Changer le statut du compte associé
      const compteModel = new Compte();
      const nouveauCompte = await compteModel.updateStatut(req.params.id, statut);

      if (!updated && !nouveauCompte) {
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
      const { nom, prenom, telephone, email, cni } = req.body;

      if (!nom || !prenom || !telephone || !email || !cni) {
        return res.status(400).json({
          success: false,
          message: 'Nom, prénom, téléphone, email et CNI sont requis'
        });
      }

      // Rendre la photo facultative : on utilise req.file seulement si fourni
      const userData = {
        nom,
        prenom,
        telephone,
        email,
        cni,
        photo: req.file ? req.file.filename : undefined
      };

      const updated = await updateUser(req.params.id, userData);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
      }

      res.json({ success: true, message: 'Utilisateur mis à jour avec succès' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Mot de passe oublié
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'L\'email est requis'
        });
      }

      // Vérifier si l'utilisateur existe
      const utilisateur = await findByEmail(email);
      if (!utilisateur) {
        return res.status(404).json({
          success: false,
          message: 'Aucun compte associé à cet email'
        });
      }

      // Générer un nouveau mot de passe aléatoire
      const nouveauMotDePasse = generateRandomPassword(6);

      // Mettre à jour le mot de passe dans la base de données
      const updated = await updatePassword(utilisateur.id, nouveauMotDePasse);

      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour du mot de passe'
        });
      }

      // Envoyer le nouveau mot de passe par email
      await sendResetPasswordEmail(email, utilisateur.nom, utilisateur.prenom, nouveauMotDePasse);

      res.json({
        success: true,
        message: 'Un nouveau mot de passe a été envoyé à votre adresse email'
      });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Changer mot de passe
  async changePassword(req, res) {
    try {
      const { ancienMotDePasse, nouveauMotDePasse } = req.body;
      const userId = req.params.id;

      if (!ancienMotDePasse || !nouveauMotDePasse) {
        return res.status(400).json({
          success: false,
          message: 'L\'ancien et le nouveau mot de passe sont requis'
        });
      }

      if (nouveauMotDePasse.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
        });
      }

      // Vérifier si l'utilisateur existe
      const utilisateur = await findById(userId);
      if (!utilisateur) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable'
        });
      }

      // Vérifier l'ancien mot de passe
      const isValidPassword = await verifyPassword(ancienMotDePasse, utilisateur.mot_de_passe);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'L\'ancien mot de passe est incorrect'
        });
      }

      // Mettre à jour avec le nouveau mot de passe
      const updated = await updatePassword(userId, nouveauMotDePasse);

      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour du mot de passe'
        });
      }

      res.json({
        success: true,
        message: 'Mot de passe changé avec succès'
      });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

};

module.exports = utilisateurController;