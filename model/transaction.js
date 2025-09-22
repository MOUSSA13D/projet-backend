// models/transactionModel.js
const { getDB } = require('../config/basedonne');
const Compte = require('./compteModel');
const Agent = require('./agentModel');

class Transaction {
  constructor() {
    this.compteModel = new Compte();
    this.agentModel = new Agent();
  }

  // Effectuer un transfert d'argent
  async effectuerTransfert(acteur_type, numero_compte_expediteur, numero_compte_destinataire, montant) {
    const pool = getDB();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Trouver les comptes
      let compteExpediteur;
      if (acteur_type == 'agent') {
        
        compteExpediteur = await this.agentModel.getAgentById(numero_compte_expediteur);

      } else {
        compteExpediteur = await this.compteModel.findByAccountNumber(numero_compte_expediteur);
      }

      const compteDestinataire = await this.compteModel.findByAccountNumber(numero_compte_destinataire);

      if (!compteExpediteur || !compteDestinataire) {
        throw new Error('Comptes introuvables');
      }

      const montantTotal = parseFloat(montant);

      // Vérifier le solde de l'expéditeur
      if (compteExpediteur.solde < montantTotal) {
        throw new Error('Solde insuffisant');
      }

      // Mettre à jour les soldes
      const nouveauSoldeExpediteur = parseFloat(compteExpediteur.solde) - montantTotal;
      const nouveauSoldeDestinataire = parseFloat(compteDestinataire.solde) + parseFloat(montant);

      if (acteur_type == 'agent') {

        await this.agentModel.updateSolde(compteExpediteur.id, nouveauSoldeExpediteur);

      } 

      else  if(acteur_type == 'distributeur')
        {

          const bonus = montantTotal * 0.01;
          const nouveauSoldeAvecBonus = nouveauSoldeExpediteur + bonus;
        
         await this.compteModel.updateSolde(compteExpediteur.numero_compte, nouveauSoldeAvecBonus);


        }

        else{
          
          const frais = montant * 0.02;
          const montantTotalAvecFrais = montantTotal + frais;

          if (compteExpediteur.solde < montantTotalAvecFrais) {
            throw new Error('Solde insuffisant pour couvrir les frais de transfert');
          }

          const nouveauSoldeExpediteurAvecFrais = parseFloat(compteExpediteur.solde) - montantTotalAvecFrais;

          await this.compteModel.updateSolde(compteExpediteur.numero_compte, nouveauSoldeExpediteurAvecFrais);

        
        }
   
        await this.compteModel.updateSolde(compteDestinataire.numero_compte, nouveauSoldeDestinataire);


      // Enregistrer la transaction (virgule supprimée)
    await connection.execute(
  `INSERT INTO transactions (acteur_id, acteur_type, compte_id, type, statut, montant)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [
    acteur_type == 'agent' ? compteExpediteur.id : compteExpediteur.numero_compte,
    acteur_type,
    compteDestinataire.numero_compte,
    'credit',
    'terminée',
    montant
  ]
);

      await connection.commit();

      return {
        compte_expediteur_id:  acteur_type == 'agent' ? compteExpediteur.id : compteExpediteur.numero_compte,
        compte_destinataire_id: compteDestinataire.numero_compte,
        type: 'transfert',
        montant,
        statut: 'terminée'
      };

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }




  // Effectuer un retrait (distributeur pour client seulement)
  async effectuerRetrait(numerocompte, numero_compte_client, montant) {
    const pool = getDB();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

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
      if (compteClient.solde < montant) {
        throw new Error('Solde insuffisant sur le compte client');
      }


      // Calculer le bonus (1% pour les distributeurs)
      const bonus = montant * 0.01;

      const nouveauSoldeClient = parseFloat(compteClient.solde) - parseFloat(montant);

      const nouveauSoldeDistributeur = parseFloat(compteDistributeur.solde) + parseFloat(montant) + parseFloat(bonus);


      // Mettre à jour les soldes
      await connection.execute('UPDATE comptes SET solde = ? WHERE numero_compte = ?', 
        [nouveauSoldeClient, compteClient.numero_compte]);
      
      await connection.execute('UPDATE comptes SET solde = ? WHERE numero_compte = ?', 
        [nouveauSoldeDistributeur, compteDistributeur.numero_compte]);


      // Enregistrer la transaction (guillemets ajoutés pour 'terminée')
      const [result] = await connection.execute(
        `INSERT INTO transactions (acteur_id, acteur_type, compte_id, type, statut, montant)
         VALUES (?, 'distributeur', ?, 'retrait', 'terminée', ?)`,
        [compteDistributeur.numero_compte, compteClient.numero_compte, montant]
      );

      await connection.commit();

      return {
        compte_distributeur_id: compteDistributeur.numero_compte,
        compte_client_id: compteClient.numero_compte,
        type: 'retrait',
        montant,
        bonus,
        statut: 'terminée'
      };

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }







  // Annuler un transfert (distributeur et agent peuvent le faire)
  async annulerTransfert(acteur_id, acteur_type, id) {
    const pool = getDB();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Récupérer les transactions du transfert
      const [transactions] = await connection.execute(
        'SELECT * FROM transactions WHERE id = ? AND statut = "terminée"',
        [id]
      );

      if (transactions.length === 0) {
        throw new Error('Transfert introuvable ou déjà annulé');
      }

      const transaction = transactions[0];

      if (acteur_type == 'distributeur') {

        const [compteDest] = await connection.execute('SELECT solde FROM comptes WHERE numero_compte = ?', 
          [transaction.compte_id]);

          
        if (transaction.type === "credit") {

          if (compteDest[0].solde < transaction.montant) {
            throw new Error('Le destinataire n\'a pas suffisamment de fonds');
          }

          const nouveauSolde = parseFloat(compteDest[0].solde) - parseFloat(transaction.montant);
          
          await connection.execute('UPDATE comptes SET solde = ? WHERE numero_compte = ?', 
            [nouveauSolde, transaction.compte_id]);

            const bonus = transaction.montant * 0.01;

           
            const nouveauSoldeDistributeur =   parseFloat(transaction.montant) - parseFloat(bonus);

            await connection.execute('UPDATE comptes SET solde = solde + ? WHERE numero_compte = ?',
            [nouveauSoldeDistributeur, acteur_id]);


        } else {

            const [compteexp] = await connection.execute('SELECT solde FROM comptes WHERE numero_compte = ?',
            [transaction.acteur_id]);

            if (compteexp[0].solde < transaction.montant) {
              throw new Error('L\'expéditeur n\'a pas suffisamment de fonds');
            }

             const bonus = transaction.montant * 0.01;
            const frais = parseFloat(compteexp[0].solde) - bonus


            const nouveauSoldeExp = frais - parseFloat(transaction.montant);


            await connection.execute('UPDATE comptes SET solde = ? WHERE numero_compte = ?',
            [nouveauSoldeExp, transaction.acteur_id]);

            await connection.execute('UPDATE comptes SET solde = solde + ? WHERE numero_compte = ?',
            [transaction.montant, transaction.compte_id]);
        }

    
      } 
      else {

        if (transaction.acteur_id == acteur_id) {
          const [compteDest] = await connection.execute('SELECT solde FROM comptes WHERE numero_compte = ?', 
            [transaction.compte_id]);

          const nouveauSolde = parseFloat(compteDest[0].solde) - parseFloat(transaction.montant);
          
          await connection.execute('UPDATE comptes SET solde = ? WHERE numero_compte = ?', 
            [nouveauSolde, transaction.compte_id]);

          await connection.execute('UPDATE agents SET solde = solde + ? WHERE id = ?',
            [transaction.montant, acteur_id]);
        } else {
          const [compteexp] = await connection.execute('SELECT solde FROM comptes WHERE numero_compte = ?', 
            [transaction.acteur_id]);

          const [compteDest] = await connection.execute('SELECT solde FROM comptes WHERE numero_compte = ?', 
            [transaction.compte_id]);

          const nouveauSolde = parseFloat(compteDest[0].solde) - parseFloat(transaction.montant);

          await connection.execute('UPDATE comptes SET solde = ? WHERE numero_compte = ?',
            [nouveauSolde, transaction.compte_id]);

          
          const frais = transaction.montant * 0.02;
          const montantTotal = parseFloat(transaction.montant) + parseFloat(frais);
          const nouveauSoldeExp = parseFloat(compteexp[0].solde) + montantTotal;

          await connection.execute('UPDATE comptes SET solde = ? WHERE numero_compte = ?',
            [nouveauSoldeExp, transaction.acteur_id]);


        }
      }

      // Marquer les transactions comme annulées
      await connection.execute(
        'UPDATE transactions SET statut = "annulée" WHERE id = ?',
        [id]
      );

      await connection.commit();

      return {
        transaction_id: id,
        statut: 'annulé',
        annule_par: acteur_id,
        type_annulateur: acteur_type
      };

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }



  // Obtenir l'historique d'un compte avec plus de détails
  async getTransactionsByCompte(acteur_id) {
    const db = getDB();
    const query = `SELECT * FROM transactions WHERE acteur_id = ? ORDER BY date_creation DESC`;
    const [rows] = await db.execute(query, [acteur_id]);
    return rows;
  }

  
}

module.exports = Transaction;