const mongoose = require('mongoose');

/**
 * Schéma pour la gestion des Équipements de Protection Individuelle (EPI)
 */
const epiSchema = new mongoose.Schema({
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
  
  // Type d'EPI
  type: {
    type: String,
    enum: [
      'Casque',
      'Lunettes',
      'Masque',
      'Gants',
      'Chaussures',
      'Vêtement',
      'Harnais',
      'Protection auditive',
      'Autre'
    ],
    required: true
  },
  
  // Catégorie de protection
  categorie: {
    type: String,
    enum: [
      'Protection de la tête',
      'Protection des yeux',
      'Protection respiratoire',
      'Protection des mains',
      'Protection des pieds',
      'Protection du corps',
      'Protection contre les chutes',
      'Protection auditive'
    ],
    required: true
  },
  
  // Risques protégés
  risquesProteges: [{
    type: {
      type: String,
      enum: [
        'Chocs',
        'Projections',
        'Poussières',
        'Vapeurs',
        'Gaz',
        'Bruit',
        'Chaleur',
        'Froid',
        'Chutes',
        'Coupures',
        'Brûlures',
        'Autre'
      ]
    },
    niveau: {
      type: String,
      enum: ['Faible', 'Modéré', 'Élevé', 'Critique']
    }
  }],
  
  // Caractéristiques techniques
  caracteristiques: {
    marque: String,
    modele: String,
    taille: String,
    couleur: String,
    materiau: String,
    norme: String, // Ex: EN 166, EN 374
    classe: String,
    dureeVie: Number, // en mois
    temperatureMin: Number,
    temperatureMax: Number,
    autres: String
  },
  
  // Fournisseur
  fournisseur: {
    nom: String,
    contact: {
      email: String,
      telephone: String,
      adresse: String
    }
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
      default: 5
    },
    unite: {
      type: String,
      enum: ['pièce', 'paire', 'mètre', 'kg'],
      default: 'pièce'
    }
  },
  
  // Dotation aux employés
  dotations: [{
    employe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quantite: {
      type: Number,
      required: true
    },
    dateDotation: {
      type: Date,
      required: true,
      default: Date.now
    },
    dateExpiration: Date,
    statut: {
      type: String,
      enum: ['Actif', 'Expiré', 'Perdu', 'Endommagé', 'Rendu'],
      default: 'Actif'
    },
    commentaire: String,
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Maintenance
  maintenance: [{
    type: {
      type: String,
      enum: ['Inspection', 'Nettoyage', 'Réparation', 'Remplacement', 'Test']
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
      enum: ['Conforme', 'Non conforme', 'À réparer', 'À remplacer']
    },
    commentaire: String,
    prochaineMaintenance: Date
  }],
  
  // Statut
  statut: {
    type: String,
    enum: ['Actif', 'Suspendu', 'Archivé', 'En révision'],
    default: 'Actif'
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['Fiche technique', 'Certificat', 'Notice', 'Photo', 'Autre']
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
// epiSchema.index({ numero: 1 }); // Déjà indexé par unique: true
epiSchema.index({ type: 1 });
epiSchema.index({ categorie: 1 });
epiSchema.index({ statut: 1 });
epiSchema.index({ 'dotations.employe': 1 });

// Méthode pour calculer le stock disponible
epiSchema.methods.calculerStockDisponible = function() {
  const totalDote = this.dotations
    .filter(d => d.statut === 'Actif')
    .reduce((total, dotation) => total + dotation.quantite, 0);
  
  this.stock.quantiteDisponible = this.stock.quantiteTotale - totalDote;
  return this.stock.quantiteDisponible;
};

// Méthode pour vérifier si le stock est en alerte
epiSchema.methods.estEnAlerteStock = function() {
  this.calculerStockDisponible();
  return this.stock.quantiteDisponible <= this.stock.seuilAlerte;
};

// Méthode pour dotation d'un employé
epiSchema.methods.doterEmploye = function(employe, quantite, responsable, commentaire = '') {
  if (this.stock.quantiteDisponible < quantite) {
    throw new Error('Stock insuffisant');
  }
  
  const dateExpiration = new Date();
  dateExpiration.setMonth(dateExpiration.getMonth() + this.caracteristiques.dureeVie);
  
  this.dotations.push({
    employe,
    quantite,
    dateDotation: new Date(),
    dateExpiration,
    responsable,
    commentaire
  });
  
  this.calculerStockDisponible();
  this.ajouterHistorique('Dotation', `Dotation de ${quantite} ${this.nom} à l'employé ${employe}`, responsable);
};

// Méthode pour rendre un EPI
epiSchema.methods.rendreEPI = function(employe, quantite, responsable, commentaire = '') {
  const dotation = this.dotations.find(d => 
    d.employe.toString() === employe.toString() && 
    d.statut === 'Actif'
  );
  
  if (!dotation) {
    throw new Error('Dotation non trouvée');
  }
  
  if (dotation.quantite < quantite) {
    throw new Error('Quantité insuffisante à rendre');
  }
  
  dotation.quantite -= quantite;
  if (dotation.quantite === 0) {
    dotation.statut = 'Rendu';
  }
  
  this.calculerStockDisponible();
  this.ajouterHistorique('Retour', `Retour de ${quantite} ${this.nom} par l'employé ${employe}`, responsable);
};

// Méthode pour expirer les EPI
epiSchema.methods.expirerEPI = function() {
  const aujourdhui = new Date();
  let nbExpires = 0;
  
  this.dotations.forEach(dotation => {
    if (dotation.dateExpiration && dotation.dateExpiration <= aujourdhui && dotation.statut === 'Actif') {
      dotation.statut = 'Expiré';
      nbExpires++;
    }
  });
  
  if (nbExpires > 0) {
    this.ajouterHistorique('Expiration', `${nbExpires} EPI expirés automatiquement`, null);
  }
  
  return nbExpires;
};

// Méthode pour ajouter une entrée à l'historique
epiSchema.methods.ajouterHistorique = function(action, description, utilisateur) {
  this.historique.push({
    action,
    description,
    utilisateur,
    date: new Date()
  });
};

// Middleware de pré-sauvegarde
epiSchema.pre('save', async function(next) {
  try {
    // Générer automatiquement le numéro si pas fourni
    if (this.isNew && !this.numero) {
      const timestamp = new Date().getFullYear();
      const count = await this.constructor.countDocuments({});
      this.numero = `EPI-${timestamp}-${String(count + 1).padStart(4, '0')}`;
    }
    
    // Recalculer le stock disponible
    this.calculerStockDisponible();
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('EPI', epiSchema);
