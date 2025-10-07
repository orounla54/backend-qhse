const mongoose = require('mongoose');

/**
 * Schéma pour les non-conformités
 */
const nonConformiteSchema = new mongoose.Schema({
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
    required: true
  },
  
  // Type de non-conformité
  type: {
    type: String,
    enum: [
      'Produit',
      'Processus',
      'Système',
      'Documentation',
      'Formation',
      'Équipement',
      'Fournisseur',
      'Autre'
    ],
    required: true
  },
  
  // Catégorie
  categorie: {
    type: String,
    enum: [
      'Critique',
      'Majeure',
      'Mineure',
      'Observation'
    ],
    required: true
  },
  
  // Gravité
  gravite: {
    type: String,
    enum: ['Faible', 'Modérée', 'Élevée', 'Critique'],
    required: true
  },
  
  // Détection
  detection: {
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    detecteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    methode: {
      type: String,
      enum: ['Audit', 'Contrôle', 'Inspection', 'Signalement', 'Autre']
    },
    source: String
  },
  
  // Localisation
  localisation: {
    zone: String,
    ligne: String,
    poste: String,
    coordonnees: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Produit/Processus concerné
  concerne: {
    type: {
      type: String,
      enum: ['Produit', 'Processus', 'Système', 'Document', 'Formation', 'Autre']
    },
    reference: String,
    lot: String,
    version: String,
    quantite: Number,
    unite: String
  },
  
  // Impact
  impact: {
    production: {
      arret: Boolean,
      duree: Number, // en heures
      quantitePerdue: Number,
      cout: Number
    },
    qualite: {
      produitsConcernes: Number,
      risqueClient: String,
      cout: Number
    },
    securite: {
      risque: String,
      niveau: {
        type: String,
        enum: ['Faible', 'Modéré', 'Élevé', 'Critique']
      }
    },
    environnement: {
      pollution: Boolean,
      type: String,
      impact: String
    }
  },
  
  // Causes
  causes: [{
    type: {
      type: String,
      enum: ['Humaine', 'Technique', 'Organisationnelle', 'Environnementale', 'Fournisseur']
    },
    description: String,
    facteur: String,
    probabilite: {
      type: String,
      enum: ['Faible', 'Modérée', 'Élevée', 'Certaine']
    }
  }],

  // Analyse des causes (5 pourquoi)
  analyseCinqPourquoi: [{
    question: String,
    reponse: String,
    niveau: Number, // 1 à 5
    causeRacine: Boolean
  }],

  // Diagramme d'Ishikawa (arête de poisson)
  diagrammeIshikawa: {
    materiel: [String],
    methode: [String],
    mainOeuvre: [String],
    milieu: [String],
    machine: [String],
    mesure: [String]
  },

  // Analyse AMDEC
  amdec: [{
    defaillance: String,
    effet: String,
    cause: String,
    gravite: {
      type: Number,
      min: 1,
      max: 10
    },
    occurrence: {
      type: Number,
      min: 1,
      max: 10
    },
    detection: {
      type: Number,
      min: 1,
      max: 10
    },
    criticite: Number, // Calculé: gravite × occurrence × detection
    actions: [String]
  }],
  
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
    },
    efficacite: {
      type: String,
      enum: ['Non évaluée', 'Efficace', 'Partiellement efficace', 'Non efficace']
    },
    commentaire: String
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
    commentaire: String,
    verification: {
      verificateur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      dateVerification: Date,
      resultat: String
    }
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
  
  // Statut
  statut: {
    type: String,
    enum: [
      'Déclarée',
      'En investigation',
      'En traitement',
      'Résolue',
      'Fermée',
      'Clôturée'
    ],
    default: 'Déclarée'
  },
  
  // Priorité
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
  
  // Fermeture
  fermeture: {
    date: Date,
    fermePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    commentaire: String,
    efficaciteGlobale: {
      type: String,
      enum: ['Efficace', 'Partiellement efficace', 'Non efficace']
    }
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['Déclaration', 'Rapport', 'Photo', 'Vidéo', 'Certificat', 'Autre']
    },
    nom: String,
    url: String,
    dateUpload: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Historique
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
// nonConformiteSchema.index({ numero: 1 }); // Déjà indexé par unique: true
nonConformiteSchema.index({ type: 1 });
nonConformiteSchema.index({ categorie: 1 });
nonConformiteSchema.index({ statut: 1 });
nonConformiteSchema.index({ gravite: 1 });
nonConformiteSchema.index({ 'detection.date': -1 });

// Méthode pour calculer le coût total
nonConformiteSchema.methods.calculerCoutTotal = function() {
  const coutProduction = this.impact.production.cout || 0;
  const coutQualite = this.impact.qualite.cout || 0;
  return coutProduction + coutQualite;
};

// Méthode pour calculer le délai de résolution
nonConformiteSchema.methods.calculerDelaiResolution = function() {
  if (this.fermeture && this.fermeture.date && this.detection.date) {
    const diff = this.fermeture.date - this.detection.date;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)); // en jours
  }
  return null;
};

