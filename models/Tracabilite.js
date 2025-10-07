const mongoose = require('mongoose');

/**
 * Schéma pour la traçabilité
 */
const tracabiliteSchema = new mongoose.Schema({
  // Informations de base
  numero: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Matière première', 'Produit fini', 'Processus', 'Équipement'],
    required: true
  },
  
  // Référence de l'élément tracé
  reference: {
    type: String,
    required: true
  },
  nom: String,
  version: String,
  lot: String,
  
  // Origine
  origine: {
    type: {
      type: String,
      enum: ['Fournisseur', 'Production interne', 'Sous-traitant', 'Autre']
    },
    fournisseur: {
      nom: String,
      code: String,
      contact: String
    },
    dateReception: Date,
    quantite: Number,
    unite: String,
    documents: [{
      type: String,
      nom: String,
      url: String
    }]
  },
  
  // Destination
  destination: {
    type: {
      type: String,
      enum: ['Production', 'Stock', 'Client', 'Destruction', 'Retour fournisseur', 'Autre']
    },
    client: {
      nom: String,
      code: String,
      contact: String
    },
    dateSortie: Date,
    quantite: Number,
    unite: String,
    documents: [{
      type: String,
      nom: String,
      url: String
    }]
  },
  
  // Transformation
  transformation: [{
    etape: String,
    date: Date,
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    parametres: [{
      nom: String,
      valeur: String,
      unite: String
    }],
    resultats: [{
      critere: String,
      valeur: String,
      unite: String,
      conforme: Boolean
    }],
    documents: [{
      type: String,
      nom: String,
      url: String
    }]
  }],
  
  // Liens de traçabilité
  liens: [{
    type: {
      type: String,
      enum: ['Utilise', 'Produit', 'Contient', 'Dérive de', 'Transforme en'],
      required: true
    },
    elementLie: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'liens.elementType'
    },
    elementType: {
      type: String,
      enum: ['MatierePremiere', 'ProduitFini', 'Processus', 'Tracabilite']
    },
    quantite: Number,
    unite: String,
    date: Date,
    commentaire: String
  }],
  
  // Contrôles qualité
  controles: [{
    type: String,
    date: Date,
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resultat: {
      type: String,
      enum: ['Conforme', 'Non conforme', 'Sous réserve']
    },
    criteres: [{
      nom: String,
      valeur: String,
      unite: String,
      conforme: Boolean
    }],
    documents: [{
      type: String,
      nom: String,
      url: String
    }]
  }],
  
  // Non-conformités
  nonConformites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NonConformite'
  }],
  
  // Rappels
  rappels: [{
    type: {
      type: String,
      enum: ['Rappel produit', 'Retrait', 'Alerte', 'Information']
    },
    date: Date,
    raison: String,
    quantite: Number,
    unite: String,
    statut: {
      type: String,
      enum: ['En cours', 'Terminé', 'Annulé'],
      default: 'En cours'
    },
    actions: [String],
    documents: [{
      type: String,
      nom: String,
      url: String
    }]
  }],
  
  // Statut
  statut: {
    type: String,
    enum: ['En stock', 'En production', 'Livré', 'Rappelé', 'Détruit', 'Retiré'],
    default: 'En stock'
  },
  
  // Dates importantes
  dates: {
    creation: {
      type: Date,
      default: Date.now
    },
    premiereUtilisation: Date,
    derniereUtilisation: Date,
    peremption: Date,
    destruction: Date
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['Certificat', 'Analyse', 'Rapport', 'Photo', 'Autre']
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
    },
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

// Index pour optimiser les requêtes
// tracabiliteSchema.index({ numero: 1 }); // Déjà indexé par unique: true
tracabiliteSchema.index({ type: 1 });
tracabiliteSchema.index({ reference: 1 });
tracabiliteSchema.index({ lot: 1 });
tracabiliteSchema.index({ statut: 1 });
tracabiliteSchema.index({ 'dates.peremption': 1 });

// Méthode pour simuler un rappel
tracabiliteSchema.methods.simulerRappel = function(raison, quantite, unite) {
  this.rappels.push({
    type: 'Rappel produit',
    date: new Date(),
    raison,
    quantite,
    unite,
    statut: 'En cours'
  });
  
  this.statut = 'Rappelé';
  this.ajouterHistorique('Rappel', `Rappel simulé: ${raison}`, this.createdBy);
};

// Méthode pour ajouter un lien de traçabilité
tracabiliteSchema.methods.ajouterLien = function(type, elementLie, elementType, quantite, unite, commentaire = '') {
  this.liens.push({
    type,
    elementLie,
    elementType,
    quantite,
    unite,
    date: new Date(),
    commentaire
  });
  
  this.ajouterHistorique('Lien traçabilité', `Lien ajouté: ${type}`, this.updatedBy);
};

// Méthode pour obtenir la chaîne de traçabilité complète
tracabiliteSchema.methods.obtenirChaineTracabilite = function() {
  const chaine = [];
  
  // Ajouter l'élément actuel
  chaine.push({
    element: this.reference,
    type: this.type,
    statut: this.statut,
    dates: this.dates
  });
  
  // Ajouter les éléments liés
  this.liens.forEach(lien => {
    chaine.push({
      lien: lien.type,
      element: lien.elementLie,
      quantite: lien.quantite,
      unite: lien.unite,
      date: lien.date
    });
  });
  
  return chaine;
};

// Méthode pour vérifier la traçabilité complète
tracabiliteSchema.methods.verifierTracabiliteComplete = function() {
  const manques = [];
  
  // Vérifier l'origine
  if (!this.origine.type || !this.origine.dateReception) {
    manques.push('Origine incomplète');
  }
  
  // Vérifier les contrôles
  if (this.controles.length === 0) {
    manques.push('Aucun contrôle qualité');
  }
  
  // Vérifier les documents
  if (this.documents.length === 0) {
    manques.push('Aucun document de traçabilité');
  }
  
  return {
    complete: manques.length === 0,
    manques
  };
};

// Méthode pour ajouter une entrée à l'historique
tracabiliteSchema.methods.ajouterHistorique = function(action, description, utilisateur, anciennesValeurs = null, nouvellesValeurs = null) {
  this.historique.push({
    action,
    description,
    utilisateur,
    date: new Date(),
    anciennesValeurs,
    nouvellesValeurs
  });
};

// Middleware de pré-sauvegarde
tracabiliteSchema.pre('save', function(next) {
  // Générer automatiquement le numéro si pas fourni
  if (this.isNew && !this.numero) {
    const timestamp = new Date().getFullYear();
    const count = this.constructor.countDocuments({});
    this.numero = `TR-${timestamp}-${String(count + 1).padStart(4, '0')}`;
  }
  
  next();
});

module.exports = mongoose.model('Tracabilite', tracabiliteSchema);
