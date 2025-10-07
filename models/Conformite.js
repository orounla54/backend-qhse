const mongoose = require('mongoose');

const conformiteSchema = new mongoose.Schema({
  // Informations de base
  numero: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  titre: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Législation', 'Réglementation', 'Norme', 'Certification', 'Accréditation', 'Autorisation'],
    required: true
  },
  domaine: {
    type: String,
    enum: ['Sécurité', 'Qualité', 'Environnement', 'Hygiène', 'Santé', 'Mixte'],
    required: true
  },

  // Référence réglementaire
  reference: {
    texte: String,
    article: String,
    paragraphe: String,
    organisme: String,
    pays: String,
    datePublication: Date,
    dateEntreeVigueur: Date
  },

  // Obligations
  obligations: [{
    description: String,
    type: {
      type: String,
      enum: ['Obligation de moyen', 'Obligation de résultat', 'Interdiction', 'Autorisation']
    },
    delai: {
      type: String,
      enum: ['Immédiat', '30 jours', '3 mois', '6 mois', '1 an', 'Permanent']
    },
    frequence: {
      type: String,
      enum: ['Ponctuel', 'Annuel', 'Semestriel', 'Trimestriel', 'Mensuel', 'Hebdomadaire', 'Quotidien']
    }
  }],

  // Applicabilité
  applicabilite: {
    activites: [String],
    zones: [String],
    postes: [String],
    equipements: [String],
    produits: [String]
  },

  // Statut de conformité
  statutConformite: {
    type: String,
    enum: ['Conforme', 'Non conforme', 'En cours de mise en conformité', 'Non applicable', 'À évaluer'],
    default: 'À évaluer'
  },
  niveauConformite: {
    type: String,
    enum: ['Exemplaire', 'Bon', 'Acceptable', 'Insuffisant', 'Critique'],
    default: 'Acceptable'
  },
  scoreConformite: {
    type: Number,
    min: 0,
    max: 100
  },

  // Évaluation
  derniereEvaluation: {
    date: Date,
    evaluateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    methode: String,
    resultat: String,
    observations: String
  },
  prochaineEvaluation: Date,

  // Actions de conformité
  actionsConformite: [{
    description: String,
    type: {
      type: String,
      enum: ['Mise en place', 'Amélioration', 'Correction', 'Formation', 'Documentation', 'Audit']
    },
    priorite: {
      type: String,
      enum: ['Basse', 'Normale', 'Haute', 'Critique']
    },
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateEcheance: Date,
    statut: {
      type: String,
      enum: ['À faire', 'En cours', 'Terminé', 'En retard']
    },
    coutEstime: Number,
    impact: {
      type: String,
      enum: ['Faible', 'Modéré', 'Élevé', 'Critique']
    }
  }],

  // Documents de conformité
  documents: [{
    nom: String,
    type: {
      type: String,
      enum: ['Procédure', 'Instruction', 'Registre', 'Certificat', 'Autorisation', 'Rapport']
    },
    version: String,
    dateCreation: Date,
    dateRevision: Date,
    statut: {
      type: String,
      enum: ['Brouillon', 'En révision', 'Approuvé', 'Obsolète']
    },
    url: String,
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Certifications et autorisations
  certifications: [{
    nom: String,
    organisme: String,
    numero: String,
    dateObtention: Date,
    dateExpiration: Date,
    statut: {
      type: String,
      enum: ['Valide', 'Expiré', 'En cours de renouvellement', 'Suspendu', 'Révoqué']
    },
    conditions: [String],
    coutRenouvellement: Number
  }],

  // Risques de non-conformité
  risquesNonConformite: [{
    description: String,
    probabilite: {
      type: String,
      enum: ['Très faible', 'Faible', 'Modérée', 'Élevée', 'Très élevée']
    },
    impact: {
      type: String,
      enum: ['Négligeable', 'Faible', 'Modéré', 'Élevé', 'Critique']
    },
    mesuresMitigation: [String]
  }],

  // Historique
  historique: [{
    date: {
      type: Date,
      default: Date.now
    },
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: String,
    anciennesValeurs: mongoose.Schema.Types.Mixed,
    nouvellesValeurs: mongoose.Schema.Types.Mixed
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

// Index pour les recherches
// conformiteSchema.index({ numero: 1 }); // Déjà indexé par unique: true
conformiteSchema.index({ type: 1, domaine: 1 });
conformiteSchema.index({ statutConformite: 1 });
conformiteSchema.index({ 'reference.organisme': 1 });
conformiteSchema.index({ prochaineEvaluation: 1 });

// Méthode statique pour obtenir les conformités expirantes
conformiteSchema.statics.getConformitesExpirantes = function(days = 30) {
  const dateLimite = new Date();
  dateLimite.setDate(dateLimite.getDate() + days);
  
  return this.find({
    prochaineEvaluation: { $lte: dateLimite },
    isArchived: false
  }).populate('createdBy', 'nom prenom');
};

// Méthode statique pour obtenir les non-conformités
conformiteSchema.statics.getNonConformites = function() {
  return this.find({
    statutConformite: 'Non conforme',
    isArchived: false
  }).populate('createdBy', 'nom prenom');
};

// Middleware pre-save pour calculer automatiquement le score de conformité
conformiteSchema.pre('save', function(next) {
  if (this.niveauConformite) {
    const scores = {
      'Exemplaire': 100,
      'Bon': 80,
      'Acceptable': 60,
      'Insuffisant': 40,
      'Critique': 20
    };
    this.scoreConformite = scores[this.niveauConformite] || 0;
  }
  next();
});

module.exports = mongoose.model('Conformite', conformiteSchema); 