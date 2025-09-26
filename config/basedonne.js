// config/basedonne.js
const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  try {
    if (isConnected) {
      console.log(' Déjà connecté à MongoDB');
      return;
    }

  const con =  await mongoose.connect(process.env.MONGODB_URI);
     console.log(`MongoDB Connected: ${con.connection.host}`);

    isConnected = true;
     console.log(`MongoDB Connected: ${con.connection.host}`);
  } catch (err) {
    console.error(' Erreur de connexion MongoDB :', err.message);
    process.exit(1);
  } 
}

// Événements de connexion MongoDB
mongoose.connection.on('connected', () => {
  console.log('MongoDB connecté');
});

mongoose.connection.on('error', (err) => {
  console.error('Erreur MongoDB :', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB déconnecté');
  isConnected = false;
});

function getDB() {
  if (!isConnected) {
    throw new Error('La base de données MongoDB n est pas connectée.');
  }
  return mongoose;
}

module.exports = { connectDB, getDB };