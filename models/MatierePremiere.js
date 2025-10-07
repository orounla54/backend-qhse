const mongoose = require('mongoose');

/**
 * Schéma pour les matières premières
 */
const matierePremiereSchema = new mongoose.Schema({
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
  reference: String,
  
  // Fournisseur
  fournisseur: {
    nom: {
      type: String,
      required: true,
      trim: true
    },
    code: String,
    contact: {
      email: String,
      telephone: String,
      adresse: String
    },
    certification: [String] // ISO, HACCP, etc.
  },
  
  // Caractéristiques
  caracteristiques: {
    type: {
      type: String,
      enum: ['Végétale', 'Animale', 'Minérale', 'Chimique', 'Autre']
    },
    categorie: String,
    famille: String, // Nouvelle propriété pour la famille de matière
    unite: {
      type: String,
      enum: ['kg', 'g', 'l', 'ml', 'pièce', 'm²', 'm³'],
      default: 'kg'
    },
    dureeConservation: Number, // en jours
    temperatureStockage: {
      min: Number,
      max: Number,
      unite: {
        type: String,
        enum: ['°C', '°F'],
        default: '°C'
      }
    },
    conditionsSpeciales: String,
    // Spécifications techniques
    specifications: {
      pH: { min: Number, max: Number },
      humidite: { min: Number, max: Number, unite: String },
      densite: { min: Number, max: Number, unite: String },
      viscosite: { min: Number, max: Number, unite: String },
      brix: { min: Number, max: Number },
      autres: [{
        nom: String,
        valeur: String,
        unite: String
      }]
    }
  },
  
  // Critères de réception
  criteresReception: {
    aspect: String,
    couleur: String,
    odeur: String,
    texture: String,
    pH: {
      min: Number,
      max: Number
    },
    humidite: {
      min: Number,
      max: Number,
      unite: String
    },
    autres: [String]
  },
  
  // Contrôles qualité
  controlesQualite: [{
    type: {
      type: String,
      enum: ['Visuel', 'Organoleptique', 'Physico-chimique', 'Microbiologique', 'Autre']
    },
    description: String,
    frequence: {
      type: String,
      enum: ['Chaque lot', 'Aléatoire', 'Sur demande'],
      default: 'Chaque lot'
    },
    methode: String,
    criteres: {
      seuilMin: Number,
      seuilMax: Number,
      unite: String
    }
  }],
  
  // Statut
  statut: {
    type: String,
    enum: ['Actif', 'Suspendu', 'Archivé', 'En révision'],
    default: 'Actif'
  },
  
  // Historique des lots
  lots: [{
    numeroLot: {
      type: String,
      required: true
    },
    dateReception: {
      type: Date,
      required: true
    },
    quantite: {
      type: Number,
      required: true
    },
    unite: String,
    datePeremption: Date,
    statut: {
      type: String,
      enum: ['En stock', 'Utilisé', 'Périmé', 'Rejeté', 'Retiré'],
      default: 'En stock'
    },
    controles: [{
      type: String,
      resultat: {
        type: String,
        enum: ['Conforme', 'Non conforme', 'Sous réserve']
      },
      date: Date,
      responsable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      commentaire: String
    }],
    decisionQualite: {
      statut: {
        type: String,
        enum: ['Accepté', 'Rejeté', 'Sous réserve', 'En attente'],
        default: 'En attente'
      },
      dateDecision: Date,
      decideur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      commentaire: String
    }
  }],
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['Fiche technique', 'Certificat', 'FDS', 'Certificat d\'analyse', 'COA', 'Certificat Bio', 'Certificat Halal', 'Certificat Kosher', 'Autre']
    },
    nom: String,
    url: String,
    version: String,
    dateUpload: {
      type: Date,
      default: Date.now
    },
    dateExpiration: Date, // Pour les certificats
    statut: {
      type: String,
      enum: ['Valide', 'Expiré', 'En cours de renouvellement'],
      default: 'Valide'
    }
  }],

  // Certificats spéciaux
  certificats: [{
    type: {
      type: String,
      enum: ['Bio', 'Halal', 'Kosher', 'ISO', 'HACCP', 'BRC', 'IFS', 'Autre']
    },
    numero: String,
    organisme: String,
    dateEmission: Date,
    dateExpiration: Date,
    statut: {
      type: String,
      enum: ['Valide', 'Expiré', 'En cours de renouvellement', 'Suspendu'],
      default: 'Valide'
    },
    conditions: [String],
    document: String // URL du document
  }],

  // Gestion des stocks critiques
  stockCritique: {
    seuilMinimum: Number,
    seuilMaximum: Number,
    alertePeremption: Number, // jours avant péremption
    alerteStock: Boolean,
    alertePeremptionActive: Boolean
  },
  
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
// matierePremiereSchema.index({ numero: 1 }); // Déjà indexé par unique: true
matierePremiereSchema.index({ nom: 1 });
matierePremiereSchema.index({ 'fournisseur.nom': 1 });
matierePremiereSchema.index({ statut: 1 });
matierePremiereSchema.index({ 'lots.numeroLot': 1 });

