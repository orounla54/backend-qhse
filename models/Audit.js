const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
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
    trim: true
  },
  type: {
    type: String,
    enum: ['Interne', 'Externe', 'Certification', 'Surveillance', 'Suivi'],
    required: true
  },
  domaine: {
    type: String,
    enum: ['Qualité', 'Sécurité', 'Environnement', 'Hygiène', 'Mixte'],
    required: true
  },

  // Planning
  datePlanification: {
    type: Date,
    required: true
  },
  dateDebut: Date,
  dateFin: Date,
  dureeEstimee: {
    type: Number, // heures
    default: 8
  },

  // Statut et workflow
  statut: {
    type: String,
    enum: ['Planifié', 'En cours', 'Terminé', 'Annulé', 'Reporté'],
    default: 'Planifié'
  },
  priorite: {
    type: String,
    enum: ['Faible', 'Moyenne', 'Élevée', 'Critique'],
    default: 'Moyenne'
  },

  // Équipe d'audit
  auditeurPrincipal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  auditeurs: [{
    auditeur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Auditeur', 'Expert technique', 'Observateur']
    }
  }],

  // Périmètre
  perimetre: {
    zones: [{
      zone: String,
      description: String
    }],
    processus: [{
      nom: String,
      description: String
    }],
    documents: [{
      nom: String,
      version: String,
      statut: {
        type: String,
        enum: ['Conforme', 'Non conforme', 'À améliorer']
      }
    }]
  },

  // Critères d'audit
  criteres: [{
    reference: String,
    description: String,
    exigence: String,
    methodeVerification: String,
    statut: {
      type: String,
      enum: ['Conforme', 'Non conforme', 'Observation', 'Non applicable'],
      default: 'Non applicable'
    },
    commentaire: String,
    action: {
      type: String,
      enum: ['Aucune', 'Action corrective', 'Action préventive', 'Amélioration']
    },
    // Checklist personnalisable
    checklist: {
      question: String,
      reponse: String,
      preuve: String,
      score: Number,
      poids: Number // Poids du critère dans l'évaluation globale
    }
  }],

  // Checklist personnalisable
  checklist: {
    nom: String,
    version: String,
    type: {
      type: String,
      enum: ['ISO 9001', 'ISO 22000', 'HACCP', 'BRC', 'IFS', 'Personnalisée'],
      default: 'Personnalisée'
    },
    sections: [{
      nom: String,
      description: String,
      poids: Number,
      criteres: [{
        reference: String,
        question: String,
        methodeVerification: String,
        scoreMax: Number,
        obligatoire: Boolean
      }]
    }]
  },

  // Constatations
  constatations: [{
    type: {
      type: String,
      enum: ['Conformité', 'Non-conformité', 'Observation', 'Opportunité d\'amélioration']
    },
    description: String,
    reference: String,
    gravite: {
      type: String,
      enum: ['Mineure', 'Majeure', 'Critique']
    },
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateLimite: Date,
    statut: {
      type: String,
      enum: ['Ouverte', 'En cours', 'Fermée', 'Vérifiée'],
      default: 'Ouverte'
    }
  }],

  // Actions correctives
  actionsCorrectives: [{
    reference: String,
    description: String,
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateLimite: Date,
    statut: {
      type: String,
      enum: ['Planifiée', 'En cours', 'Terminée', 'Vérifiée'],
      default: 'Planifiée'
    },
    efficacite: {
      type: String,
      enum: ['Non évaluée', 'Efficace', 'Partiellement efficace', 'Non efficace']
    },
    commentaire: String
  }],

  // Résultats
  resultats: {
    nombreConstatations: {
      conformites: {
        type: Number,
        default: 0
      },
      nonConformites: {
        type: Number,
        default: 0
      },
      observations: {
        type: Number,
        default: 0
      }
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    conclusion: {
      type: String,
      enum: ['Conforme', 'Conforme avec réserves', 'Non conforme', 'À améliorer']
    },
    recommandations: [String]
  },

  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['Plan d\'audit', 'Checklist', 'Rapport', 'Photos', 'Autre']
    },
    nom: String,
    url: String,
    dateUpload: {
      type: Date,
      default: Date.now
    }
  }],

  // Notes et commentaires
  notes: [{
    contenu: String,
    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateCreation: {
      type: Date,
      default: Date.now
    }
  }],

  // Métadonnées
  demandeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
// auditSchema.index({ numero: 1 }); // Déjà indexé par unique: true
auditSchema.index({ type: 1 });
auditSchema.index({ domaine: 1 });
auditSchema.index({ statut: 1 });
auditSchema.index({ datePlanification: 1 });

// Méthode pour calculer le score
auditSchema.methods.calculerScore = function() {
  const total = this.criteres.length;
  if (total === 0) return 0;

  const conformes = this.criteres.filter(c => c.statut === 'Conforme').length;
  const observations = this.criteres.filter(c => c.statut === 'Observation').length;
  
  // Score basé sur les conformités (100%) et observations (50%)
  this.resultats.score = Math.round(((conformes + (observations * 0.5)) / total) * 100);
  
  return this.resultats.score;
};

// Méthode pour déterminer la conclusion
auditSchema.methods.determinerConclusion = function() {
  const nonConformites = this.resultats.nombreConstatations.nonConformites;
  const observations = this.resultats.nombreConstatations.observations;
  
  if (nonConformites === 0 && observations === 0) {
    this.resultats.conclusion = 'Conforme';
  } else if (nonConformites === 0 && observations > 0) {
    this.resultats.conclusion = 'Conforme avec réserves';
  } else if (nonConformites > 0) {
    this.resultats.conclusion = 'Non conforme';
  } else {
    this.resultats.conclusion = 'À améliorer';
  }
  
  return this.resultats.conclusion;
};

// Méthode pour vérifier si l'audit est en retard
auditSchema.methods.estEnRetard = function() {
  if (this.statut === 'Planifié' && this.datePlanification < new Date()) {
    return true;
  }
  return false;
};

module.exports = mongoose.model('Audit', auditSchema); 