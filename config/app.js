// Configuration générale de l'application QHSE
const appConfig = {
  // Configuration du serveur
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development',
    cors: {
      origin: process.env.CORS_ORIGIN || 'https://frontend-qhse.vercel.app',
      credentials: true
    }
  },

  // Configuration JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'qhse-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // Configuration des logs
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    file: process.env.LOG_FILE || 'logs/qhse.log'
  },

  // Configuration des emails
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    from: process.env.EMAIL_FROM || 'noreply@entreprise.com'
  },

  // Configuration des notifications
  notifications: {
    email: {
      enabled: process.env.EMAIL_NOTIFICATIONS === 'true',
      templates: {
        incident: 'templates/incident-email.html',
        audit: 'templates/audit-email.html',
        formation: 'templates/formation-email.html',
        risque: 'templates/risque-email.html'
      }
    },
    sms: {
      enabled: process.env.SMS_NOTIFICATIONS === 'true',
      provider: process.env.SMS_PROVIDER || 'twilio',
      accountSid: process.env.SMS_ACCOUNT_SID,
      authToken: process.env.SMS_AUTH_TOKEN,
      from: process.env.SMS_FROM
    },
    push: {
      enabled: process.env.PUSH_NOTIFICATIONS === 'true',
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY
    }
  },

  // Configuration des rapports
  reports: {
    format: process.env.REPORT_FORMAT || 'PDF',
    templates: {
      audit: 'templates/audit-report.html',
      incident: 'templates/incident-report.html',
      formation: 'templates/formation-report.html',
      risque: 'templates/risque-report.html',
      conformite: 'templates/conformite-report.html'
    },
    output: {
      path: process.env.REPORT_OUTPUT_PATH || 'reports/',
      filename: process.env.REPORT_FILENAME || '[type]-[date]-[id].pdf'
    }
  },

  // Configuration des fichiers
  upload: {
    maxSize: process.env.UPLOAD_MAX_SIZE || '10MB',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    path: process.env.UPLOAD_PATH || 'uploads/qhse/',
    tempPath: process.env.UPLOAD_TEMP_PATH || 'uploads/temp/'
  },

  // Configuration des seuils d'alerte
  alerts: {
    incidents: {
      threshold: parseInt(process.env.INCIDENT_ALERT_THRESHOLD) || 5,
      period: process.env.INCIDENT_ALERT_PERIOD || '7d'
    },
    risques: {
      threshold: parseInt(process.env.RISQUE_ALERT_THRESHOLD) || 3,
      period: process.env.RISQUE_ALERT_PERIOD || '30d'
    },
    audits: {
      threshold: parseInt(process.env.AUDIT_ALERT_THRESHOLD) || 2,
      period: process.env.AUDIT_ALERT_PERIOD || '7d'
    },
    formations: {
      threshold: parseInt(process.env.FORMATION_ALERT_THRESHOLD) || 10,
      period: process.env.FORMATION_ALERT_PERIOD || '30d'
    }
  },

  // Configuration de la pagination
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGINATION_LIMIT) || 10,
    maxLimit: parseInt(process.env.MAX_PAGINATION_LIMIT) || 100
  },

  // Configuration de la cache
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000
  },

  // Configuration de la sécurité
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // limite par IP
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }
  },

  // Configuration des rôles et permissions
  roles: {
    admin: {
      name: 'Administrateur QHSE',
      permissions: ['read', 'write', 'delete', 'admin']
    },
    auditeur: {
      name: 'Auditeur',
      permissions: ['read', 'write']
    },
    responsable: {
      name: 'Responsable',
      permissions: ['read', 'write']
    },
    utilisateur: {
      name: 'Utilisateur',
      permissions: ['read']
    }
  },

  // Configuration des types et catégories
  types: {
    audits: ['Interne', 'Externe', 'Certification', 'Surveillance', 'Suivi'],
    incidents: ['Accident', 'Incident', 'Presqu\'accident', 'Maladie'],
    risques: ['Sécurité', 'Qualité', 'Environnement', 'Hygiène', 'Santé', 'Mixte'],
    formations: ['Sécurité', 'Qualité', 'Environnement', 'Hygiène', 'Santé', 'Mixte'],
    conformites: ['Législation', 'Réglementation', 'Norme', 'Certification', 'Accréditation', 'Autorisation']
  },

  // Configuration des statuts
  statuts: {
    audits: ['Planifié', 'En cours', 'Terminé', 'Annulé', 'Reporté'],
    incidents: ['Déclaré', 'En cours d\'investigation', 'En cours de traitement', 'Résolu', 'Clôturé'],
    risques: ['Actif', 'Maîtrisé', 'En cours de traitement', 'Archivé'],
    formations: ['Planifiée', 'En cours', 'Terminée', 'Annulée', 'Reportée'],
    conformites: ['Conforme', 'Non conforme', 'En cours de mise en conformité', 'Non applicable', 'À évaluer']
  }
};

// Fonction pour valider la configuration
const validateConfig = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'MONGODB_URI'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Variables d\'environnement manquantes:', missingVars.join(', '));
    console.warn('💡 Utilisation des valeurs par défaut');
  }

  return true;
};

// Fonction pour obtenir la configuration selon l'environnement
const getConfig = (environment = process.env.NODE_ENV || 'development') => {
  const baseConfig = { ...appConfig };
  
  if (environment === 'production') {
    // Configuration spécifique à la production
    baseConfig.server.cors.origin = process.env.CORS_ORIGIN || 'https://votre-domaine.com';
    baseConfig.logging.level = 'error';
    baseConfig.security.bcryptRounds = 14;
  } else if (environment === 'test') {
    // Configuration spécifique aux tests
    baseConfig.server.port = 3002;
    baseConfig.logging.level = 'error';
  }

  return baseConfig;
};

module.exports = {
  appConfig,
  validateConfig,
  getConfig
}; 

