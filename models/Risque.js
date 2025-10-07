const mongoose = require('mongoose');

const risqueSchema = new mongoose.Schema({
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
    enum: ['Sécurité', 'Qualité', 'Environnement', 'Hygiène', 'Santé', 'Mixte'],
    required: true
  },
  categorie: {
    type: String,
    enum: ['Risque chimique', 'Risque biologique', 'Risque physique', 'Risque ergonomique', 'Risque psychosocial', 'Risque environnemental', 'Autre'],
    required: true
  },

  // Évaluation du risque
  probabilite: {
    type: String,
    enum: ['Très faible', 'Faible', 'Modérée', 'Élevée', 'Très élevée'],
    required: true
  },
  gravite: {
    type: String,
    enum: ['Négligeable', 'Faible', 'Modérée', 'Élevée', 'Critique'],
    required: true
  },
  niveauRisque: {
    type: String,
    enum: ['Faible', 'Modéré', 'Élevé', 'Critique'],
    required: true
  },
  scoreRisque: {
    type: Number,
    min: 1,
    max: 25,
    required: true
  },

  // Localisation et contexte
  localisation: {
    zone: String,
    batiment: String,
    etage: String,
    poste: String,
    coordonnees: {
      latitude: Number,
      longitude: Number
    }
  },
  activite: {
    type: String,
    required: true
  },
  posteTravail: String,
  equipement: String,

  // Personnes exposées
  personnesExposees: [{
    employe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    typeExposition: {
      type: String,
      enum: ['Directe', 'Indirecte', 'Occasionnelle']
    },
    frequenceExposition: {
      type: String,
      enum: ['Ponctuelle', 'Occasionnelle', 'Fréquente', 'Permanente']
    }
  }],

  // Mesures existantes
  mesuresExistentes: [{
    description: String,
    type: {
      type: String,
      enum: ['Prévention', 'Protection', 'Formation', 'Organisationnelle']
    },
    efficacite: {
      type: String,
      enum: ['Faible', 'Modérée', 'Bonne', 'Excellente']
    },
    statut: {
      type: String,
      enum: ['En place', 'À améliorer', 'À mettre en place']
    }
  }],

  // Mesures correctives
  mesuresCorrectives: [{
    description: String,
    type: {
      type: String,
      enum: ['Élimination', 'Substitution', 'Protection collective', 'Protection individuelle', 'Formation', 'Organisationnelle']
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
    efficaciteAttendue: {
      type: String,
      enum: ['Faible', 'Modérée', 'Bonne', 'Excellente']
    }
  }],

  // Suivi et révision
  dateEvaluation: {
    type: Date,
    default: Date.now
  },
  prochaineEvaluation: Date,
  statut: {
    type: String,
    enum: ['Actif', 'Maîtrisé', 'En cours de traitement', 'Archivé'],
    default: 'Actif'
  },

  // Historique des modifications
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
// risqueSchema.index({ numero: 1 }); // Déjà indexé par unique: true
risqueSchema.index({ type: 1, categorie: 1 });
risqueSchema.index({ niveauRisque: 1 });
risqueSchema.index({ statut: 1 });
risqueSchema.index({ 'localisation.zone': 1 });

// Méthodes statiques
risqueSchema.statics.calculerNiveauRisque = function(probabilite, gravite) {
  const scores = {
    'Très faible': 1, 'Faible': 2, 'Modérée': 3, 'Élevée': 4, 'Très élevée': 5,
    'Négligeable': 1, 'Faible': 2, 'Modérée': 3, 'Élevée': 4, 'Critique': 5
  };
  
  const score = scores[probabilite] * scores[gravite];
  
  if (score <= 4) return 'Faible';
  if (score <= 8) return 'Modéré';
  if (score <= 15) return 'Élevé';
  return 'Critique';
};

// Middleware pre-save pour calculer automatiquement le niveau de risque et générer le numéro
risqueSchema.pre('save', async function(next) {
  try {
    // Générer automatiquement le numéro si pas fourni
    if (this.isNew && !this.numero) {
      const timestamp = new Date().getFullYear();
      const count = await this.constructor.countDocuments({});
      this.numero = `RISK-${timestamp}-${String(count + 1).padStart(4, '0')}`;
    }
    
    // Calculer le niveau de risque et le score
    if (this.probabilite && this.gravite) {
      this.niveauRisque = this.constructor.calculerNiveauRisque(this.probabilite, this.gravite);
      
      const scores = {
        'Très faible': 1, 'Faible': 2, 'Modérée': 3, 'Élevée': 4, 'Très élevée': 5,
        'Négligeable': 1, 'Faible': 2, 'Modérée': 3, 'Élevée': 4, 'Critique': 5
      };
      this.scoreRisque = scores[this.probabilite] * scores[this.gravite];
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Risque', risqueSchema); 