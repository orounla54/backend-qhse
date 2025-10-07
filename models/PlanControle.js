const mongoose = require('mongoose');

/**
 * Schéma pour les plans de contrôle
 */
const planControleSchema = new mongoose.Schema({
  // Informations de base
  numero: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nom: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  
  // Type de plan
  type: {
    type: String,
    enum: [
      'Matière première',
      'Produit fini',
      'Processus',
      'Équipement',
      'Environnement',
      'Hygiène',
      'Transport',
      'Autre'
    ],
    required: true
  },
  
  // Produit/Matière concerné
  concerne: {
    type: {
      type: String,
      enum: ['Produit', 'Matière première', 'Processus', 'Équipement', 'Zone'],
      required: true
    },
    reference: String,
    nom: String,
    version: String
  },
  
  // Statut du plan
  statut: {
    type: String,
    enum: ['Brouillon', 'En révision', 'Approuvé', 'Actif', 'Obsolète', 'Archivé'],
    default: 'Brouillon'
  },
  
  // Version
  version: {
    numero: {
      type: String,
      required: true,
      default: '1.0'
    },
    dateCreation: {
      type: Date,
      default: Date.now
    },
    dateRevision: Date,
    prochaineRevision: Date
  },
  
  // Fréquence d'application
  frequence: {
    type: String,
    enum: [
      'Ponctuel',
      'Chaque lot',
      'Quotidien',
      'Hebdomadaire',
      'Mensuel',
      'Trimestriel',
      'Semestriel',
      'Annuel',
      'Sur demande'
    ],
    required: true
  },
  
  // Responsable du plan
  responsable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Équipe de contrôle
  equipe: [{
    membre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Contrôleur', 'Superviseur', 'Expert', 'Observateur']
    },
    competences: [String]
  }],
  
  // Points de contrôle
  pointsControle: [{
    nom: {
      type: String,
      required: true
    },
    description: String,
    type: {
      type: String,
      enum: [
        'Visuel',
        'Organoleptique',
        'Physico-chimique',
        'Microbiologique',
        'Mesure',
        'Test',
        'Vérification',
        'Autre'
      ],
      required: true
    },
    parametreCritique: {
      type: String,
      enum: ['pH', 'Brix', 'Temperature', 'Viscosite', 'Humidite', 'Densite', 'Autre']
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
    frequence: {
      type: String,
      enum: ['Chaque lot', 'Aléatoire', 'Quotidien', 'Hebdomadaire', 'Mensuel', 'Sur demande'],
      default: 'Chaque lot'
    },
    echantillonnage: {
      taille: Number,
      methode: String,
      criteres: String
    },
    norme: String,
    reference: String
  }],
  
  // Critères d'acceptation
  criteresAcceptation: {
    conformite: {
      type: String,
      enum: ['100%', '95%', '90%', '85%', '80%', 'Autre'],
      default: '100%'
    },
    tolerance: Number,
    conditionsParticulieres: [String]
  },
  
  // Procédures
  procedures: [{
    nom: String,
    description: String,
    etapes: [{
      numero: Number,
      description: String,
      duree: Number, // en minutes
      responsable: String,
      documents: [String]
    }],
    documents: [{
      nom: String,
      type: String,
      url: String
    }]
  }],
  
  // Documents de référence
  documents: [{
    type: {
      type: String,
      enum: ['Norme', 'Procédure', 'Instruction', 'Checklist', 'Rapport', 'Autre']
    },
    nom: String,
    version: String,
    url: String,
    dateCreation: Date,
    statut: {
      type: String,
      enum: ['Actif', 'Obsolète', 'En révision'],
      default: 'Actif'
    }
  }],
  
  // Historique des modifications
  historique: [{
    version: String,
    date: Date,
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifications: String,
    raison: String
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
// planControleSchema.index({ numero: 1 }); // Déjà indexé par unique: true
planControleSchema.index({ type: 1 });
planControleSchema.index({ statut: 1 });
planControleSchema.index({ 'concerne.reference': 1 });
planControleSchema.index({ responsable: 1 });

// Méthode pour approuver le plan
planControleSchema.methods.approuver = function(utilisateur, commentaire = '') {
  this.statut = 'Approuvé';
  this.ajouterHistorique('Approbation', `Plan approuvé par ${utilisateur}`, utilisateur, commentaire);
};

// Méthode pour activer le plan
planControleSchema.methods.activer = function(utilisateur, commentaire = '') {
  this.statut = 'Actif';
  this.ajouterHistorique('Activation', `Plan activé par ${utilisateur}`, utilisateur, commentaire);
};

// Méthode pour créer une nouvelle version
planControleSchema.methods.creerNouvelleVersion = function(utilisateur, modifications, raison) {
  const versionActuelle = this.version.numero;
  const nouvelleVersion = (parseFloat(versionActuelle) + 0.1).toFixed(1);
  
  this.version.numero = nouvelleVersion;
  this.version.dateRevision = new Date();
  this.statut = 'En révision';
  
  this.ajouterHistorique('Nouvelle version', `Version ${nouvelleVersion} créée`, utilisateur, modifications, raison);
};

// Méthode pour ajouter une entrée à l'historique
planControleSchema.methods.ajouterHistorique = function(action, description, utilisateur, modifications = '', raison = '') {
  this.historique.push({
    version: this.version.numero,
    date: new Date(),
    utilisateur,
    modifications,
    raison,
    action,
    description
  });
};

// Méthode pour calculer le nombre de points de contrôle obligatoires
planControleSchema.methods.calculerPointsObligatoires = function() {
  return this.pointsControle.filter(point => point.obligatoire).length;
};

// Méthode pour générer une checklist
planControleSchema.methods.genererChecklist = function() {
  return this.pointsControle.map((point, index) => ({
    numero: index + 1,
    nom: point.nom,
    description: point.description,
    type: point.type,
    methode: point.methode,
    appareil: point.appareil,
    unite: point.unite,
    seuilMin: point.seuilMin,
    seuilMax: point.seuilMax,
    obligatoire: point.obligatoire,
    conforme: null, // À remplir lors de l'exécution
    valeur: null, // À remplir lors de l'exécution
    commentaire: null // À remplir lors de l'exécution
  }));
};

// Middleware de pré-sauvegarde
planControleSchema.pre('save', async function(next) {
  // Générer automatiquement le numéro si pas fourni
  if (this.isNew && !this.numero) {
    const timestamp = new Date().getFullYear();
    const count = await this.constructor.countDocuments({});
    this.numero = `PC-${timestamp}-${String(count + 1).padStart(4, '0')}`;
  }
  
  next();
});

module.exports = mongoose.model('PlanControle', planControleSchema);