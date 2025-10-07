const mongoose = require('mongoose');

/**
 * Schéma pour les résultats d'analyses de laboratoire
 */
const resultatAnalyseSchema = new mongoose.Schema({
  // Informations de base
  numero: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Analyse associée
  analyse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analyse',
    required: true
  },
  
  // Échantillon associé
  echantillon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Echantillon',
    required: true
  },
  
  // Résultats de mesure
  resultats: [{
    parametre: {
      type: String,
      required: true
    },
    valeur: {
      type: Number,
      required: true
    },
    unite: {
      type: String,
      required: true
    },
    methode: String,
    appareil: String,
    conditions: {
      temperature: Number,
      humidite: Number,
      pression: Number
    },
    dateMesure: {
      type: Date,
      default: Date.now
    },
    technicien: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Calculs et interprétations
  calculs: [{
    nom: String,
    formule: String,
    valeur: Number,
    unite: String,
    description: String,
    methode: String
  }],
  
  // Évaluation de conformité
  conformite: {
    statut: {
      type: String,
      enum: ['Conforme', 'Non conforme', 'Limite', 'En attente'],
      required: true
    },
    criteres: [{
      parametre: String,
      valeur: Number,
      seuilMin: Number,
      seuilMax: Number,
      conforme: Boolean,
      ecart: Number,
      unite: String
    }],
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    commentaire: String
  },
  
  // Incertitude de mesure
  incertitude: {
    type: Number,
    unite: String,
    niveauConfiance: Number, // en %
    facteurK: Number,
    methodeCalcul: String
  },
  
  // Validation
  validation: {
    valide: {
      type: Boolean,
      default: false
    },
    validePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateValidation: Date,
    commentaire: String,
    niveau: {
      type: String,
      enum: ['Technicien', 'Superviseur', 'Responsable', 'Expert'],
      default: 'Technicien'
    }
  },
  
  // Statut du résultat
  statut: {
    type: String,
    enum: [
      'Brouillon',
      'En cours',
      'Terminé',
      'Validé',
      'Rejeté',
      'En révision'
    ],
    default: 'Brouillon'
  },
  
  // Documents et fichiers
  documents: [{
    type: {
      type: String,
      enum: ['Résultat brut', 'Graphique', 'Photo', 'Certificat', 'Rapport', 'Autre']
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
    },
    ancienneValeur: mongoose.Schema.Types.Mixed,
    nouvelleValeur: mongoose.Schema.Types.Mixed
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
// resultatAnalyseSchema.index({ numero: 1 }); // Déjà indexé par unique: true
resultatAnalyseSchema.index({ analyse: 1 });
resultatAnalyseSchema.index({ echantillon: 1 });
resultatAnalyseSchema.index({ 'conformite.statut': 1 });
resultatAnalyseSchema.index({ statut: 1 });
resultatAnalyseSchema.index({ createdAt: -1 });

// Méthode pour calculer la conformité
resultatAnalyseSchema.methods.calculerConformite = function() {
  if (!this.resultats || this.resultats.length === 0) {
    this.conformite.statut = 'En attente';
    return 'En attente';
  }
  
  let totalConformes = 0;
  let totalParametres = 0;
  
  this.conformite.criteres = [];
  
  this.resultats.forEach(resultat => {
    const critere = {
      parametre: resultat.parametre,
      valeur: resultat.valeur,
      unite: resultat.unite
    };
    
    // Récupérer les seuils depuis l'analyse associée
    // Cette logique devrait être adaptée selon la structure des données
    const seuilMin = 0; // À récupérer depuis l'analyse
    const seuilMax = 100; // À récupérer depuis l'analyse
    
    critere.seuilMin = seuilMin;
    critere.seuilMax = seuilMax;
    critere.conforme = resultat.valeur >= seuilMin && resultat.valeur <= seuilMax;
    critere.ecart = Math.min(
      Math.abs(resultat.valeur - seuilMin),
      Math.abs(resultat.valeur - seuilMax)
    );
    
    this.conformite.criteres.push(critere);
    
    totalParametres++;
    if (critere.conforme) {
      totalConformes++;
    }
  });
  
  // Calculer le score de conformité
  this.conformite.score = totalParametres > 0 ? 
    Math.round((totalConformes / totalParametres) * 100) : 0;
  
  // Déterminer le statut
  if (this.conformite.score >= 90) {
    this.conformite.statut = 'Conforme';
  } else if (this.conformite.score >= 70) {
    this.conformite.statut = 'Limite';
  } else {
    this.conformite.statut = 'Non conforme';
  }
  
  return this.conformite.statut;
};

// Méthode pour valider le résultat
resultatAnalyseSchema.methods.valider = function(utilisateur, niveau = 'Technicien', commentaire = '') {
  this.validation = {
    valide: true,
    validePar: utilisateur,
    dateValidation: new Date(),
    commentaire,
    niveau
  };
  this.statut = 'Validé';
  this.ajouterHistorique('Validation', `Résultat validé par ${utilisateur}`, utilisateur);
};

// Méthode pour rejeter le résultat
resultatAnalyseSchema.methods.rejeter = function(utilisateur, commentaire = '') {
  this.validation = {
    valide: false,
    validePar: utilisateur,
    dateValidation: new Date(),
    commentaire,
    niveau: 'Superviseur'
  };
  this.statut = 'Rejeté';
  this.ajouterHistorique('Rejet', `Résultat rejeté par ${utilisateur}: ${commentaire}`, utilisateur);
};

// Méthode pour calculer l'incertitude
resultatAnalyseSchema.methods.calculerIncertitude = function() {
  if (!this.resultats || this.resultats.length === 0) {
    return 0;
  }
  
  // Calcul basique de l'incertitude basé sur l'écart-type
  const valeurs = this.resultats.map(r => r.valeur);
  const moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
  const variance = valeurs.reduce((a, b) => a + Math.pow(b - moyenne, 2), 0) / valeurs.length;
  this.incertitude = Math.sqrt(variance);
  
  return this.incertitude;
};

// Méthode pour ajouter une entrée à l'historique
resultatAnalyseSchema.methods.ajouterHistorique = function(action, description, utilisateur, ancienneValeur = null, nouvelleValeur = null) {
  this.historique.push({
    action,
    description,
    utilisateur,
    date: new Date(),
    ancienneValeur,
    nouvelleValeur
  });
};

// Middleware de pré-sauvegarde
resultatAnalyseSchema.pre('save', function(next) {
  // Générer automatiquement le numéro si pas fourni
  if (this.isNew && !this.numero) {
    const timestamp = new Date().getFullYear();
    const count = this.constructor.countDocuments({});
    this.numero = `RES-${timestamp}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculer la conformité si les résultats sont définis
  if (this.resultats && this.resultats.length > 0) {
    this.calculerConformite();
  }
  
  next();
});

module.exports = mongoose.model('ResultatAnalyse', resultatAnalyseSchema);