// Méthode pour ajouter un lot
matierePremiereSchema.methods.ajouterLot = function(donneesLot) {
  this.lots.push({
    ...donneesLot,
    dateReception: new Date()
  });
};

// Méthode pour mettre à jour le statut d'un lot
matierePremiereSchema.methods.mettreAJourStatutLot = function(numeroLot, nouveauStatut, utilisateur) {
  const lot = this.lots.find(l => l.numeroLot === numeroLot);
  if (lot) {
    lot.statut = nouveauStatut;
    lot.controles.push({
      type: 'Changement de statut',
      resultat: 'Conforme',
      date: new Date(),
      responsable: utilisateur,
      commentaire: `Statut changé vers: ${nouveauStatut}`
    });
  }
};

// Méthode pour prendre une décision qualité sur un lot
matierePremiereSchema.methods.deciderQualiteLot = function(numeroLot, decision, utilisateur, commentaire = '') {
  const lot = this.lots.find(l => l.numeroLot === numeroLot);
  if (lot) {
    lot.decisionQualite = {
      statut: decision,
      dateDecision: new Date(),
      decideur: utilisateur,
      commentaire
    };
  }
};

// Méthode pour calculer les statistiques des lots
matierePremiereSchema.methods.calculerStatistiques = function() {
  const total = this.lots.length;
  const enStock = this.lots.filter(l => l.statut === 'En stock').length;
  const utilises = this.lots.filter(l => l.statut === 'Utilisé').length;
  const perimes = this.lots.filter(l => l.statut === 'Périmé').length;
  const rejetes = this.lots.filter(l => l.statut === 'Rejeté').length;
  
  return {
    total,
    enStock,
    utilises,
    perimes,
    rejetes,
    tauxConformite: total > 0 ? Math.round(((total - rejetes) / total) * 100) : 100
  };
};

// Méthode pour vérifier les alertes de stock
matierePremiereSchema.methods.verifierAlertesStock = function() {
  const alertes = [];
  const quantiteTotale = this.lots
    .filter(lot => lot.statut === 'En stock')
    .reduce((total, lot) => total + lot.quantite, 0);

  if (this.stockCritique && this.stockCritique.seuilMinimum) {
    if (quantiteTotale <= this.stockCritique.seuilMinimum) {
      alertes.push({
        type: 'stock_bas',
        message: `Stock critique atteint: ${quantiteTotale} ${this.caracteristiques.unite} restant(s)`,
        niveau: 'critique'
      });
    }
  }

  return alertes;
};

// Méthode pour vérifier les alertes de péremption
matierePremiereSchema.methods.verifierAlertesPeremption = function() {
  const alertes = [];
  const aujourdhui = new Date();
  const joursAlerte = this.stockCritique?.alertePeremption || 30;

  this.lots.forEach(lot => {
    if (lot.statut === 'En stock' && lot.datePeremption) {
      const joursRestants = Math.ceil((lot.datePeremption - aujourdhui) / (1000 * 60 * 60 * 24));
      
      if (joursRestants <= 0) {
        alertes.push({
          type: 'peremption',
          message: `Lot ${lot.numeroLot} périmé depuis ${Math.abs(joursRestants)} jour(s)`,
          niveau: 'critique',
          numeroLot: lot.numeroLot,
          datePeremption: lot.datePeremption
        });
      } else if (joursRestants <= joursAlerte) {
        alertes.push({
          type: 'peremption',
          message: `Lot ${lot.numeroLot} expire dans ${joursRestants} jour(s)`,
          niveau: 'attention',
          numeroLot: lot.numeroLot,
          datePeremption: lot.datePeremption
        });
      }
    }
  });

  return alertes;
};

// Méthode pour vérifier les certificats expirés
matierePremiereSchema.methods.verifierCertificatsExpires = function() {
  const alertes = [];
  const aujourdhui = new Date();

  this.certificats.forEach(certificat => {
    if (certificat.dateExpiration && certificat.dateExpiration <= aujourdhui) {
      alertes.push({
        type: 'certificat_expire',
        message: `Certificat ${certificat.type} (${certificat.numero}) expiré`,
        niveau: 'critique',
        certificat: certificat
      });
    } else if (certificat.dateExpiration) {
      const joursRestants = Math.ceil((certificat.dateExpiration - aujourdhui) / (1000 * 60 * 60 * 24));
      if (joursRestants <= 30) {
        alertes.push({
          type: 'certificat_expire',
          message: `Certificat ${certificat.type} (${certificat.numero}) expire dans ${joursRestants} jour(s)`,
          niveau: 'attention',
          certificat: certificat
        });
      }
    }
  });

  return alertes;
};

// Méthode pour obtenir toutes les alertes
matierePremiereSchema.methods.obtenirToutesAlertes = function() {
  const alertesStock = this.verifierAlertesStock();
  const alertesPeremption = this.verifierAlertesPeremption();
  const alertesCertificats = this.verifierCertificatsExpires();

  return [...alertesStock, ...alertesPeremption, ...alertesCertificats];
};

module.exports = mongoose.model('MatierePremiere', matierePremiereSchema);
