const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Configuration de l'environnement
const config = {
  // Configuration de la base de données
  database: {
    uri: process.env.MONGODB_URI || '',
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
    }
  },

  // Configuration du serveur
  server: {
    port: parseInt(process.env.PORT) || 5001,
    env: process.env.NODE_ENV || 'development',
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }
  },

  // Configuration JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // Configuration de l'entreprise
  company: {
    name: process.env.COMPANY_NAME || 'QHSE Solutions',
    email: process.env.COMPANY_EMAIL || 'contact@qhse.ci',
    phone: process.env.COMPANY_PHONE || '+225 XX XX XX XX',
    address: process.env.COMPANY_ADDRESS || 'Abidjan, Côte d\'Ivoire'
  },

  // Configuration des notifications
  notifications: {
    email: {
      enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      }
    },
    sms: {
      enabled: process.env.ALERT_SMS_ENABLED === 'true'
    },
    push: {
      enabled: process.env.ALERT_PUSH_ENABLED === 'true'
    }
  },

  // Configuration de sécurité
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-here',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    }
  },

  // Configuration des uploads
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10485760, // 10MB
    allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,application/pdf').split(','),
    path: process.env.UPLOAD_PATH || './uploads'
  },

  // Configuration des rapports
  reports: {
    templatePath: process.env.REPORT_TEMPLATE_PATH || './templates',
    outputPath: process.env.REPORT_OUTPUT_PATH || './reports',
    formats: ['pdf', 'excel', 'csv']
  },

  // Configuration des seuils d'alerte
  thresholds: {
    incidentsCritiques: parseInt(process.env.SEUIL_INCIDENTS_CRITIQUES) || 5,
    risquesEleves: parseInt(process.env.SEUIL_RISQUES_ELEVES) || 3,
    auditsEnRetard: parseInt(process.env.SEUIL_AUDITS_EN_RETARD) || 2,
    formationsExpirantes: parseInt(process.env.SEUIL_FORMATIONS_EXPIRANTES) || 7
  },

  // Configuration des modules
  modules: {
    laboratoire: {
      enabled: true,
      autoValidation: false,
      seuilConformite: 95
    },
    qualite: {
      enabled: true,
      autoDecision: false,
      seuilNonConformite: 5
    },
    hse: {
      enabled: true,
      autoAlerte: true,
      seuilIncidents: 3
    }
  }
};

// Validation de la configuration
const validateConfig = () => {
  const required = ['JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Variables d'environnement manquantes: ${missing.join(', ')}`);
    console.warn('Utilisation des valeurs par défaut (non recommandé en production)');
  }
};

// Exporter la configuration
module.exports = {
  ...config,
  validateConfig
};
