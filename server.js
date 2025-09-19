const express = require('express');
const { connectDB } = require('./config/basedonne.js');
const cors = require('cors');
const path = require('path');


// Connexion à MySQL
connectDB();

const app = express();
app.use(express.json());
app.use(cors());



app.use('/api/agent', require('./route/agent'));
app.use('/api/utilisateur', require('./route/utilisateurRoutes'));
app.use('/api/compte', require('./route/compte'));
app.use('/api/transaction', require('./route/transaction'));
app.use('/api/login', require('./route/login'));

// Middleware erreurs globales
// app.use((err, req, res, next) => {
//   console.error('Erreur serveur:', err.stack);
//   res.status(500).json({
//     message: 'Erreur interne. Réessaie plus tard.',
//     error: process.env.NODE_ENV === 'production' ? null : err.message,
//   });
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
