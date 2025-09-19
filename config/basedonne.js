const mysql = require('mysql2/promise');

let pool;

async function connectDB() {
  try {
    // Créer un pool de connexions MySQL
    pool = mysql.createPool({
      host:  'localhost',
      user:  'root',
      password:  '',
      database:  'minibank',
      waitForConnections: true,
    //   connectionLimit: 10,
    //   queueLimit: 0
    });
    // Tester la connexion
    const connection = await pool.getConnection();
    console.log('✅ Connecté à MySQL');
    connection.release();
  } catch (err) {
    console.error('❌ Erreur de connexion MySQL :', err.message);
    process.exit(1); // Arrêter le serveur si la connexion échoue
  }
}

function getDB() {
  if (!pool) throw new Error('La base de données MySQL n’est pas connectée.');
  return pool;
}

module.exports = { connectDB, getDB };
