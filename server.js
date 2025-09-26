const express = require('express');
const { connectDB } = require('./config/basedonne.js');
const cors = require('cors');
const path = require('path');
require('dotenv').config();


connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Middleware global pour toutes les réponses MongoDB
app.use((req, res, next) => {
  const originalSend = res.json;
  res.json = function(data) {
    if (data && typeof data === 'object') {
      data = transformMongoResponse(data);
    }
    originalSend.call(this, data);
  };
  next();
});

function transformMongoResponse(obj) {
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;
  }
  return obj;
}

app.use('/api/agent', require('./route/agent'));
app.use('/api/utilisateur', require('./route/utilisateurRoutes'));
app.use('/api/compte', require('./route/compte'));
app.use('/api/transaction', require('./route/transaction'));


app.use('/api/login', require('./route/login'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
