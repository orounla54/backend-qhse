const mongoose = require('mongoose');
const config = require('./environment');

// Configuration optimisée de la base de données
const optimizedConfig = {
  // URL de connexion MongoDB
  url: config.database.uri,
  
  // Options de connexion optimisées
  options: {
    maxPoolSize: config.database.options.maxPoolSize,
    serverSelectionTimeoutMS: config.database.options.serverSelectionTimeoutMS,
    socketTimeoutMS: config.database.options.socketTimeoutMS,
    // Options obsolètes supprimées : useNewUrlParser, useUnifiedTopology
    // Optimisations pour les performances
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    heartbeatFrequencyMS: 10000,
  },
  
  // Configuration des collections optimisées
  collections: {
    audits: 'audits',
    incidents: 'incidents',
    risques: 'risques',
    formations: 'formations',
    conformites: 'conformites',
    users: 'users',
    config: 'qhse_config',
    notifications: 'notifications',
    exports: 'exports_log'
  },
  
  // Index optimisés pour les performances
  indexes: {
    // Index pour les audits
    audits: [
      { numero: 1 },
      { statut: 1 },
      { datePlanification: 1 },
      { auditeurPrincipal: 1 },
      { domaine: 1 },
      { type: 1 },
      { createdAt: -1 },
      { isArchived: 1, statut: 1 },
      { isArchived: 1, datePlanification: -1 }
    ],
    
    // Index pour les incidents
    incidents: [
      { numero: 1 },
      { statut: 1 },
      { dateIncident: 1 },
      { declarant: 1 },
      { gravite: 1 },
      { type: 1 },
      { createdAt: -1 },
      { isArchived: 1, statut: 1 },
      { isArchived: 1, dateIncident: -1 },
      { isArchived: 1, gravite: 1 }
    ],
    
    // Index pour les risques
    risques: [
      { numero: 1 },
      { niveauRisque: 1 },
      { type: 1 },
      { statut: 1 },
      { 'localisation.zone': 1 },
      { scoreRisque: -1 },
      { createdAt: -1 },
      { isArchived: 1, niveauRisque: 1 },
      { isArchived: 1, statut: 1 }
    ],
    
    // Index pour les formations
    formations: [
      { numero: 1 },
      { statut: 1 },
      { datePlanification: 1 },
      { type: 1 },
      { categorie: 1 },
      { 'participants.employe': 1 },
      { createdAt: -1 },
      { isArchived: 1, statut: 1 },
      { isArchived: 1, datePlanification: 1 }
    ],
    
    // Index pour les conformités
    conformites: [
      { numero: 1 },
      { statutConformite: 1 },
      { type: 1 },
      { domaine: 1 },
      { prochaineEvaluation: 1 },
      { createdAt: -1 },
      { isArchived: 1, statutConformite: 1 },
      { isArchived: 1, prochaineEvaluation: 1 }
    ],
    
    // Index pour les utilisateurs
    users: [
      { email: 1 },
      { entreprise: 1 },
      { role: 1 },
      { lastLogin: -1 },
      { isActive: 1 },
      { isEmailVerified: 1 }
    ],
    
    // Index pour les notifications
    notifications: [
      { userId: 1 },
      { type: 1 },
      { read: 1 },
      { createdAt: -1 },
      { priority: 1 },
      { userId: 1, read: 1 },
      { userId: 1, createdAt: -1 }
    ]
  },
  
  // Configuration des agrégations optimisées
  aggregations: {
    // Pipeline pour les statistiques d'audits
    auditStats: [
      { $match: { isArchived: false } },
      { $group: {
        _id: '$statut',
        count: { $sum: 1 },
        avgScore: { $avg: '$score' }
      }},
      { $sort: { count: -1 } }
    ],
    
    // Pipeline pour les statistiques d'incidents
    incidentStats: [
      { $match: { isArchived: false } },
      { $group: {
        _id: '$gravite',
        count: { $sum: 1 },
        avgImpact: { $avg: '$impact.score' }
      }},
      { $sort: { count: -1 } }
    ],
    
    // Pipeline pour les statistiques de risques
    risqueStats: [
      { $match: { isArchived: false } },
      { $group: {
        _id: '$niveauRisque',
        count: { $sum: 1 },
        avgScore: { $avg: '$scoreRisque' }
      }},
      { $sort: { count: -1 } }
    ]
  }
};

// Fonction de connexion optimisée
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(optimizedConfig.url, optimizedConfig.options);
    
    console.log(`✅ Base de données MongoDB connectée: ${conn.connection.host}`);
    console.log(`📊 Base de données: ${conn.connection.name}`);
    
    // Créer les index optimisés
    await createOptimizedIndexes();
    
    return conn;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    process.exit(1);
  }
};

// Fonction pour créer les index optimisés
const createOptimizedIndexes = async () => {
  try {
    const Audit = require('../models/Audit');
    const Incident = require('../models/Incident');
    const Risque = require('../models/Risque');
    const Formation = require('../models/Formation');
    const Conformite = require('../models/Conformite');
    const User = require('../models/User');
    
    const models = [
      { model: Audit, indexes: optimizedConfig.indexes.audits },
      { model: Incident, indexes: optimizedConfig.indexes.incidents },
      { model: Risque, indexes: optimizedConfig.indexes.risques },
      { model: Formation, indexes: optimizedConfig.indexes.formations },
      { model: Conformite, indexes: optimizedConfig.indexes.conformites },
      { model: User, indexes: optimizedConfig.indexes.users }
    ];
    
    for (const { model, indexes } of models) {
      for (const index of indexes) {
        try {
          await model.collection.createIndex(index);
        } catch (error) {
          console.warn(`⚠️ Index déjà existant ou erreur: ${JSON.stringify(index)}`);
        }
      }
    }
    
    console.log('✅ Index optimisés créés avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la création des index:', error.message);
  }
};

// Fonction pour optimiser les performances
const optimizePerformance = async () => {
  try {
    // Analyser les performances des requêtes
    const stats = await mongoose.connection.db.stats();
    console.log('📊 Statistiques de la base de données:', {
      collections: stats.collections,
      dataSize: `${Math.round(stats.dataSize / 1024 / 1024)} MB`,
      storageSize: `${Math.round(stats.storageSize / 1024 / 1024)} MB`,
      indexes: stats.indexes,
      indexSize: `${Math.round(stats.indexSize / 1024 / 1024)} MB`
    });
    
    // Recommandations d'optimisation
    if (stats.indexSize > stats.dataSize * 2) {
      console.warn('⚠️ Taille des index élevée, considérer la suppression d\'index inutilisés');
    }
    
    if (stats.storageSize > stats.dataSize * 1.5) {
      console.warn('⚠️ Fragmentation détectée, considérer la compaction');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation:', error.message);
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
  createOptimizedIndexes,
  optimizePerformance,
  optimizedConfig
};