// Méthode pour vérifier si la NC est en retard
nonConformiteSchema.methods.estEnRetard = function() {
  const actionsEnRetard = this.actionsCorrectives.filter(action => 
    action.dateLimite && action.dateLimite < new Date() && action.statut !== 'Terminée'
  );
  return actionsEnRetard.length > 0;
};

// Méthode pour fermer la non-conformité
nonConformiteSchema.methods.fermer = function(utilisateur, commentaire = '', efficaciteGlobale = 'Efficace') {
  this.statut = 'Fermée';
  this.fermeture = {
    date: new Date(),
    fermePar: utilisateur,
    commentaire,
    efficaciteGlobale
  };
  this.ajouterHistorique('Fermeture', `Non-conformité fermée par ${utilisateur}`, utilisateur);
};

// Méthode pour clôturer la non-conformité
nonConformiteSchema.methods.cloturer = function(utilisateur, commentaire = '') {
  this.statut = 'Clôturée';
  this.ajouterHistorique('Clôture', `Non-conformité clôturée par ${utilisateur}`, utilisateur);
};

// Méthode pour ajouter une entrée à l'historique
nonConformiteSchema.methods.ajouterHistorique = function(action, description, utilisateur) {
  this.historique.push({
    action,
    description,
    utilisateur,
    date: new Date()
  });
};

// Méthode pour calculer la criticité AMDEC
nonConformiteSchema.methods.calculerCriticiteAmdec = function() {
  this.amdec.forEach(item => {
    item.criticite = item.gravite * item.occurrence * item.detection;
  });
};

// Méthode pour identifier les causes racines
nonConformiteSchema.methods.identifierCausesRacines = function() {
  return this.analyseCinqPourquoi.filter(item => item.causeRacine);
};

// Méthode pour générer le diagramme d'Ishikawa
nonConformiteSchema.methods.genererDiagrammeIshikawa = function() {
  const diagramme = {
    materiel: [],
    methode: [],
    mainOeuvre: [],
    milieu: [],
    machine: [],
    mesure: []
  };

  // Analyser les causes existantes et les classer
  this.causes.forEach(cause => {
    switch (cause.type) {
      case 'Technique':
        diagramme.machine.push(cause.description);
        break;
      case 'Humaine':
        diagramme.mainOeuvre.push(cause.description);
        break;
      case 'Organisationnelle':
        diagramme.methode.push(cause.description);
        break;
      case 'Environnementale':
        diagramme.milieu.push(cause.description);
        break;
    }
  });

  return diagramme;
};

// Middleware de pré-sauvegarde
nonConformiteSchema.pre('save', function(next) {
  // Générer automatiquement le numéro si pas fourni
  if (this.isNew && !this.numero) {
    const timestamp = new Date().getFullYear();
    const count = this.constructor.countDocuments({});
    this.numero = `NC-${timestamp}-${String(count + 1).padStart(4, '0')}`;
  }
  
  next();
});

module.exports = mongoose.model('NonConformite', nonConformiteSchema);
