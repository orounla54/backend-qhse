const mongoose = require('mongoose');

/**
 * Schéma pour les décisions qualité
 */
const decisionQualiteSchema = new mongoose.Schema({
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
  description: String,
  
  // Type de décision
  type: {
    type: String,
    enum: [
      'Acceptation',
      'Acceptation sous réserve',
      'Rejet',
      'Mise en quarantaine',
      'Destruction',
      'Retour fournisseur',
      'Retraitement',
      'Dégradation',
      'Autre'
    ],
    required: true
  },
  
  // Contexte de la décision
  contexte: {
    type: {
      type: String,
      enum: ['Matière première', 'Produit fini', 'Processus', 'Équipement', 'Système'],
      required: true
    },
    reference: String, // Référence du produit/matière concerné
    lot: String,
    quantite: Number,
    unite: String
  },
  
  // Matière première concernée
  matierePremiere: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MatierePremiere'
  },
  
  // Contrôle qualité associé
  controleQualite: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ControleQualite'
  },
  
  // Non-conformité associée
  nonConformite: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NonConformite'
  },
  
  // Décisionnaire
  decisionnaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Date de décision
  dateDecision: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Justification
  justification: {
    type: String,
    required: true
  },
  
  // Critères de décision
  criteresDecision: [{
    critere: String,
    valeur: String,
    conforme: Boolean,
    commentaire: String
  }],
  
  // Conditions particulières
  conditions: [{
    description: String,
    obligatoire: Boolean,
    respectee: Boolean,
    commentaire: String
  }],
  
  // Actions à suivre
  actionsSuivantes: [{
    description: String,
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateLimite: Date,
    statut: {
      type: String,
      enum: ['À faire', 'En cours', 'Terminée', 'Annulée'],
      default: 'À faire'
    },
    commentaire: String
  }],
  
  // Validation hiérarchique
  validation: {
    niveau: {
      type: String,
      enum: ['Contrôleur', 'Superviseur', 'Responsable Qualité', 'Direction'],
      required: true
    },
    validateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateValidation: Date,
    commentaire: String,
    statut: {
      type: String,
      enum: ['En attente', 'Validée', 'Rejetée'],
      default: 'En attente'
    }
  },
  
  // Statut de la décision
  statut: {
    type: String,
    enum: [
      'En attente',
      'Validée',
      'Rejetée',
      'Appliquée',
      'Annulée'
    ],
    default: 'En attente'
  },
  
  // Priorité
  priorite: {
    type: String,
    enum: ['Faible', 'Normale', 'Élevée', 'Critique'],
    default: 'Normale'
  },
  
  // Impact
  impact: {
    production: {
      arret: Boolean,
      duree: Number, // en heures
      cout: Number
    },
    qualite: {
      produitsConcernes: Number,
      risqueClient: String,
      cout: Number
    },
    commercial: {
      clientsConcernes: Number,
      perteChiffreAffaires: Number
    }
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['Rapport', 'Analyse', 'Photo', 'Certificat', 'Autre']
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
// decisionQualiteSchema.index({ numero: 1 }); // Déjà indexé par unique: true
decisionQualiteSchema.index({ type: 1 });
decisionQualiteSchema.index({ statut: 1 });
decisionQualiteSchema.index({ dateDecision: -1 });
decisionQualiteSchema.index({ decisionnaire: 1 });

// Méthode pour valider la décision
decisionQualiteSchema.methods.valider = function(validateur, commentaire = '') {
  this.validation.statut = 'Validée';
  this.validation.validateur = validateur;
  this.validation.dateValidation = new Date();
  this.validation.commentaire = commentaire;
  this.statut = 'Validée';
  this.ajouterHistorique('Validation', `Décision validée par ${validateur}`, validateur);
};

// Méthode pour rejeter la décision
decisionQualiteSchema.methods.rejeter = function(validateur, commentaire = '') {
  this.validation.statut = 'Rejetée';
  this.validation.validateur = validateur;
  this.validation.dateValidation = new Date();
  this.validation.commentaire = commentaire;
  this.statut = 'Rejetée';
  this.ajouterHistorique('Rejet', `Décision rejetée par ${validateur}: ${commentaire}`, validateur);
};

// Méthode pour appliquer la décision
decisionQualiteSchema.methods.appliquer = function(utilisateur, commentaire = '') {
  this.statut = 'Appliquée';
  this.ajouterHistorique('Application', `Décision appliquée par ${utilisateur}`, utilisateur);
};

// Méthode pour ajouter une entrée à l'historique
decisionQualiteSchema.methods.ajouterHistorique = function(action, description, utilisateur) {
  this.historique.push({
    action,
    description,
    utilisateur,
    date: new Date()
  });
};

// Middleware de pré-sauvegarde
decisionQualiteSchema.pre('save', function(next) {
  // Générer automatiquement le numéro si pas fourni
  if (this.isNew && !this.numero) {
    const timestamp = new Date().getFullYear();
    const count = this.constructor.countDocuments({});
    this.numero = `DQ-${timestamp}-${String(count + 1).padStart(4, '0')}`;
  }
  
  next();
});

module.exports = mongoose.model('DecisionQualite', decisionQualiteSchema);
