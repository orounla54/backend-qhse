const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const mongoose = require('mongoose');
const Echantillon = require('../models/Echantillon');
const Analyse = require('../models/Analyse');
const PlanControle = require('../models/PlanControle');
const ResultatAnalyse = require('../models/ResultatAnalyse');

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

// ==================== ROUTES ÉCHANTILLONS ====================

// GET /api/laboratoire/echantillons - Obtenir tous les échantillons
router.get('/echantillons', async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, typeEchantillon, numeroLot } = req.query;
    
    const filter = { isArchived: false };
    if (statut) filter.statut = statut;
    if (typeEchantillon) filter.typeEchantillon = typeEchantillon;
    if (numeroLot) filter.numeroLot = new RegExp(numeroLot, 'i');

    const echantillons = await Echantillon.find(filter)
      .populate('prelevement.responsable', 'nom prenom')
      .populate('analyses.type', 'nom type categorie')
      .populate('resultats.validePar', 'nom prenom')
      .populate('decisionQualite.decideur', 'nom prenom')
      .sort({ 'prelevement.date': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Echantillon.countDocuments(filter);

    res.json({
      echantillons,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/laboratoire/echantillons/:id - Obtenir un échantillon par ID
router.get('/echantillons/:id', async (req, res) => {
  try {
    const echantillon = await Echantillon.findById(req.params.id)
      .populate('prelevement.responsable', 'nom prenom')
      .populate('analyses.type', 'nom type categorie methode')
      .populate('resultats.validePar', 'nom prenom')
      .populate('decisionQualite.decideur', 'nom prenom')
      .populate('decisionQualite.actions.responsable', 'nom prenom')
      .populate('historique.utilisateur', 'nom prenom');

    if (!echantillon) {
      return res.status(404).json({ message: 'Échantillon non trouvé' });
    }

    res.json(echantillon);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/laboratoire/echantillons - Créer un nouvel échantillon
router.post('/echantillons', async (req, res) => {
  try {
    const echantillonData = {
      ...req.body,
      createdBy: req.user.id,
      prelevement: {
        ...req.body.prelevement,
        responsable: req.user.id
      }
    };

    const echantillon = new Echantillon(echantillonData);
    await echantillon.save();
    
    const populatedEchantillon = await Echantillon.findById(echantillon._id)
      .populate('prelevement.responsable', 'nom prenom');
    
    res.status(201).json(populatedEchantillon);
  } catch (error) {
    res.status(400).json({ 
      message: 'Données invalides', 
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : null
    });
  }
});

// PUT /api/laboratoire/echantillons/:id - Mettre à jour un échantillon
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

// POST /api/laboratoire/echantillons/:id/analyses - Ajouter une analyse à un échantillon
router.post('/echantillons/:id/analyses', async (req, res) => {
  try {
    const echantillon = await Echantillon.findById(req.params.id);
    if (!echantillon) {
      return res.status(404).json({ message: 'Échantillon non trouvé' });
    }

    const analyse = new Analyse({
      ...req.body,
      echantillon: echantillon._id,
      createdBy: req.user.id
    });
    await analyse.save();

    echantillon.analyses.push({
      type: analyse._id,
      technicien: req.user.id
    });
    await echantillon.save();

    res.status(201).json(analyse);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// POST /api/laboratoire/echantillons/:id/decision-qualite - Prendre une décision qualité
router.post('/echantillons/:id/decision-qualite', async (req, res) => {
  try {
    const echantillon = await Echantillon.findById(req.params.id);
    if (!echantillon) {
      return res.status(404).json({ message: 'Échantillon non trouvé' });
    }

    echantillon.decisionQualite = {
      ...req.body,
      decideur: req.user.id,
      dateDecision: new Date()
    };

    await echantillon.save();
    res.json(echantillon);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// ==================== ROUTES ANALYSES ====================

// GET /api/laboratoire/analyses - Obtenir toutes les analyses
router.get('/analyses', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, statut, echantillon } = req.query;
    
    const filter = { isArchived: false };
    if (type) filter.type = type;
    if (statut) filter.statut = statut;
    if (echantillon) filter.echantillon = echantillon;

    const analyses = await Analyse.find(filter)
      .populate('echantillon', 'numero numeroLot produit')
      .populate('resultats.technicien', 'nom prenom')
      .populate('resultats.validation.validePar', 'nom prenom')
      .sort({ datePlanification: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Analyse.countDocuments(filter);

    res.json({
      analyses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/laboratoire/analyses/:id - Obtenir une analyse par ID
router.get('/analyses/:id', async (req, res) => {
  try {
    const analyse = await Analyse.findById(req.params.id)
      .populate('echantillon', 'numero numeroLot produit mesuresInitiales')
      .populate('resultats.technicien', 'nom prenom')
      .populate('resultats.validation.validePar', 'nom prenom')
      .populate('historique.utilisateur', 'nom prenom');

    if (!analyse) {
      return res.status(404).json({ message: 'Analyse non trouvée' });
    }

    res.json(analyse);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/laboratoire/analyses - Créer une nouvelle analyse
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

// PUT /api/laboratoire/analyses/:id - Mettre à jour une analyse
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

// POST /api/laboratoire/analyses/:id/resultats - Ajouter des résultats
router.post('/analyses/:id/resultats', async (req, res) => {
  try {
    const analyse = await Analyse.findById(req.params.id);
    if (!analyse) {
      return res.status(404).json({ message: 'Analyse non trouvée' });
    }

    analyse.resultats = {
      ...req.body,
      technicien: req.user.id,
      dateAnalyse: new Date()
    };

    await analyse.save();
    res.json(analyse);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// POST /api/laboratoire/analyses/:id/valider - Valider une analyse
router.post('/analyses/:id/valider', async (req, res) => {
  try {
    const analyse = await Analyse.findById(req.params.id);
    if (!analyse) {
      return res.status(404).json({ message: 'Analyse non trouvée' });
    }

    analyse.valider(req.user.id, req.body.niveau || 'Technicien', req.body.commentaire || '');
    await analyse.save();

    res.json(analyse);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// ==================== ROUTES PLANS DE CONTRÔLE ====================

// GET /api/laboratoire/plans-controle - Obtenir tous les plans de contrôle
router.get('/plans-controle', async (req, res) => {
  try {
    console.log('📋 GET /plans-controle - Début');
    const { page = 1, limit = 10, statut, type, produit } = req.query;
    
    const filter = { isArchived: false };
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (produit) filter['concerne.nom'] = new RegExp(produit, 'i');

    console.log('📋 Filter:', JSON.stringify(filter));

    const plans = await PlanControle.find(filter)
      .populate('responsable', 'nom prenom')
      .populate('equipe.membre', 'nom prenom')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PlanControle.countDocuments(filter);

    console.log(`📋 Plans trouvés: ${plans.length}/${total}`);

    res.json({
      plans,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('❌ Erreur GET /plans-controle:', error.message);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ message: 'Erreur serveur', error: error.message, stack: error.stack });
  }
});

// GET /api/laboratoire/plans-controle/:id - Obtenir un plan de contrôle par ID
router.get('/plans-controle/:id', async (req, res) => {
  try {
    const plan = await PlanControle.findById(req.params.id)
      .populate('responsable', 'nom prenom')
      .populate('equipe.membre', 'nom prenom')
      .populate('historique.utilisateur', 'nom prenom');

    if (!plan) {
      return res.status(404).json({ message: 'Plan de contrôle non trouvé' });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/laboratoire/plans-controle - Créer un nouveau plan de contrôle
router.post('/plans-controle', async (req, res) => {
  try {
    console.log('📝 Données reçues pour plan de contrôle:', JSON.stringify(req.body, null, 2));
    
    const plan = new PlanControle({
      ...req.body,
      responsable: req.user.id,
      createdBy: req.user.id
    });

    await plan.save();
    console.log('✅ Plan de contrôle créé:', plan.numero);
    res.status(201).json(plan);
  } catch (error) {
    console.error('❌ Erreur création plan de contrôle:', error.message);
    console.error('🔍 Détails erreur:', error);
    res.status(400).json({ 
      message: 'Données invalides', 
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : null
    });
  }
});

// DELETE /api/laboratoire/echantillons/:id - Supprimer un échantillon
router.delete('/echantillons/:id', async (req, res) => {
  try {
    const deleted = await Echantillon.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Échantillon introuvable' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: 'Suppression impossible', error: error.message });
  }
});

// DELETE /api/laboratoire/analyses/:id - Supprimer une analyse
router.delete('/analyses/:id', async (req, res) => {
  try {
    const deleted = await Analyse.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Analyse introuvable' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: 'Suppression impossible', error: error.message });
  }
});

// DELETE /api/laboratoire/plans-controle/:id - Supprimer un plan de contrôle
router.delete('/plans-controle/:id', async (req, res) => {
  try {
    const deleted = await PlanControle.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Plan de contrôle introuvable' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: 'Suppression impossible', error: error.message });
  }
});

// PUT /api/laboratoire/plans-controle/:id - Mettre à jour un plan de contrôle
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

// POST /api/laboratoire/plans-controle/:id/activer - Activer un plan de contrôle
router.post('/plans-controle/:id/activer', async (req, res) => {
  try {
    const plan = await PlanControle.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan de contrôle non trouvé' });
    }

    plan.activer(req.user.id);
    await plan.save();

    res.json(plan);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// ==================== ROUTES RÉSULTATS D'ANALYSES ====================

// GET /api/laboratoire/resultats - Obtenir tous les résultats d'analyses
router.get('/resultats', async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, echantillon, analyse } = req.query;
    
    const filter = { isArchived: false };
    if (statut) filter.statut = statut;
    if (echantillon) filter.echantillon = echantillon;
    if (analyse) filter.analyse = analyse;

    const resultats = await ResultatAnalyse.find(filter)
      .populate('echantillon', 'numero numeroLot produit')
      .populate('analyse', 'nom type categorie')
      .populate('resultats.technicien', 'nom prenom')
      .populate('validation.validePar', 'nom prenom')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ResultatAnalyse.countDocuments(filter);

    res.json({
      resultats,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/laboratoire/resultats/:id - Obtenir un résultat d'analyse par ID
router.get('/resultats/:id', async (req, res) => {
  try {
    const resultat = await ResultatAnalyse.findById(req.params.id)
      .populate('echantillon', 'numero numeroLot produit mesuresInitiales')
      .populate('analyse', 'nom type categorie methode seuils')
      .populate('resultats.technicien', 'nom prenom')
      .populate('validation.validePar', 'nom prenom')
      .populate('historique.utilisateur', 'nom prenom');

    if (!resultat) {
      return res.status(404).json({ message: 'Résultat d\'analyse non trouvé' });
    }

    res.json(resultat);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/laboratoire/resultats - Créer un nouveau résultat d'analyse
router.post('/resultats', async (req, res) => {
  try {
    const resultat = new ResultatAnalyse({
      ...req.body,
      createdBy: req.user.id
    });

    await resultat.save();
    res.status(201).json(resultat);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// PUT /api/laboratoire/resultats/:id - Mettre à jour un résultat d'analyse
router.put('/resultats/:id', async (req, res) => {
  try {
    const resultat = await ResultatAnalyse.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!resultat) {
      return res.status(404).json({ message: 'Résultat d\'analyse non trouvé' });
    }

    res.json(resultat);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// ==================== ROUTES STATISTIQUES ====================

// GET /api/laboratoire/stats - Obtenir les statistiques du laboratoire
router.get('/stats', async (req, res) => {
  try {
    const { periode = 'mois' } = req.query;
    
    const dateDebut = new Date();
    if (periode === 'semaine') {
      dateDebut.setDate(dateDebut.getDate() - 7);
    } else if (periode === 'mois') {
      dateDebut.setMonth(dateDebut.getMonth() - 1);
    } else if (periode === 'trimestre') {
      dateDebut.setMonth(dateDebut.getMonth() - 3);
    } else if (periode === 'annee') {
      dateDebut.setFullYear(dateDebut.getFullYear() - 1);
    }

    // Statistiques des échantillons
    const echantillonsTotal = await Echantillon.countDocuments({ isArchived: false });
    const echantillonsConformes = await Echantillon.countDocuments({ 
      'resultats.conformite': 'Conforme',
      isArchived: false 
    });
    const echantillonsNonConformes = await Echantillon.countDocuments({ 
      'resultats.conformite': 'Non conforme',
      isArchived: false 
    });

    // Statistiques des analyses
    const analysesTotal = await Analyse.countDocuments({ isArchived: false });
    const analysesTerminees = await Analyse.countDocuments({ 
      statut: 'Terminée',
      isArchived: false 
    });
    const analysesValidees = await Analyse.countDocuments({ 
      statut: 'Validée',
      isArchived: false 
    });

    // Statistiques des plans de contrôle
    const plansTotal = await PlanControle.countDocuments({ isArchived: false });
    const plansActifs = await PlanControle.countDocuments({ 
      statut: 'Actif',
      isArchived: false 
    });

    res.json({
      echantillons: {
        total: echantillonsTotal,
        conformes: echantillonsConformes,
        nonConformes: echantillonsNonConformes,
        tauxConformite: echantillonsTotal > 0 ? 
          Math.round((echantillonsConformes / echantillonsTotal) * 100) : 0
      },
      analyses: {
        total: analysesTotal,
        terminees: analysesTerminees,
        validees: analysesValidees,
        tauxReussite: analysesTotal > 0 ? 
          Math.round((analysesValidees / analysesTotal) * 100) : 0
      },
      plansControle: {
        total: plansTotal,
        actifs: plansActifs
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
