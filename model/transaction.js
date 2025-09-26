// model/transactionModel.js
const mongoose = require('mongoose');
const Compte = require('./compteModel');
const Agent = require('./agentModel');

// Schéma pour les transactions
const transactionSchema = new mongoose.Schema({
  acteur_id: {
    type: String,
    required: true
  },
  acteur_type: {
    type: String,
    enum: ['agent', 'distributeur', 'client'],
    required: true
  },
  compte_id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit', 'transfert', 'retrait'],
    required: true
  },
  statut: {
    type: String,
    enum: ['terminée', 'annulée', 'en_cours'],
    default: 'en_cours'
  },
  montant: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: {
    createdAt: 'date_creation',
    updatedAt: 'date_modification'
  }
});

// Transformer _id → id
transactionSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const TransactionModel = mongoose.model('Transaction', transactionSchema, 'transactions');

class Transaction {
  constructor() {
    this.model = TransactionModel;
    this.compteModel = new Compte();
    this.agentModel = new Agent();
  }

  // Effectuer un transfert d'argent
  async effectuerTransfert(acteur_type, numero_compte_expediteur, numero_compte_destinataire, montant) {
    const session = await mongoose.startSession();
    let compteExpediteur = null;
    let compteDestinataire = null;

    try {
      await session.withTransaction(async () => {
        // Trouver les comptes
        if (acteur_type === 'agent') {
          compteExpediteur = await this.agentModel.getAgentById(numero_compte_expediteur);
        } else {
          compteExpediteur = await this.compteModel.findByAccountNumber(numero_compte_expediteur);
        }

        compteDestinataire = await this.compteModel.findByAccountNumber(numero_compte_destinataire);

        if (!compteExpediteur || !compteDestinataire) {
          throw new Error('Comptes introuvables');
        }

        const montantTotal = parseFloat(montant);

        // Vérifier le solde de l'expéditeur
        if (parseFloat(compteExpediteur.solde) < montantTotal) {
          throw new Error('Solde insuffisant');
        }

        // Mettre à jour les soldes
        const nouveauSoldeExpediteur = parseFloat(compteExpediteur.solde) - montantTotal;
        const nouveauSoldeDestinataire = parseFloat(compteDestinataire.solde) + montantTotal;

        if (acteur_type === 'agent') {
          // compteExpediteur.id (string) vient de getAgentById().id
          await this.agentModel.updateSolde(compteExpediteur.id, nouveauSoldeExpediteur);
        } else if (acteur_type === 'distributeur') {
          const bonus = montantTotal * 0.01;
          const nouveauSoldeAvecBonus = nouveauSoldeExpediteur + bonus;
          await this.compteModel.updateSolde(compteExpediteur.numero_compte, nouveauSoldeAvecBonus);
        } else {
          const frais = montantTotal * 0.02;
          const montantTotalAvecFrais = montantTotal + frais;

          if (parseFloat(compteExpediteur.solde) < montantTotalAvecFrais) {
            throw new Error('Solde insuffisant pour couvrir les frais de transfert');
          }

          const nouveauSoldeExpediteurAvecFrais = parseFloat(compteExpediteur.solde) - montantTotalAvecFrais;
          await this.compteModel.updateSolde(compteExpediteur.numero_compte, nouveauSoldeExpediteurAvecFrais);
        }

        await this.compteModel.updateSolde(compteDestinataire.numero_compte, nouveauSoldeDestinataire);

        // Enregistrer la transaction
        const transaction = new this.model({
          acteur_id: acteur_type === 'agent' ? compteExpediteur.id : compteExpediteur.numero_compte,
          acteur_type,
          compte_id: compteDestinataire.numero_compte,
          type: 'credit',
          statut: 'terminée',
          montant: montantTotal
        });

        await transaction.save({ session });
      });

      // après la transaction
      return {
        compte_expediteur_id: acteur_type === 'agent' ? (compteExpediteur ? compteExpediteur.id : null) : (compteExpediteur ? compteExpediteur.numero_compte : null),
        compte_destinataire_id: (compteDestinataire ? compteDestinataire.numero_compte : numero_compte_destinataire),
        type: 'transfert',
        montant,
        statut: 'terminée'
      };

    } catch (err) {
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // Effectuer un retrait (distributeur pour client seulement)
  async effectuerRetrait(numerocompte, numero_compte_client, montant) {
    const session = await mongoose.startSession();

    try {
      return await session.withTransaction(async () => {
        // Vérifier que c'est bien un distributeur
        const compteDistributeur = await this.compteModel.findByAccountNumber(numerocompte);
        if (!compteDistributeur) {
          throw new Error('Compte distributeur introuvable');
        }

        const compteClient = await this.compteModel.findByAccountNumber(numero_compte_client);
        if (!compteClient) {
          throw new Error('Compte client introuvable');
        }

        // Vérifier le solde du client
        if (parseFloat(compteClient.solde) < parseFloat(montant)) {
          throw new Error('Solde insuffisant sur le compte client');
        }

        // Calculer le bonus (1% pour les distributeurs)
        const bonus = parseFloat(montant) * 0.01;

        const nouveauSoldeClient = parseFloat(compteClient.solde) - parseFloat(montant);
        const nouveauSoldeDistributeur = parseFloat(compteDistributeur.solde) + parseFloat(montant) + bonus;

        // Mettre à jour les soldes
        await this.compteModel.updateSolde(compteClient.numero_compte, nouveauSoldeClient);
        await this.compteModel.updateSolde(compteDistributeur.numero_compte, nouveauSoldeDistributeur);

        // Enregistrer la transaction
        const transaction = new this.model({
          acteur_id: compteDistributeur.numero_compte,
          acteur_type: 'distributeur',
          compte_id: compteClient.numero_compte,
          type: 'retrait',
          statut: 'terminée',
          montant
        });

        await transaction.save({ session });

        return {
          compte_distributeur_id: compteDistributeur.numero_compte,
          compte_client_id: compteClient.numero_compte,
          type: 'retrait',
          montant,
          bonus,
          statut: 'terminée'
        };
      });

    } catch (err) {
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // Annuler un transfert (distributeur et agent peuvent le faire)
  async annulerTransfert(acteur_id, acteur_type, id) {
    const session = await mongoose.startSession();

    try {
      return await session.withTransaction(async () => {
        // Récupérer la transaction
        const transaction = await this.model.findOne({
          _id: id,
          statut: 'terminée'
        });

        if (!transaction) {
          throw new Error('Transfert introuvable ou déjà annulé');
        }

        if (acteur_type === 'distributeur') {
          const compteDest = await this.compteModel.findByAccountNumber(transaction.compte_id);

          if (transaction.type === "credit") {
            if (compteDest.solde < transaction.montant) {
              throw new Error('Le destinataire n\'a pas suffisamment de fonds');
            }

            const nouveauSolde = parseFloat(compteDest.solde) - parseFloat(transaction.montant);
            await this.compteModel.updateSolde(transaction.compte_id, nouveauSolde);

            const bonus = transaction.montant * 0.01;
            const nouveauSoldeDistributeur = parseFloat(transaction.montant) - parseFloat(bonus);

            const compteDistributeur = await this.compteModel.findByAccountNumber(acteur_id);
            const soldeDistributeurFinal = parseFloat(compteDistributeur.solde) + nouveauSoldeDistributeur;
            await this.compteModel.updateSolde(acteur_id, soldeDistributeurFinal);
          } else {
            const compteexp = await this.compteModel.findByAccountNumber(transaction.acteur_id);

            if (compteexp.solde < transaction.montant) {
              throw new Error('L\'expéditeur n\'a pas suffisamment de fonds');
            }

            const bonus = transaction.montant * 0.01;
            const nouveauSoldeExp = parseFloat(compteexp.solde) - bonus - parseFloat(transaction.montant);

            await this.compteModel.updateSolde(transaction.acteur_id, nouveauSoldeExp);

            const nouveauSoldeClient = parseFloat(compteDest.solde) + parseFloat(transaction.montant);
            await this.compteModel.updateSolde(transaction.compte_id, nouveauSoldeClient);
          }
        } else {
          // acteur_type != distributeur (agent ou client)
          if (transaction.acteur_id == acteur_id) {
            const compteDest = await this.compteModel.findByAccountNumber(transaction.compte_id);

            const nouveauSolde = parseFloat(compteDest.solde) - parseFloat(transaction.montant);
            await this.compteModel.updateSolde(transaction.compte_id, nouveauSolde);

            const agent = await this.agentModel.getAgentById(acteur_id);
            const nouveauSoldeAgent = parseFloat(agent.solde) + parseFloat(transaction.montant);
            await this.agentModel.updateSolde(acteur_id, nouveauSoldeAgent);
          } else {
            const compteexp = await this.compteModel.findByAccountNumber(transaction.acteur_id);
            const compteDest = await this.compteModel.findByAccountNumber(transaction.compte_id);

            const nouveauSolde = parseFloat(compteDest.solde) - parseFloat(transaction.montant);
            await this.compteModel.updateSolde(transaction.compte_id, nouveauSolde);

            const frais = transaction.montant * 0.02;
            const montantTotal = parseFloat(transaction.montant) + parseFloat(frais);
            const nouveauSoldeExp = parseFloat(compteexp.solde) + montantTotal;

            await this.compteModel.updateSolde(transaction.acteur_id, nouveauSoldeExp);
          }
        }

        // Marquer la transaction comme annulée
        await this.model.findByIdAndUpdate(id, { statut: 'annulée' }, { session });

        return {
          transaction_id: id,
          statut: 'annulé',
          annule_par: acteur_id,
          type_annulateur: acteur_type
        };
      });
    } catch (err) {
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // Obtenir l'historique d'un compte avec plus de détails
  async getTransactionsByCompte(acteur_id) {
    try {
      const transactions = await this.model.find({ acteur_id })
        .sort({ date_creation: -1 });
      return transactions.map(t => t.toJSON());
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des transactions: ${error.message}`);
    }
  }

  // Obtenir l'historique de toutes les transactions
  async getAllTransactions() {
    try {
      const transactions = await this.model.find({})
        .sort({ date_creation: -1 });
      return transactions.map(t => t.toJSON());
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de toutes les transactions: ${error.message}`);
    }
  }
}

module.exports = Transaction;
