const mongoose = require('mongoose');

/**
 * Schéma pour les analyses de laboratoire
 */
const analyseSchema = new mongoose.Schema({
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
  
  // Type d'analyse
  type: {
    type: String,
    enum: [
      'Physico-chimique',
      'Microbiologique',
      'Organoleptique',
      'Sensorielles',
      'Autre'
    ],
    required: true
  },
  
  // Catégorie spécifique
  categorie: {
    type: String,
    enum: [
      // Physico-chimiques
      'pH', 'Humidité', 'Densité', 'Brix', 'Sel', 'Protéines', 'Graisses',
      'Acidité', 'Viscosité', 'Couleur', 'Texture',
      // Microbiologiques
      'Bactéries totales', 'Coliformes', 'E. coli', 'Salmonella', 
      'Listeria', 'Levures', 'Moisissures', 'Staphylocoques',
      // Organoleptiques
      'Goût', 'Odeur', 'Texture', 'Couleur', 'Aspect général'
    ],
    required: true
  },
  
  // Méthode d'analyse
  methode: {
    reference: String, // Ex: ISO 22000, Codex Alimentarius
    description: String,
    version: String,
    appareil: String,
    conditions: {
      temperature: Number,
      humidite: Number,
      duree: Number, // en minutes
      autres: String
    }
  },
  
  // Seuils et critères
  seuils: {
    seuilMin: Number,
    seuilMax: Number,
    unite: String,
    tolerance: Number, // tolérance en %
    critere: {
      type: String,
      enum: ['≤', '≥', '=', '±', 'Entre'],
      default: 'Entre'
    }
  },
  
  // Résultats
  resultats: {
    valeur: Number,
    unite: String,
    statut: {
      type: String,
      enum: ['Conforme', 'Non conforme', 'Limite', 'En attente'],
      default: 'En attente'
    },
    commentaire: String,
    dateAnalyse: Date,
    technicien: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    validation: {
      valide: Boolean,
      validePar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      dateValidation: Date,
      commentaire: String
    }
  },
  
  // Échantillon associé
  echantillon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Echantillon',
    required: true
  },
  
  // Plan de contrôle
  planControle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlanControle'
  },
  
  // Statut de l'analyse
  statut: {
    type: String,
    enum: [
      'Planifiée',
      'En cours',
      'Terminée',
      'Validée',
      'Rejetée',
      'Annulée'
    ],
    default: 'Planifiée'
  },
  
  // Priorité
  priorite: {
    type: String,
    enum: ['Faible', 'Normale', 'Élevée', 'Critique'],
    default: 'Normale'
  },
  
  // Planning
  datePlanification: {
    type: Date,
    required: true
  },
  dateDebut: Date,
  dateFin: Date,
  dureeEstimee: Number, // en minutes
  
  // Données brutes et calculs
  donneesBrutes: [{
    parametre: String,
    valeur: Number,
    unite: String,
    methode: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Calculs intermédiaires
  calculs: [{
    nom: String,
    formule: String,
    valeur: Number,
    unite: String,
    description: String
  }],
  
  // Incertitude de mesure
  incertitude: {
    type: Number,
    unite: String,
    niveauConfiance: Number, // en %
    facteurK: Number
  },
  
  // Documents et fichiers
  documents: [{
    type: {
      type: String,
      enum: ['Méthode', 'Résultat brut', 'Graphique', 'Photo', 'Certificat', 'Autre']
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
// analyseSchema.index({ numero: 1 }); // Déjà indexé par unique: true
analyseSchema.index({ type: 1 });
analyseSchema.index({ categorie: 1 });
analyseSchema.index({ echantillon: 1 });
analyseSchema.index({ statut: 1 });
analyseSchema.index({ datePlanification: -1 });

// Méthode pour vérifier la conformité
analyseSchema.methods.verifierConformite = function() {
  const valeur = this.resultats.valeur;
  const seuilMin = this.seuils.seuilMin;
  const seuilMax = this.seuils.seuilMax;
  const critere = this.seuils.critere;
  
  if (!valeur && valeur !== 0) {
    this.resultats.statut = 'En attente';
    return 'En attente';
  }
  
  let conforme = false;
  
  switch (critere) {
    case '≤':
      conforme = valeur <= seuilMax;
      break;
    case '≥':
      conforme = valeur >= seuilMin;
      break;
    case '=':
      conforme = valeur === seuilMin;
      break;
    case '±':
      const tolerance = this.seuils.tolerance || 5;
      const ecart = Math.abs(valeur - seuilMin);
      conforme = ecart <= (seuilMin * tolerance / 100);
      break;
    case 'Entre':
    default:
      conforme = valeur >= seuilMin && valeur <= seuilMax;
      break;
  }
  
  this.resultats.statut = conforme ? 'Conforme' : 'Non conforme';
  return this.resultats.statut;
};

// Méthode pour calculer l'incertitude
analyseSchema.methods.calculerIncertitude = function() {
  // Logique de calcul d'incertitude selon la méthode
  // À implémenter selon les règles métier
  if (this.donneesBrutes && this.donneesBrutes.length > 0) {
    // Calcul basique de l'écart-type
    const valeurs = this.donneesBrutes.map(d => d.valeur);
    const moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
    const variance = valeurs.reduce((a, b) => a + Math.pow(b - moyenne, 2), 0) / valeurs.length;
    this.incertitude = Math.sqrt(variance);
  }
  return this.incertitude;
};

// Méthode pour valider l'analyse
analyseSchema.methods.valider = function(utilisateur, commentaire = '') {
  this.resultats.validation = {
    valide: true,
    validePar: utilisateur,
    dateValidation: new Date(),
    commentaire
  };
  this.statut = 'Validée';
  this.ajouterHistorique('Validation', `Analyse validée par ${utilisateur}`, utilisateur);
};

// Méthode pour rejeter l'analyse
analyseSchema.methods.rejeter = function(utilisateur, commentaire = '') {
  this.resultats.validation = {
    valide: false,
    validePar: utilisateur,
    dateValidation: new Date(),
    commentaire
  };
  this.statut = 'Rejetée';
  this.ajouterHistorique('Rejet', `Analyse rejetée par ${utilisateur}: ${commentaire}`, utilisateur);
};

// Méthode pour ajouter une entrée à l'historique
analyseSchema.methods.ajouterHistorique = function(action, description, utilisateur, ancienneValeur = null, nouvelleValeur = null) {
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
analyseSchema.pre('save', function(next) {
  // Générer automatiquement le numéro si pas fourni
  if (this.isNew && !this.numero) {
    const timestamp = new Date().getFullYear();
    const count = this.constructor.countDocuments({});
    this.numero = `ANA-${timestamp}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Vérifier la conformité si la valeur est définie
  if (this.resultats.valeur !== undefined && this.resultats.valeur !== null) {
    this.verifierConformite();
  }
  
  next();
});

module.exports = mongoose.model('Analyse', analyseSchema);
