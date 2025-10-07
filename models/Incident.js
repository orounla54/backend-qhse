const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
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
    enum: ['Accident', 'Incident', 'Presqu\'accident', 'Maladie', 'Accident du travail', 'Accident de trajet', 'Maladie professionnelle', 'Incident environnemental', 'Incident qualité', 'Incident sécurité', 'Autre'],
    required: true
  },
  categorie: {
    type: String,
    enum: ['Sécurité', 'Qualité', 'Environnement', 'Hygiène', 'Santé'],
    required: false, // Rendre optionnel temporairement  
    default: 'Sécurité'
  },

  // Gravité et urgence
  gravite: {
    type: String,
    enum: ['Légère', 'Modérée', 'Grave', 'Critique'],
    required: true
  },
  urgence: {
    type: String,
    enum: ['Faible', 'Modérée', 'Élevée', 'Immédiate'],
    required: false, // Rendre optionnel temporairement
    default: 'Modérée'
  },

  // Dates
  dateIncident: {
    type: Date,
    required: true
  },
  dateDeclaration: {
    type: Date,
    default: Date.now
  },
  dateResolution: Date,
  delaiResolution: Number, // heures

  // Localisation
  localisation: {
    zone: String,
    batiment: String,
    etage: String,
    coordonnees: {
      latitude: Number,
      longitude: Number
    }
  },

  // Personnes impliquées
  personnesImpliquees: [{
    personne: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Victime', 'Témoin', 'Responsable', 'Intervenant']
    },
    blessures: {
      type: String,
      enum: ['Aucune', 'Légères', 'Modérées', 'Graves', 'Fatales']
    },
    descriptionBlessures: String
  }],

  // Causes
  causes: [{
    type: {
      type: String,
      enum: ['Humaine', 'Technique', 'Organisationnelle', 'Environnementale']
    },
    description: String,
    facteur: String
  }],

  // Impacts
  impacts: {
    humains: {
      blesses: {
        type: Number,
        default: 0
      },
      deces: {
        type: Number,
        default: 0
      },
      arretsTravail: {
        type: Number,
        default: 0
      }
    },
    materiels: {
      degats: {
        type: String,
        enum: ['Aucun', 'Légers', 'Modérés', 'Importants', 'Critiques']
      },
      coutEstime: {
        type: Number,
        default: 0
      }
    },
    environnementaux: {
      pollution: {
        type: String,
        enum: ['Aucune', 'Légère', 'Modérée', 'Importante']
      },
      impact: String
    },
    production: {
      arretProduction: {
        type: Boolean,
        default: false
      },
      dureeArret: Number, // heures
      coutArret: {
        type: Number,
        default: 0
      }
    }
  },

  // Actions immédiates
  actionsImmediates: [{
    description: String,
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateRealisation: Date,
    statut: {
      type: String,
      enum: ['Planifiée', 'En cours', 'Terminée', 'Vérifiée'],
      default: 'Planifiée'
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

  // Actions préventives
  actionsPreventives: [{
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

  // Statut et suivi
  statut: {
    type: String,
    enum: ['Déclaré', 'En cours d\'investigation', 'En cours de traitement', 'Résolu', 'Fermé', 'Clôturé'],
    default: 'Déclaré'
  },
  priorite: {
    type: String,
    enum: ['Basse', 'Normale', 'Haute', 'Critique'],
    default: 'Normale'
  },

  // Investigation
  investigation: {
    investigateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateDebut: Date,
    dateFin: Date,
    rapport: String,
    conclusions: [String],
    recommandations: [String]
  },

  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['Déclaration', 'Photos', 'Vidéo', 'Rapport', 'Certificat médical', 'Autre']
    },
    nom: String,
    url: String,
    dateUpload: {
      type: Date,
      default: Date.now
    }
  }],

  // Notifications
  notifications: [{
    destinataire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['Email', 'SMS', 'Notification système']
    },
    contenu: String,
    dateEnvoi: {
      type: Date,
      default: Date.now
    },
    statut: {
      type: String,
      enum: ['Envoyée', 'Lue', 'Erreur'],
      default: 'Envoyée'
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
  declarant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Rendre optionnel temporairement
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

// Middleware pour générer automatiquement le numéro
incidentSchema.pre('save', async function(next) {
  try {
    // Générer automatiquement le numéro si pas fourni
    if (this.isNew && !this.numero) {
      const timestamp = new Date().getFullYear();
      const count = await this.constructor.countDocuments({});
      this.numero = `INC-${timestamp}-${String(count + 1).padStart(4, '0')}`;
    }
    
    // Calculer le délai de résolution
    this.calculerDelaiResolution();
    
    next();
  } catch (error) {
    next(error);
  }
});

// Index pour optimiser les requêtes
// incidentSchema.index({ numero: 1 }); // Déjà indexé par unique: true
incidentSchema.index({ type: 1 });
incidentSchema.index({ categorie: 1 });
incidentSchema.index({ statut: 1 });
incidentSchema.index({ dateIncident: -1 });
incidentSchema.index({ gravite: 1 });

// Méthode pour calculer le délai de résolution
incidentSchema.methods.calculerDelaiResolution = function() {
  if (this.dateResolution && this.dateDeclaration) {
    const diff = this.dateResolution - this.dateDeclaration;
    this.delaiResolution = Math.round(diff / (1000 * 60 * 60)); // heures
  }
  return this.delaiResolution;
};

// Méthode pour calculer le coût total
incidentSchema.methods.calculerCoutTotal = function() {
  const coutMateriel = this.impacts.materiels.coutEstime || 0;
  const coutArret = this.impacts.production.coutArret || 0;
  return coutMateriel + coutArret;
};

// Méthode pour vérifier si l'incident est critique
incidentSchema.methods.estCritique = function() {
  return this.gravite === 'Critique' || this.urgence === 'Immédiate';
};

// Méthode pour vérifier si l'incident est en retard
incidentSchema.methods.estEnRetard = function() {
  const actionsEnRetard = this.actionsCorrectives.filter(action => 
    action.dateLimite && action.dateLimite < new Date() && action.statut !== 'Terminée'
  );
  return actionsEnRetard.length > 0;
};

module.exports = mongoose.model('Incident', incidentSchema); 