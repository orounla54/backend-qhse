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
    'https://module-qhse.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200, // Pour les navigateurs legacy
  preflightContinue: false
};

// Middleware CORS personnalisé pour Vercel
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = corsOptions.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  
  // Gérer les requêtes preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Middleware CORS standard
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Gestion des requêtes OPTIONS (preflight) - fallback
app.options('*', (req, res) => {
  res.status(200).end();
});

// Connexion à la base de données (avec gestion d'erreur)
connectDB().catch(err => {
  console.error('❌ Erreur de connexion à la base de données:', err.message);
  console.log('🟡 Application démarrée sans base de données - Mode dégradé');
  // Ne pas arrêter l'application, continuer sans base de données pour les tests
});

// Middleware pour vérifier la connexion à la base de données
app.use('/api', (req, res, next) => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1 && req.path !== '/health' && req.path !== '/test') {
    console.warn('⚠️ Tentative d\'accès à l\'API sans connexion à la base de données');
  }
  next();
});

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

// Route de déploiement pour Vercel
app.get('/api/deploy', (req, res) => {
  res.json({ 
    message: 'API QHSE Déployée avec succès',
    status: 'deployed',
    cors: 'configured',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0'
  });
});

// Route de santé pour Vercel
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({ 
    status: 'healthy',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Route de test de base de données
app.get('/api/db-test', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Base de données non connectée',
        status: mongoose.connection.readyState
      });
    }
    
    // Test simple de la base de données
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    
    res.json({
      success: true,
      message: 'Base de données connectée',
      userCount,
      status: mongoose.connection.readyState
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur de test de base de données',
      error: error.message
    });
  }
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