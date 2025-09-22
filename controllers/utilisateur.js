

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



function generateRandomPassword(length = 6) {
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


  // Créer un utilisateur  Distributeur ou client
  async createUser(req, res) {
    try {
      const { nom, prenom, email, cni, telephone, naissance, role } = req.body;

      if (!nom || !prenom || !email || !cni || !telephone || !naissance || !role) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
      }

          // Vérifier qu’une photo a bien été envoyée
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'La photo est requise' });
    }

      const existingUser = await findByEmail(email);
      if (existingUser) return res.status(409).json({ success: false, message: 'Email déjà utilisé' });

      

        // Mot de passe aléatoire
    const mot_de_passe = generateRandomPassword(6);

    // Créer l’utilisateur avec le chemin de la photo
    const nouvelUtilisateur = await createUser({
      nom,
      prenom,
      email,
      mot_de_passe,
      cni,
      telephone,
      naissance,
      role,
      photo: req.file.filename  // On sauvegarde juste le nom de fichier
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
}

};

module.exports = utilisateurController;