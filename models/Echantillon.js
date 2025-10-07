const mongoose = require('mongoose');

/**
 * Schéma pour les échantillons de laboratoire
 */
const echantillonSchema = new mongoose.Schema({
  // Informations de base
  numero: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  codeBarres: {
    type: String,
    unique: true,
    sparse: true
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Informations du lot
  numeroLot: {
    type: String,
    required: true,
    trim: true
  },
  produit: {
    nom: {
      type: String,
      required: true,
      trim: true
    },
    reference: String,
    version: String
  },
  
  // Type d'échantillon
  typeEchantillon: {
    type: String,
    enum: [
      'Matière première',
      'Produit en cours',
      'Produit fini',
      'Eau',
      'Surface de ligne',
      'Environnement',
      'Autre'
    ],
    required: true
  },
  
  // Informations de prélèvement
  prelevement: {
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    heure: String,
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    localisation: {
      zone: String,
      ligne: String,
      poste: String,
      coordonnees: {
        latitude: Number,
        longitude: Number
      }
    },
    conditions: {
      temperature: Number,
      humidite: Number,
      pression: Number
    }
  },
  
  // Conditions de conservation/transport
  conservation: {
    temperature: Number,
    humidite: Number,
    duree: Number, // en heures
    conditionsSpeciales: String,
    emballage: String
  },
  
  // Mesures initiales
  mesuresInitiales: {
    poidsNet: {
      type: Number,
      required: true
    },
    unite: {
      type: String,
      enum: ['g', 'kg', 'ml', 'l'],
      default: 'g'
    },
    volume: Number,
    apparence: {
      couleur: String,
      texture: String,
      odeur: String,
      aspect: String
    },
    temperatureReception: Number,
    dateReception: {
      type: Date,
      default: Date.now
    }
  },
  
  // Statut de l'échantillon
  statut: {
    type: String,
    enum: [
      'Reçu',
      'En attente d\'analyse',
      'En cours d\'analyse',
      'Analysé',
      'Archivé',
      'Détruit'
    ],
    default: 'Reçu'
  },
  
  // Analyses associées
  analyses: [{
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analyse'
    },
    statut: {
      type: String,
      enum: ['Planifiée', 'En cours', 'Terminée', 'Annulée'],
      default: 'Planifiée'
    },
    dateDebut: Date,
    dateFin: Date,
    technicien: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Résultats globaux
  resultats: {
    conformite: {
      type: String,
      enum: ['Conforme', 'Non conforme', 'En attente', 'Partiellement conforme'],
      default: 'En attente'
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    dateValidation: Date,
    validePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Décision qualité
  decisionQualite: {
    statut: {
      type: String,
      enum: ['En attente', 'Validé', 'Rejeté', 'Sous réserve'],
      default: 'En attente'
    },
    commentaire: String,
    dateDecision: Date,
    decideur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actions: [{
      type: {
        type: String,
        enum: ['Libération', 'Blocage', 'Réanalyse', 'Retrait']
      },
      description: String,
      responsable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      dateLimite: Date
    }]
  },
  
  // Documents et fichiers
  documents: [{
    type: {
      type: String,
      enum: ['Fiche échantillon', 'Rapport d\'analyse', 'Photo', 'Certificat', 'Autre']
    },
    nom: String,
    url: String,
    dateUpload: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Historique et traçabilité
  historique: [{
    action: String,
    description: String,
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Métadonnées
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
// echantillonSchema.index({ numero: 1 }); // Déjà indexé par unique: true
echantillonSchema.index({ numeroLot: 1 });
// echantillonSchema.index({ codeBarres: 1 }); // Déjà indexé par unique: true
// echantillonSchema.index({ qrCode: 1 }); // Déjà indexé par unique: true
echantillonSchema.index({ 'produit.nom': 1 });
echantillonSchema.index({ typeEchantillon: 1 });
echantillonSchema.index({ statut: 1 });
echantillonSchema.index({ 'prelevement.date': -1 });

// Méthode pour générer un code-barres
echantillonSchema.methods.genererCodeBarres = function() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5);
  this.codeBarres = `ECH-${timestamp}-${random}`;
  return this.codeBarres;
};

// Méthode pour générer un QR code
echantillonSchema.methods.genererQRCode = function() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5);
  this.qrCode = `QR-${timestamp}-${random}`;
  return this.qrCode;
};

// Méthode pour calculer le score de conformité
echantillonSchema.methods.calculerScore = function() {
  if (!this.analyses || this.analyses.length === 0) {
    this.resultats.score = 0;
    return 0;
  }
  
  // Logique de calcul du score basée sur les analyses
  const analysesTerminees = this.analyses.filter(a => a.statut === 'Terminée');
  if (analysesTerminees.length === 0) {
    this.resultats.score = 0;
    return 0;
  }
  
  // Score par défaut - à adapter selon les analyses
  this.resultats.score = 85;
  return this.resultats.score;
};

// Méthode pour déterminer la conformité
echantillonSchema.methods.determinerConformite = function() {
  const score = this.calculerScore();
  
  if (score >= 90) {
    this.resultats.conformite = 'Conforme';
  } else if (score >= 70) {
    this.resultats.conformite = 'Partiellement conforme';
  } else {
    this.resultats.conformite = 'Non conforme';
  }
  
  return this.resultats.conformite;
};

// Méthode pour ajouter une entrée à l'historique
echantillonSchema.methods.ajouterHistorique = function(action, description, utilisateur) {
  this.historique.push({
    action,
    description,
    utilisateur,
    date: new Date()
  });
};

// Middleware de pré-sauvegarde
echantillonSchema.pre('save', function(next) {
  // Générer automatiquement le numéro si pas fourni
  if (this.isNew && !this.numero) {
    const timestamp = new Date().getFullYear();
    const count = this.constructor.countDocuments({});
    this.numero = `ECH-${timestamp}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Générer les codes si pas fournis
  if (this.isNew) {
    if (!this.codeBarres) {
      this.genererCodeBarres();
    }
    if (!this.qrCode) {
      this.genererQRCode();
    }
  }
  
  next();
});

module.exports = mongoose.model('Echantillon', echantillonSchema);
