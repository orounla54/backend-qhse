const mongoose = require('mongoose');

const hygieneSchema = new mongoose.Schema({
  numero: {
    type: String,
    unique: true
  },
  titre: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Routine', 'Exceptionnel', 'Audit', 'Inspection']
  },
  statut: {
    type: String,
    required: true,
    enum: ['Planifie', 'En cours', 'Termine', 'Reporte'],
    default: 'Planifie'
  },
  zone: {
    nom: {
      type: String,
      required: true
    }
  },
  evaluation: {
    statut: {
      type: String,
      required: true,
      enum: ['En attente', 'Conforme', 'Non conforme', 'Partiellement conforme'],
      default: 'En attente'
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  datePlanification: {
    type: Date,
    required: true
  },
  responsable: {
    nom: {
      type: String,
      required: true
    },
    prenom: {
      type: String,
      required: true
    }
  },
  pointsControle: [{
    nom: {
      type: String,
      required: true
    },
    statut: {
      type: String,
      required: true,
      enum: ['En attente', 'Conforme', 'Non conforme'],
      default: 'En attente'
    },
    observations: {
      type: String,
      default: ''
    }
  }],
  actions: [{
    description: {
      type: String,
      required: true
    },
    responsable: {
      type: String,
      required: true
    },
    echeance: {
      type: Date,
      required: true
    }
  }],
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateModification: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour la date de modification
hygieneSchema.pre('save', function(next) {
  this.dateModification = new Date();
  next();
});

// Middleware pour générer un numéro automatique
hygieneSchema.pre('validate', async function(next) {
  if (this.isNew && !this.numero) {
    const count = await this.constructor.countDocuments();
    this.numero = `HYG-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Hygiene', hygieneSchema);