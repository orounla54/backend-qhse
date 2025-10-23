const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const mongoose = require('mongoose');

// Import des modèles
const MatierePremiere = require('../models/MatierePremiere');
const ControleQualite = require('../models/ControleQualite');
const NonConformite = require('../models/NonConformite');
const Audit = require('../models/Audit');
const Conformite = require('../models/Conformite');
const DecisionQualite = require('../models/DecisionQualite');
const PlanControle = require('../models/PlanControle');
const Tracabilite = require('../models/Tracabilite');
const Analyse = require('../models/Analyse');
const Echantillon = require('../models/Echantillon');

// Middleware pour vérifier la connexion à la base de données
const checkDatabaseConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Service temporairement indisponible - Base de données non connectée',
      code: 'DATABASE_UNAVAILABLE'
    });
  }
  next();
};

// Protection des routes par authentification
router.use(auth);
router.use(checkDatabaseConnection);

// Route de test simple
router.get('/test', (req, res) => {
  res.json({ message: 'Route qualité test OK', timestamp: new Date().toISOString() });
});

// ==================== ROUTES MATIÈRES PREMIÈRES ====================

// GET /api/qualite/matieres-premieres - Obtenir toutes les matières premières
router.get('/matieres-premieres', async (req, res) => {
  try {
    // Vérifier la connexion à la base de données
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Service temporairement indisponible - Base de données non connectée',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      statut, 
      type, 
      fournisseur,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { isArchived: false };
    
    // Filtres de base
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (fournisseur) filter.fournisseur = new RegExp(fournisseur, 'i');
    
    // Recherche textuelle
    if (search) {
      filter.$or = [
        { nom: new RegExp(search, 'i') },
        { numero: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { fournisseur: new RegExp(search, 'i') }
      ];
    }

    // Configuration du tri
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const matieresPremieres = await MatierePremiere.find(filter)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .populate('lots.controles.responsable', 'nom prenom')
      .populate('lots.decisionQualite.decideur', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await MatierePremiere.countDocuments(filter);

    res.json({
      matieresPremieres,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des matières premières:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

// GET /api/qualite/matieres-premieres/:id - Obtenir une matière première par ID
router.get('/matieres-premieres/:id', async (req, res) => {
  try {
    const matierePremiere = await MatierePremiere.findById(req.params.id)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .populate('lots.controles.responsable', 'nom prenom')
      .populate('lots.decisionQualite.decideur', 'nom prenom');

    if (!matierePremiere) {
      return res.status(404).json({ message: 'Matière première non trouvée' });
    }

    res.json(matierePremiere);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/matieres-premieres - Créer une nouvelle matière première
router.post('/matieres-premieres', async (req, res) => {
  try {
    // Vérifier la connexion à la base de données
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Service temporairement indisponible - Base de données non connectée',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    const matierePremiere = new MatierePremiere({
      ...req.body,
      createdBy: req.user.id
    });

    await matierePremiere.save();
    res.status(201).json({
      success: true,
      data: matierePremiere
    });
  } catch (error) {
    console.error('Erreur lors de la création de la matière première:', error);
    res.status(400).json({ 
      success: false,
      message: 'Données invalides', 
      error: error.message 
    });
  }
});

// PUT /api/qualite/matieres-premieres/:id - Mettre à jour une matière première
router.put('/matieres-premieres/:id', async (req, res) => {
  try {
    const matierePremiere = await MatierePremiere.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!matierePremiere) {
      return res.status(404).json({ message: 'Matière première non trouvée' });
    }

    res.json(matierePremiere);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/qualite/matieres-premieres/:id - Supprimer une matière première
router.delete('/matieres-premieres/:id', async (req, res) => {
  try {
    const deleted = await MatierePremiere.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Matière première introuvable' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: 'Suppression impossible', error: error.message });
  }
});

// ==================== ROUTES CONTRÔLES QUALITÉ ====================

// GET /api/qualite/controles-qualite - Obtenir tous les contrôles qualité
router.get('/controles-qualite', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      statut, 
      type, 
      controleur,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { isArchived: false };
    
    // Filtres de base
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (controleur) filter.controleur = controleur;
    
    // Recherche textuelle
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { titre: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Configuration du tri
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const controles = await ControleQualite.find(filter)
      .populate('controleur', 'nom prenom')
      .populate('equipe.membre', 'nom prenom')
      .populate('resultats.mesureur', 'nom prenom')
      .populate('actionsCorrectives.responsable', 'nom prenom')
      .populate('historique.utilisateur', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ControleQualite.countDocuments(filter);

    res.json({
      controles,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des contrôles qualité:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qualite/controles-qualite/:id - Obtenir un contrôle qualité par ID
router.get('/controles-qualite/:id', async (req, res) => {
  try {
    const controle = await ControleQualite.findById(req.params.id)
      .populate('controleur', 'nom prenom')
      .populate('equipe.membre', 'nom prenom')
      .populate('resultats.mesureur', 'nom prenom')
      .populate('actionsCorrectives.responsable', 'nom prenom')
      .populate('historique.utilisateur', 'nom prenom');

    if (!controle) {
      return res.status(404).json({ message: 'Contrôle qualité non trouvé' });
    }

    res.json(controle);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/controles-qualite - Créer un nouveau contrôle qualité
router.post('/controles-qualite', async (req, res) => {
  try {
    const controle = new ControleQualite({
      ...req.body,
      createdBy: req.user.id
    });

    await controle.save();
    res.status(201).json(controle);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// PUT /api/qualite/controles-qualite/:id - Mettre à jour un contrôle qualité
router.put('/controles-qualite/:id', async (req, res) => {
  try {
    const controle = await ControleQualite.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!controle) {
      return res.status(404).json({ message: 'Contrôle qualité non trouvé' });
    }

    res.json(controle);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/qualite/controles-qualite/:id - Supprimer un contrôle qualité
router.delete('/controles-qualite/:id', async (req, res) => {
  try {
    const deleted = await ControleQualite.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Contrôle qualité introuvable' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: 'Suppression impossible', error: error.message });
  }
});

// ==================== ROUTES NON-CONFORMITÉS ====================

// GET /api/qualite/non-conformites - Obtenir toutes les non-conformités
router.get('/non-conformites', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      statut, 
      type, 
      gravite, 
      categorie,
      search,
      sortBy = 'detection.date',
      sortOrder = 'desc',
      priorite
    } = req.query;
    
    const filter = { isArchived: false };
    
    // Filtres de base
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (gravite) filter.gravite = gravite;
    if (categorie) filter.categorie = categorie;
    if (priorite) filter.priorite = priorite;
    
    // Recherche textuelle
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { titre: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'concerne.reference': new RegExp(search, 'i') },
        { 'localisation.zone': new RegExp(search, 'i') }
      ];
    }

    // Configuration du tri
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const nonConformites = await NonConformite.find(filter)
      .populate('detection.detecteur', 'nom prenom')
      .populate('actionsCorrectives.responsable', 'nom prenom')
      .populate('actionsPreventives.responsable', 'nom prenom')
      .populate('investigation.investigateur', 'nom prenom')
      .populate('fermeture.fermePar', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await NonConformite.countDocuments(filter);

    res.json({
      nonConformites,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des non-conformités:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qualite/non-conformites/:id - Obtenir une non-conformité par ID
router.get('/non-conformites/:id', async (req, res) => {
  try {
    const nonConformite = await NonConformite.findById(req.params.id)
      .populate('detection.detecteur', 'nom prenom')
      .populate('actionsCorrectives.responsable', 'nom prenom')
      .populate('actionsPreventives.responsable', 'nom prenom')
      .populate('investigation.investigateur', 'nom prenom')
      .populate('fermeture.fermePar', 'nom prenom');

    if (!nonConformite) {
      return res.status(404).json({ message: 'Non-conformité non trouvée' });
    }

    res.json(nonConformite);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/non-conformites - Créer une nouvelle non-conformité
router.post('/non-conformites', async (req, res) => {
  try {
    const nonConformite = new NonConformite({
      ...req.body,
      createdBy: req.user.id
    });

    await nonConformite.save();
    res.status(201).json(nonConformite);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// PUT /api/qualite/non-conformites/:id - Mettre à jour une non-conformité
router.put('/non-conformites/:id', async (req, res) => {
  try {
    const nonConformite = await NonConformite.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!nonConformite) {
      return res.status(404).json({ message: 'Non-conformité non trouvée' });
    }

    res.json(nonConformite);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/qualite/non-conformites/:id - Supprimer une non-conformité
router.delete('/non-conformites/:id', async (req, res) => {
  try {
    const deleted = await NonConformite.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Non-conformité introuvable' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: 'Suppression impossible', error: error.message });
  }
});

// ==================== ROUTES DÉCISIONS QUALITÉ ====================

// GET /api/qualite/decisions-qualite - Obtenir toutes les décisions qualité
router.get('/decisions-qualite', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      statut, 
      type, 
      search,
      sortBy = 'dateDecision',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { isArchived: false };
    
    // Filtres de base
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    
    // Recherche textuelle
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { titre: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'contexte.reference': new RegExp(search, 'i') }
      ];
    }

    // Configuration du tri
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const decisions = await DecisionQualite.find(filter)
      .populate('decisionnaire', 'nom prenom')
      .populate('matierePremiere', 'nom numero')
      .populate('controleQualite', 'numero titre')
      .populate('nonConformite', 'numero titre')
      .populate('validation.validateur', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await DecisionQualite.countDocuments(filter);

    res.json({
      decisions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des décisions qualité:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qualite/decisions-qualite/:id - Obtenir une décision qualité par ID
router.get('/decisions-qualite/:id', async (req, res) => {
  try {
    const decision = await DecisionQualite.findById(req.params.id)
      .populate('decisionnaire', 'nom prenom')
      .populate('matierePremiere', 'nom numero')
      .populate('controleQualite', 'numero titre')
      .populate('nonConformite', 'numero titre')
      .populate('validation.validateur', 'nom prenom');

    if (!decision) {
      return res.status(404).json({ message: 'Décision qualité non trouvée' });
    }

    res.json(decision);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/decisions-qualite - Créer une nouvelle décision qualité
router.post('/decisions-qualite', async (req, res) => {
  try {
    const decision = new DecisionQualite({
      ...req.body,
      createdBy: req.user.id
    });

    await decision.save();
    res.status(201).json(decision);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// PUT /api/qualite/decisions-qualite/:id - Mettre à jour une décision qualité
router.put('/decisions-qualite/:id', async (req, res) => {
  try {
    const decision = await DecisionQualite.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!decision) {
      return res.status(404).json({ message: 'Décision qualité non trouvée' });
    }

    res.json(decision);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/qualite/decisions-qualite/:id - Supprimer une décision qualité
router.delete('/decisions-qualite/:id', async (req, res) => {
  try {
    const deleted = await DecisionQualite.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Décision qualité introuvable' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: 'Suppression impossible', error: error.message });
  }
});

// ==================== ROUTES PLANS DE CONTRÔLE ====================

// GET /api/qualite/plans-controle - Obtenir tous les plans de contrôle
router.get('/plans-controle', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      statut, 
      type, 
      produit,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { isArchived: false };
    
    // Filtres de base
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (produit) filter['concerne.nom'] = new RegExp(produit, 'i');
    
    // Recherche textuelle
    if (search) {
      filter.$or = [
        { nom: new RegExp(search, 'i') },
        { numero: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Configuration du tri
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const plans = await PlanControle.find(filter)
      .populate('responsable', 'nom prenom')
      .populate('equipe.membre', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await PlanControle.countDocuments(filter);

    res.json({
      plans,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des plans de contrôle:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qualite/plans-controle/:id - Obtenir un plan de contrôle par ID
router.get('/plans-controle/:id', async (req, res) => {
  try {
    const plan = await PlanControle.findById(req.params.id)
      .populate('responsable', 'nom prenom')
      .populate('equipe.membre', 'nom prenom');

    if (!plan) {
      return res.status(404).json({ message: 'Plan de contrôle non trouvé' });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/plans-controle - Créer un nouveau plan de contrôle
router.post('/plans-controle', async (req, res) => {
  try {
    const plan = new PlanControle({
      ...req.body,
      responsable: req.user.id,
      createdBy: req.user.id
    });

    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// PUT /api/qualite/plans-controle/:id - Mettre à jour un plan de contrôle
router.put('/plans-controle/:id', async (req, res) => {
  try {
    const plan = await PlanControle.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ message: 'Plan de contrôle non trouvé' });
    }

    res.json(plan);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/qualite/plans-controle/:id - Supprimer un plan de contrôle
router.delete('/plans-controle/:id', async (req, res) => {
  try {
    const deleted = await PlanControle.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Plan de contrôle introuvable' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: 'Suppression impossible', error: error.message });
  }
});

// ==================== ROUTES TRACABILITÉ ====================

// GET /api/qualite/tracabilite - Obtenir toutes les traçabilités
router.get('/tracabilite', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      statut, 
      type, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { isArchived: false };
    
    // Filtres de base
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    
    // Recherche textuelle
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { titre: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Configuration du tri
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const tracabilites = await Tracabilite.find(filter)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Tracabilite.countDocuments(filter);

    res.json({
      tracabilites,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des traçabilités:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qualite/tracabilite/:id - Obtenir une traçabilité par ID
router.get('/tracabilite/:id', async (req, res) => {
  try {
    const tracabilite = await Tracabilite.findById(req.params.id)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom');

    if (!tracabilite) {
      return res.status(404).json({ message: 'Traçabilité non trouvée' });
    }

    res.json(tracabilite);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/tracabilite - Créer une nouvelle traçabilité
router.post('/tracabilite', async (req, res) => {
  try {
    const tracabilite = new Tracabilite({
      ...req.body,
      createdBy: req.user.id
    });

    await tracabilite.save();
    res.status(201).json(tracabilite);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// PUT /api/qualite/tracabilite/:id - Mettre à jour une traçabilité
router.put('/tracabilite/:id', async (req, res) => {
  try {
    const tracabilite = await Tracabilite.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!tracabilite) {
      return res.status(404).json({ message: 'Traçabilité non trouvée' });
    }

    res.json(tracabilite);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/qualite/tracabilite/:id - Supprimer une traçabilité
router.delete('/tracabilite/:id', async (req, res) => {
  try {
    const deleted = await Tracabilite.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Traçabilité introuvable' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: 'Suppression impossible', error: error.message });
  }
});

// ==================== ROUTES CONFORMITÉ ====================

// GET /api/qualite/conformite - Obtenir toutes les conformités
router.get('/conformite', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      statut, 
      type, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { isArchived: false };
    
    // Filtres de base
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    
    // Recherche textuelle
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { titre: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Configuration du tri
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const conformites = await Conformite.find(filter)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Conformite.countDocuments(filter);

    res.json({
      conformites,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des conformités:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qualite/conformite/:id - Obtenir une conformité par ID
router.get('/conformite/:id', async (req, res) => {
  try {
    const conformite = await Conformite.findById(req.params.id)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom');

    if (!conformite) {
      return res.status(404).json({ message: 'Conformité non trouvée' });
    }

    res.json(conformite);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/conformite - Créer une nouvelle conformité
router.post('/conformite', async (req, res) => {
  try {
    const conformite = new Conformite({
      ...req.body,
      createdBy: req.user.id
    });

    await conformite.save();
    res.status(201).json(conformite);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// PUT /api/qualite/conformite/:id - Mettre à jour une conformité
router.put('/conformite/:id', async (req, res) => {
  try {
    const conformite = await Conformite.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!conformite) {
      return res.status(404).json({ message: 'Conformité non trouvée' });
    }

    res.json(conformite);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/qualite/conformite/:id - Supprimer une conformité
router.delete('/conformite/:id', async (req, res) => {
  try {
    const deleted = await Conformite.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Conformité introuvable' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: 'Suppression impossible', error: error.message });
  }
});

// ==================== ROUTES ANALYSES ====================

// GET /api/qualite/analyses - Obtenir toutes les analyses
router.get('/analyses', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      statut, 
      type, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { isArchived: false };
    
    // Filtres de base
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    
    // Recherche textuelle
    if (search) {
      filter.$or = [
        { nom: new RegExp(search, 'i') },
        { numero: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Configuration du tri
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const analyses = await Analyse.find(filter)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Analyse.countDocuments(filter);

    res.json({
      analyses,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des analyses:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qualite/analyses/:id - Obtenir une analyse par ID
router.get('/analyses/:id', async (req, res) => {
  try {
    const analyse = await Analyse.findById(req.params.id)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom');

    if (!analyse) {
      return res.status(404).json({ message: 'Analyse non trouvée' });
    }

    res.json(analyse);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/analyses - Créer une nouvelle analyse
router.post('/analyses', async (req, res) => {
  try {
    const analyse = new Analyse({
      ...req.body,
      createdBy: req.user.id
    });

    await analyse.save();
    res.status(201).json(analyse);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// PUT /api/qualite/analyses/:id - Mettre à jour une analyse
router.put('/analyses/:id', async (req, res) => {
  try {
    const analyse = await Analyse.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!analyse) {
      return res.status(404).json({ message: 'Analyse non trouvée' });
    }

    res.json(analyse);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/qualite/analyses/:id - Supprimer une analyse
router.delete('/analyses/:id', async (req, res) => {
  try {
    const deleted = await Analyse.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Analyse introuvable' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: 'Suppression impossible', error: error.message });
  }
});

// ==================== ROUTES ÉCHANTILLONS ====================

// GET /api/qualite/echantillons - Obtenir tous les échantillons
router.get('/echantillons', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      statut, 
      type, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { isArchived: false };
    
    // Filtres de base
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    
    // Recherche textuelle
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { nom: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Configuration du tri
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const echantillons = await Echantillon.find(filter)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Echantillon.countDocuments(filter);

    res.json({
      echantillons,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des échantillons:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qualite/echantillons/:id - Obtenir un échantillon par ID
router.get('/echantillons/:id', async (req, res) => {
  try {
    const echantillon = await Echantillon.findById(req.params.id)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom');

    if (!echantillon) {
      return res.status(404).json({ message: 'Échantillon non trouvé' });
    }

    res.json(echantillon);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/echantillons - Créer un nouvel échantillon
router.post('/echantillons', async (req, res) => {
  try {
    const echantillon = new Echantillon({
      ...req.body,
      createdBy: req.user.id
    });

    await echantillon.save();
    res.status(201).json(echantillon);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// PUT /api/qualite/echantillons/:id - Mettre à jour un échantillon
router.put('/echantillons/:id', async (req, res) => {
  try {
    const echantillon = await Echantillon.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!echantillon) {
      return res.status(404).json({ message: 'Échantillon non trouvé' });
    }

    res.json(echantillon);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/qualite/echantillons/:id - Supprimer un échantillon
router.delete('/echantillons/:id', async (req, res) => {
  try {
    const deleted = await Echantillon.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Échantillon introuvable' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: 'Suppression impossible', error: error.message });
  }
});

module.exports = router;