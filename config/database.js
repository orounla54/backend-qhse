const mongoose = require('mongoose');

// Configuration de la base de données
const dbConfig = {
  // URL de connexion MongoDB
  url: process.env.MONGODB_URI || 'mongodb+srv://orounla:kali1212@cluster0.75fgs7e.mongodb.net/qhse_erp',
  
  // Options de connexion
  options: {
    maxPoolSize: 10, // Nombre maximum de connexions dans le pool
    serverSelectionTimeoutMS: 5000, // Timeout pour la sélection du serveur
    socketTimeoutMS: 45000, // Timeout pour les opérations socket
  },
  
  // Configuration des collections QHSE
  collections: {
    audits: 'audits',
    incidents: 'incidents',
    risques: 'risques',
    formations: 'formations',
    conformites: 'conformites',
    users: 'users',
    config: 'qhse_config'
  },
  
  // Index pour optimiser les performances
  indexes: {
    audits: [
      { numero: 1 },
      { statut: 1 },
      { datePlanification: 1 },
      { auditeurPrincipal: 1 }
    ],
    incidents: [
      { numero: 1 },
      { statut: 1 },
      { dateIncident: 1 },
      { declarant: 1 },
      { gravite: 1 }
    ],
    risques: [
      { numero: 1 },
      { niveauRisque: 1 },
      { type: 1 },
      { statut: 1 },
      { 'localisation.zone': 1 }
    ],
    formations: [
      { numero: 1 },
      { statut: 1 },
      { datePlanification: 1 },
      { type: 1 },
      { 'participants.employe': 1 }
    ],
    conformites: [
      { numero: 1 },
      { statutConformite: 1 },
      { type: 1 },
      { domaine: 1 },
      { prochaineEvaluation: 1 }
    ]
  }
};

// Fonction de connexion à la base de données
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(dbConfig.url, dbConfig.options);
    
    console.log(`✅ Base de données MongoDB connectée: ${conn.connection.host}`);
    
    // Index creation is handled by individual schemas
    // await createIndexes();
    
    return conn;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    process.exit(1);
  }
};

// Fonction pour créer les index
const createIndexes = async () => {
  try {
    const Audit = require('../models/Audit');
    const Incident = require('../models/Incident');
    const Risque = require('../models/Risque');
    const Formation = require('../models/Formation');
    const Conformite = require('../models/Conformite');
    
    // Création des index pour les audits
    for (const index of dbConfig.indexes.audits) {
      await Audit.collection.createIndex(index);
    }
    
    // Création des index pour les incidents
    for (const index of dbConfig.indexes.incidents) {
      await Incident.collection.createIndex(index);
    }
    
    // Création des index pour les risques
    for (const index of dbConfig.indexes.risques) {
      await Risque.collection.createIndex(index);
    }
    
    // Création des index pour les formations
    for (const index of dbConfig.indexes.formations) {
      await Formation.collection.createIndex(index);
    }
    
    // Création des index pour les conformités
    for (const index of dbConfig.indexes.conformites) {
      await Conformite.collection.createIndex(index);
    }
    
    console.log('✅ Index de base de données créés avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la création des index:', error.message);
  }
};

// Fonction de déconnexion
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ Base de données déconnectée');
  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion:', error.message);
  }
};

// Gestion des événements de connexion
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connecté à MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Erreur de connexion Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose déconnecté de MongoDB');
});

// Gestion de l'arrêt gracieux
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = {
  connectDB,
  disconnectDB,
  dbConfig
}; 