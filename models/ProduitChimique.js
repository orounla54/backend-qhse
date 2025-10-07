const mongoose = require('mongoose');

/**
 * Schéma pour la gestion des produits chimiques
 */
const produitChimiqueSchema = new mongoose.Schema({
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
  nomCommercial: String,
  description: String,
  reference: String,
  
  // Classification
  classification: {
    type: {
      type: String,
      enum: [
        'Détergent',
        'Désinfectant',
        'Solvant',
        'Acide',
        'Base',
        'Oxydant',
        'Réducteur',
        'Autre'
      ],
      required: true
    },
    categorie: String,
    usage: {
      type: String,
      enum: [
        'Nettoyage',
        'Désinfection',
        'Dégraissage',
        'Décapage',
        'Traitement',
        'Autre'
      ]
    }
  },
  
  // Composition
  composition: {
    principesActifs: [{
      nom: String,
      concentration: Number,
      unite: String
    }],
    autresComposants: [String],
    pH: {
      min: Number,
      max: Number
    },
    densite: Number,
    solubilite: String
  },
  
  // Propriétés physico-chimiques
  proprietes: {
    etat: {
      type: String,
      enum: ['Solide', 'Liquide', 'Gaz', 'Poudre'],
      required: true
    },
    couleur: String,
    odeur: String,
    temperatureEbullition: Number,
    temperatureFusion: Number,
    pointEclair: Number,
    pressionVapeur: Number,
    viscosite: Number
  },
  
  // Risques et dangers
  risques: {
    symboles: [{
      type: String,
      enum: [
        'Explosif',
        'Inflammable',
        'Oxydant',
        'Corrosif',
        'Toxique',
        'Nocif',
        'Irritant',
        'Dangereux pour l\'environnement'
      ]
    }],
    phrasesR: [String], // Phrases de risque
    phrasesS: [String], // Phrases de sécurité
    classeDanger: String,
    codeH: String, // Code de danger
    codeP: String  // Code de précaution
  },
  
  // Stockage
  stockage: {
    temperature: {
      min: Number,
      max: Number,
      unite: {
        type: String,
        enum: ['°C', '°F'],
        default: '°C'
      }
    },
    humidite: {
      min: Number,
      max: Number,
      unite: String
    },
    conditions: [String],
    incompatibilites: [String],
    dureeConservation: Number, // en mois
    emballage: String
  },
  
  // Stock
  stock: {
    quantiteTotale: {
      type: Number,
      default: 0
    },
    quantiteDisponible: {
      type: Number,
      default: 0
    },
    seuilAlerte: {
      type: Number,
      default: 1
    },
    unite: {
      type: String,
      enum: ['L', 'ml', 'kg', 'g', 'pièce'],
      default: 'L'
    },
    localisation: {
      zone: String,
      etagere: String,
      position: String
    }
  },
  
  // Utilisation
  utilisation: [{
    date: {
      type: Date,
      required: true
    },
    quantite: {
      type: Number,
      required: true
    },
    unite: String,
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    zone: String,
    objectif: String,
    commentaire: String
  }],
  
  // Fournisseur
  fournisseur: {
    nom: String,
    contact: {
      email: String,
      telephone: String,
      adresse: String
    },
    numeroCommande: String
  },
  
  // Documents de sécurité
  documentsSecurite: [{
    type: {
      type: String,
      enum: ['FDS', 'Fiche technique', 'Certificat', 'Notice', 'Autre']
    },
    nom: String,
    url: String,
    version: String,
    dateUpload: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Contrôles
  controles: [{
    type: {
      type: String,
      enum: ['Inspection', 'Test', 'Vérification', 'Mesure']
    },
    date: {
      type: Date,
      required: true
    },
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resultat: {
      type: String,
      enum: ['Conforme', 'Non conforme', 'À surveiller']
    },
    commentaire: String,
    parametres: [{
      nom: String,
      valeur: Number,
      unite: String
    }]
  }],
  
  // Statut
  statut: {
    type: String,
    enum: ['Actif', 'Suspendu', 'Archivé', 'Interdit'],
    default: 'Actif'
  },
  
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
// produitChimiqueSchema.index({ numero: 1 }); // Déjà indexé par unique: true
produitChimiqueSchema.index({ nom: 1 });
produitChimiqueSchema.index({ 'classification.type': 1 });
produitChimiqueSchema.index({ statut: 1 });
produitChimiqueSchema.index({ 'stock.localisation.zone': 1 });

// Méthode pour calculer le stock disponible
produitChimiqueSchema.methods.calculerStockDisponible = function() {
  const totalUtilise = this.utilisation.reduce((total, usage) => total + usage.quantite, 0);
  this.stock.quantiteDisponible = this.stock.quantiteTotale - totalUtilise;
  return this.stock.quantiteDisponible;
};

// Méthode pour vérifier si le stock est en alerte
produitChimiqueSchema.methods.estEnAlerteStock = function() {
  this.calculerStockDisponible();
  return this.stock.quantiteDisponible <= this.stock.seuilAlerte;
};

// Méthode pour enregistrer une utilisation
produitChimiqueSchema.methods.enregistrerUtilisation = function(quantite, utilisateur, zone, objectif, commentaire = '') {
  if (this.stock.quantiteDisponible < quantite) {
    throw new Error('Stock insuffisant');
  }
  
  this.utilisation.push({
    date: new Date(),
    quantite,
    unite: this.stock.unite,
    utilisateur,
    zone,
    objectif,
    commentaire
  });
  
  this.calculerStockDisponible();
  this.ajouterHistorique('Utilisation', `Utilisation de ${quantite} ${this.stock.unite} de ${this.nom}`, utilisateur);
};

// Méthode pour vérifier la compatibilité
produitChimiqueSchema.methods.estCompatible = function(autreProduit) {
  return !this.stockage.incompatibilites.includes(autreProduit.nom);
};

// Méthode pour calculer la date de péremption
produitChimiqueSchema.methods.calculerDatePeremption = function() {
  if (this.stockage.dureeConservation) {
    const datePeremption = new Date();
    datePeremption.setMonth(datePeremption.getMonth() + this.stockage.dureeConservation);
    return datePeremption;
  }
  return null;
};

// Méthode pour vérifier si le produit est périmé
produitChimiqueSchema.methods.estPerime = function() {
  const datePeremption = this.calculerDatePeremption();
  return datePeremption && datePeremption < new Date();
};

// Méthode pour ajouter une entrée à l'historique
produitChimiqueSchema.methods.ajouterHistorique = function(action, description, utilisateur) {
  this.historique.push({
    action,
    description,
    utilisateur,
    date: new Date()
  });
};

// Middleware de pré-sauvegarde
produitChimiqueSchema.pre('save', async function(next) {
  try {
    // Générer automatiquement le numéro si pas fourni
    if (this.isNew && !this.numero) {
      const timestamp = new Date().getFullYear();
      const count = await this.constructor.countDocuments({});
      this.numero = `CHIM-${timestamp}-${String(count + 1).padStart(4, '0')}`;
    }
    
    // Recalculer le stock disponible
    this.calculerStockDisponible();
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('ProduitChimique', produitChimiqueSchema);
