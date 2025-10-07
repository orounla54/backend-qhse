const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Schéma utilisateur pour l'authentification QHSE
 */
const userSchema = new mongoose.Schema({
  // Informations personnelles
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true,
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Format d\'email invalide'
    ]
  },
  
  // Authentification
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  
  // Rôles et permissions
  role: {
    type: String,
    enum: ['admin', 'manager', 'responsable_qhse', 'employe'],
    default: 'employe',
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'admin',
      'audit_read', 'audit_write', 'audit_delete',
      'incident_read', 'incident_write', 'incident_delete',
      'risque_read', 'risque_write', 'risque_delete',
      'formation_read', 'formation_write', 'formation_delete',
      'conformite_read', 'conformite_write', 'conformite_delete',
      'config_read', 'config_write'
    ]
  }],
  
  // Informations organisationnelles
  entreprise: {
    type: String,
    required: [true, 'L\'entreprise est requise'],
    trim: true
  },
  departement: {
    type: String,
    trim: true
  },
  poste: {
    type: String,
    trim: true
  },
  
  // Photo de profil
  avatar: {
    type: String, // URL de l'image ou base64
    default: null
  },
  
  // Statut du compte
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Tokens de sécurité
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 jours
    }
  }],
  
  // Informations de connexion
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Préférences utilisateur
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      enum: ['fr', 'en'],
      default: 'fr'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      incidents: {
        type: Boolean,
        default: true
      },
      audits: {
        type: Boolean,
        default: true
      },
      formations: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.refreshTokens;
      return ret;
    }
  }
});

// Index pour les performances
// userSchema.index({ email: 1 }); // Déjà indexé par unique: true
userSchema.index({ entreprise: 1 });
userSchema.index({ role: 1 });
userSchema.index({ lastLogin: -1 });

// Propriété virtuelle pour vérifier si le compte est verrouillé
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Middleware de pré-sauvegarde pour hasher le mot de passe
userSchema.pre('save', async function(next) {
  // Ne hasher que si le mot de passe a été modifié
  if (!this.isModified('password')) return next();
  
  try {
    // Générer le salt et hasher le mot de passe
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware pour définir les permissions par défaut selon le rôle
userSchema.pre('save', function(next) {
  if (this.isModified('role') || this.isNew) {
    switch (this.role) {
      case 'admin':
        this.permissions = ['admin'];
        break;
      case 'manager':
        this.permissions = [
          'audit_read', 'audit_write',
          'incident_read', 'incident_write',
          'risque_read', 'risque_write',
          'formation_read', 'formation_write',
          'conformite_read', 'conformite_write',
          'config_read'
        ];
        break;
      case 'responsable_qhse':
        this.permissions = [
          'audit_read', 'audit_write',
          'incident_read', 'incident_write',
          'risque_read', 'risque_write',
          'formation_read', 'formation_write',
          'conformite_read', 'conformite_write'
        ];
        break;
      case 'employe':
        this.permissions = [
          'audit_read',
          'incident_read', 'incident_write',
          'formation_read',
          'conformite_read'
        ];
        break;
    }
  }
  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Méthode pour incrémenter les tentatives de connexion
userSchema.methods.incLoginAttempts = function() {
  // Si nous avons une date de verrouillage précédente et qu'elle est expirée, redémarrer
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        lockUntil: 1
      },
      $set: {
        loginAttempts: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Si nous atteignons le maximum de tentatives et que nous ne sommes pas déjà verrouillés, verrouiller le compte
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 heures
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Méthode pour réinitialiser les tentatives de connexion
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    },
    $set: {
      lastLogin: new Date()
    }
  });
};

// Méthode pour vérifier les permissions
userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes('admin') || this.permissions.includes(permission);
};

// Méthode pour obtenir le nom complet
userSchema.methods.getFullName = function() {
  return `${this.prenom} ${this.nom}`;
};

// Méthode statique pour nettoyer les tokens expirés
userSchema.statics.cleanExpiredTokens = async function() {
  return this.updateMany(
    {},
    {
      $pull: {
        refreshTokens: {
          createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }
    }
  );
};

// Méthode statique pour rechercher des utilisateurs
userSchema.statics.searchUsers = function(query, entreprise) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    entreprise: entreprise,
    $or: [
      { nom: searchRegex },
      { prenom: searchRegex },
      { email: searchRegex },
      { departement: searchRegex },
      { poste: searchRegex }
    ]
  }).select('-password');
};

module.exports = mongoose.model('User', userSchema);
