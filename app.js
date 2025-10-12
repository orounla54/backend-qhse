const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/optimizedDatabase');
const config = require('./config/environment');

// Routes unifiées
const unifiedRoutes = require('./routes/unified');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const laboratoireRoutes = require('./routes/laboratoire');
const qualiteRoutes = require('./routes/qualite');
const hseRoutes = require('./routes/hse');
const notificationRoutes = require('./routes/notifications');

// Configuration des variables d'environnement
dotenv.config();

// Validation de la configuration
config.validateConfig();

const app = express();
const PORT = process.env.PORT || 5001;

// Configuration CORS pour Vercel
const corsOptions = {
  origin: [
    'https://frontend-qhse.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Gestion des requêtes OPTIONS (preflight)
app.options('*', cors(corsOptions));

// Connexion à la base de données
connectDB();

// Routes unifiées
app.use('/api/auth', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/qhse', unifiedRoutes);
app.use('/api/qualite', qualiteRoutes);
app.use('/api/hse', hseRoutes);
app.use('/api/laboratoire', laboratoireRoutes);
app.use('/api/notifications', notificationRoutes);

// Route de test
app.get('/', (req, res) => {
  try {
    res.json({ 
      message: 'API QHSE Trafrule ERP',
      version: '1.0.0',
      status: 'running',
      cors: 'configured',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Erreur route racine:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// Route de test CORS
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API QHSE Test',
    cors: 'working',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur QHSE démarré sur le port ${PORT}`);
  console.log(`📊 API disponible sur http://localhost:${PORT}/api/qhse`);
});

module.exports = app; 