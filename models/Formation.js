const mongoose = require('mongoose');

const formationSchema = new mongoose.Schema({
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
    enum: ['Formation initiale', 'Formation continue', 'Recyclage', 'Formation spécifique', 'Sensibilisation'],
    required: true
  },

  // Contenu et objectifs
  objectifs: [{
    description: String,
    type: {
      type: String,
      enum: ['Connaissance', 'Compétence', 'Attitude']
    }
  }],
  programme: [{
    titre: String,
    description: String,
    duree: Number, // minutes
    ordre: Number
  }],
  prerequis: [String],
  supports: [{
    nom: String,
    type: {
      type: String,
      enum: ['Document', 'Vidéo', 'Présentation', 'Exercice pratique']
    },
    url: String
  }],

  // Planning
  datePlanification: {
    type: Date,
    required: true
  },
  dateDebut: Date,
  dateFin: Date,
  duree: {
    type: Number, // heures
    required: true
  },
  horaires: {
    debut: String, // format HH:MM
    fin: String,
    pause: Number // minutes
  },

  // Lieu et modalité
  lieu: {
    type: String,
    enum: ['Interne', 'Externe', 'Virtuel'],
    required: true
  },
  adresse: {
    rue: String,
    ville: String,
    codePostal: String,
    pays: String
  },
  salle: String,
  capacite: Number,

  // Formateur
  formateur: {
    nom: String,
    prenom: String,
    organisme: String,
    specialite: String,
    contact: {
      email: String,
      telephone: String
    }
  },

  // Participants
  participants: [{
    employe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    statut: {
      type: String,
      enum: ['Inscrit', 'Présent', 'Absent', 'Terminé'],
      default: 'Inscrit'
    },
    dateInscription: {
      type: Date,
      default: Date.now
    },
    evaluation: {
      note: {
        type: Number,
        min: 0,
        max: 20
      },
      commentaires: String,
      competencesAcquises: [String]
    },
    certificat: {
      numero: String,
      dateEmission: Date,
      dateExpiration: Date,
      statut: {
        type: String,
        enum: ['Valide', 'Expiré', 'À renouveler']
      }
    }
  }],

  // Coûts
  couts: {
    formation: Number,
    materiel: Number,
    deplacement: Number,
    hebergement: Number,
    total: Number
  },

  // Évaluation de la formation
  evaluationFormation: {
    satisfaction: {
      type: Number,
      min: 1,
      max: 5
    },
    pertinence: {
      type: Number,
      min: 1,
      max: 5
    },
    qualitePedagogique: {
      type: Number,
      min: 1,
      max: 5
    },
    commentaires: [String]
  },

  // Statut et workflow
  statut: {
    type: String,
    enum: ['Planifiée', 'En cours', 'Terminée', 'Annulée', 'Reportée'],
    default: 'Planifiée'
  },
  priorite: {
    type: String,
    enum: ['Basse', 'Normale', 'Haute', 'Critique'],
    default: 'Normale'
  },

  // Références réglementaires
  referencesReglementaires: [{
    texte: String,
    article: String,
    organisme: String
  }],

  // Suivi et rappels
  rappels: [{
    date: Date,
    type: {
      type: String,
      enum: ['Inscription', 'Rappel', 'Évaluation']
    },
    envoye: {
      type: Boolean,
      default: false
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

// Index pour les recherches
// formationSchema.index({ numero: 1 }); // Déjà indexé par unique: true
formationSchema.index({ type: 1, categorie: 1 });
formationSchema.index({ statut: 1 });
formationSchema.index({ datePlanification: 1 });
formationSchema.index({ 'participants.employe': 1 });

// Méthodes statiques
formationSchema.statics.getFormationsByUser = function(userId) {
  return this.find({
    'participants.employe': userId,
    isArchived: false
  }).populate('participants.employe', 'nom prenom matricule');
};

// Méthode statique pour obtenir les formations expirantes
formationSchema.statics.getFormationsExpirantes = function(days = 30) {
  const dateLimite = new Date();
  dateLimite.setDate(dateLimite.getDate() + days);
  
  return this.find({
    dateExpiration: { $lte: dateLimite },
    isArchived: false
  }).populate('createdBy', 'nom prenom');
};

// Middleware pre-save pour calculer automatiquement le coût total et générer le numéro
formationSchema.pre('save', async function(next) {
  try {
    // Générer automatiquement le numéro si pas fourni
    if (this.isNew && !this.numero) {
      const timestamp = new Date().getFullYear();
      const count = await this.constructor.countDocuments({});
      this.numero = `FORM-${timestamp}-${String(count + 1).padStart(4, '0')}`;
    }
    
    // Calculer le coût total
    if (this.couts) {
      this.couts.total = (this.couts.formation || 0) + 
                        (this.couts.materiel || 0) + 
                        (this.couts.deplacement || 0) + 
                        (this.couts.hebergement || 0);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Formation', formationSchema); 