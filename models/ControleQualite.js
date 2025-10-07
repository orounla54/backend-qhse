const mongoose = require('mongoose');

/**
 * Schéma pour les contrôles qualité
 */
const controleQualiteSchema = new mongoose.Schema({
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
  
  // Type de contrôle
  type: {
    type: String,
    enum: [
      'Réception matières premières',
      'Contrôle en cours de production',
      'Contrôle produit fini',
      'Contrôle environnemental',
      'Contrôle hygiène',
      'Contrôle transport',
      'Autre'
    ],
    required: true
  },
  
  // Produit concerné
  produit: {
    nom: String,
    reference: String,
    lot: String,
    version: String
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
  
  // Planning
  datePlanification: {
    type: Date,
    required: true
  },
  dateDebut: Date,
  dateFin: Date,
  dureeEstimee: Number, // en minutes
  
  // Équipe de contrôle
  controleur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  equipe: [{
    membre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Contrôleur', 'Superviseur', 'Expert', 'Observateur']
    }
  }],
  
  // Critères de contrôle
  criteres: [{
    nom: {
      type: String,
      required: true
    },
    description: String,
    type: {
      type: String,
      enum: ['Visuel', 'Mesure', 'Test', 'Vérification', 'Organoleptique', 'Physico-chimique', 'Microbiologique', 'Autre']
    },
    methode: String,
    appareil: String,
    unite: String,
    seuilMin: Number,
    seuilMax: Number,
    tolerance: Number,
    obligatoire: {
      type: Boolean,
      default: true
    },
    // Paramètres critiques
    parametreCritique: {
      type: String,
      enum: ['pH', 'Brix', 'Temperature', 'Viscosite', 'Humidite', 'Densite', 'Autre']
    },
    frequence: {
      type: String,
      enum: ['Chaque lot', 'Aléatoire', 'Quotidien', 'Hebdomadaire', 'Mensuel', 'Sur demande'],
      default: 'Chaque lot'
    },
    methodeAnalyse: String,
    norme: String // Référence à la norme utilisée
  }],

  // Plan de contrôle
  planControle: {
    nom: String,
    version: String,
    dateCreation: Date,
    dateRevision: Date,
    statut: {
      type: String,
      enum: ['Brouillon', 'Approuvé', 'Actif', 'Obsolète'],
      default: 'Brouillon'
    },
    frequence: {
      type: String,
      enum: ['Ponctuel', 'Quotidien', 'Hebdomadaire', 'Mensuel', 'Trimestriel', 'Annuel'],
      default: 'Ponctuel'
    },
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Résultats
  resultats: [{
    critere: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    valeur: Number,
    unite: String,
    conforme: {
      type: Boolean,
      required: true
    },
    ecart: Number,
    commentaire: String,
    dateMesure: {
      type: Date,
      default: Date.now
    },
    mesureur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Évaluation globale
  evaluation: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    statut: {
      type: String,
      enum: ['Conforme', 'Non conforme', 'Sous réserve', 'En attente'],
      default: 'En attente'
    },
    commentaire: String,
    recommandations: [String]
  },
  
  // Actions correctives
  actionsCorrectives: [{
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
  
  // Statut du contrôle
  statut: {
    type: String,
    enum: [
      'Planifié',
      'En cours',
      'Terminé',
      'Validé',
      'Rejeté',
      'Annulé'
    ],
    default: 'Planifié'
  },
  
  // Priorité
  priorite: {
    type: String,
    enum: ['Faible', 'Normale', 'Élevée', 'Critique'],
    default: 'Normale'
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['Checklist', 'Rapport', 'Photo', 'Vidéo', 'Certificat', 'Autre']
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
// controleQualiteSchema.index({ numero: 1 }); // Déjà indexé par unique: true
controleQualiteSchema.index({ type: 1 });
controleQualiteSchema.index({ statut: 1 });
controleQualiteSchema.index({ datePlanification: -1 });
controleQualiteSchema.index({ controleur: 1 });

// Méthode pour calculer le score
controleQualiteSchema.methods.calculerScore = function() {
  if (!this.resultats || this.resultats.length === 0) {
    this.evaluation.score = 0;
    return 0;
  }
  
  const totalCriteres = this.criteres.length;
  const criteresConformes = this.resultats.filter(r => r.conforme).length;
  
  this.evaluation.score = totalCriteres > 0 ? 
    Math.round((criteresConformes / totalCriteres) * 100) : 0;
  
  return this.evaluation.score;
};

// Méthode pour déterminer le statut
controleQualiteSchema.methods.determinerStatut = function() {
  const score = this.calculerScore();
  
  if (score >= 90) {
    this.evaluation.statut = 'Conforme';
  } else if (score >= 70) {
    this.evaluation.statut = 'Sous réserve';
  } else {
    this.evaluation.statut = 'Non conforme';
  }
  
  return this.evaluation.statut;
};

// Méthode pour ajouter un résultat
controleQualiteSchema.methods.ajouterResultat = function(critereId, valeur, unite, mesureur) {
  const critere = this.criteres.id(critereId);
  if (!critere) {
    throw new Error('Critère non trouvé');
  }
  
  const conforme = valeur >= critere.seuilMin && valeur <= critere.seuilMax;
  const ecart = Math.min(
    Math.abs(valeur - critere.seuilMin),
    Math.abs(valeur - critere.seuilMax)
  );
  
  this.resultats.push({
    critere: critereId,
    valeur,
    unite,
    conforme,
    ecart,
    dateMesure: new Date(),
    mesureur
  });
  
  // Recalculer le score et le statut
  this.calculerScore();
  this.determinerStatut();
};

// Méthode pour valider le contrôle
controleQualiteSchema.methods.valider = function(utilisateur, commentaire = '') {
  this.statut = 'Validé';
  this.ajouterHistorique('Validation', `Contrôle validé par ${utilisateur}`, utilisateur);
};

// Méthode pour rejeter le contrôle
controleQualiteSchema.methods.rejeter = function(utilisateur, commentaire = '') {
  this.statut = 'Rejeté';
  this.ajouterHistorique('Rejet', `Contrôle rejeté par ${utilisateur}: ${commentaire}`, utilisateur);
};

// Méthode pour ajouter une entrée à l'historique
controleQualiteSchema.methods.ajouterHistorique = function(action, description, utilisateur) {
  this.historique.push({
    action,
    description,
    utilisateur,
    date: new Date()
  });
};

// Middleware de pré-sauvegarde
controleQualiteSchema.pre('save', function(next) {
  // Générer automatiquement le numéro si pas fourni
  if (this.isNew && !this.numero) {
    const timestamp = new Date().getFullYear();
    const count = this.constructor.countDocuments({});
    this.numero = `CQ-${timestamp}-${String(count + 1).padStart(4, '0')}`;
  }
  
  next();
});

module.exports = mongoose.model('ControleQualite', controleQualiteSchema);
