const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
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
const ProduitChimique = require('../models/ProduitChimique');
const Risque = require('../models/Risque');
const Formation = require('../models/Formation');
const Hygiene = require('../models/Hygiene');
const Incident = require('../models/Incident');
const EPI = require('../models/EPI');

// Protection des routes par authentification
router.use(auth);

// ==================== ROUTES MATIÈRES PREMIÈRES ====================

// GET /api/qualite/matieres-premieres - Obtenir toutes les matières premières
router.get('/matieres-premieres', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      statut, 
      fournisseur, 
      type, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { isArchived: false };
    
    // Filtres de base
    if (statut) filter.statut = statut;
    if (fournisseur) filter['fournisseur.nom'] = new RegExp(fournisseur, 'i');
    if (type) filter['caracteristiques.type'] = type;
    
    // Recherche textuelle
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { nom: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'fournisseur.nom': new RegExp(search, 'i') }
      ];
    }

    // Configuration du tri
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const matieresPremieres = await MatierePremiere.find(filter)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Utiliser lean() pour de meilleures performances

    const total = await MatierePremiere.countDocuments(filter);

    // Calculer les statistiques des lots pour chaque matière première
    const matieresAvecStats = matieresPremieres.map(mp => {
      const stats = mp.lots ? {
        totalLots: mp.lots.length,
        enStock: mp.lots.filter(lot => lot.statut === 'En stock').length,
        utilises: mp.lots.filter(lot => lot.statut === 'Utilisé').length,
        perimes: mp.lots.filter(lot => lot.statut === 'Périmé').length,
        rejetes: mp.lots.filter(lot => lot.statut === 'Rejeté').length
      } : { totalLots: 0, enStock: 0, utilises: 0, perimes: 0, rejetes: 0 };
      
      return { ...mp, stats };
    });

    res.json({
      matieresPremieres: matieresAvecStats,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des matières premières:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
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
    const matierePremiere = new MatierePremiere({
      ...req.body,
      createdBy: req.user.id
    });

    await matierePremiere.save();
    res.status(201).json(matierePremiere);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
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
    const matierePremiere = await MatierePremiere.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, updatedBy: req.user.id },
      { new: true }
    );

    if (!matierePremiere) {
      return res.status(404).json({ message: 'Matière première non trouvée' });
    }

    res.json({ message: 'Matière première supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/matieres-premieres/:id/lots - Ajouter un lot
router.post('/matieres-premieres/:id/lots', async (req, res) => {
  try {
    const matierePremiere = await MatierePremiere.findById(req.params.id);
    if (!matierePremiere) {
      return res.status(404).json({ message: 'Matière première non trouvée' });
    }

    matierePremiere.ajouterLot(req.body);
    await matierePremiere.save();

    res.json(matierePremiere);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// POST /api/qualite/matieres-premieres/:id/lots/:numeroLot/decision - Prendre une décision qualité
router.post('/matieres-premieres/:id/lots/:numeroLot/decision', async (req, res) => {
  try {
    const matierePremiere = await MatierePremiere.findById(req.params.id);
    if (!matierePremiere) {
      return res.status(404).json({ message: 'Matière première non trouvée' });
    }

    matierePremiere.deciderQualiteLot(
      req.params.numeroLot,
      req.body.decision,
      req.user.id,
      req.body.commentaire
    );
    await matierePremiere.save();

    res.json(matierePremiere);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
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
      zone, 
      search,
      sortBy = 'datePlanification',
      sortOrder = 'desc',
      priorite
    } = req.query;
    
    const filter = { isArchived: false };
    
    // Filtres de base
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (zone) filter['localisation.zone'] = new RegExp(zone, 'i');
    if (priorite) filter.priorite = priorite;
    
    // Recherche textuelle
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { titre: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'produit.nom': new RegExp(search, 'i') },
        { 'localisation.zone': new RegExp(search, 'i') }
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
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ControleQualite.countDocuments(filter);

    // Calculer les statistiques pour chaque contrôle
    const controlesAvecStats = controles.map(controle => {
      const stats = {
        totalCriteres: controle.criteres ? controle.criteres.length : 0,
        resultatsSaisis: controle.resultats ? controle.resultats.length : 0,
        criteresConformes: controle.resultats ? 
          controle.resultats.filter(r => r.conforme).length : 0,
        actionsEnCours: controle.actionsCorrectives ? 
          controle.actionsCorrectives.filter(a => a.statut === 'En cours').length : 0,
        actionsTerminees: controle.actionsCorrectives ? 
          controle.actionsCorrectives.filter(a => a.statut === 'Terminée').length : 0
      };
      
      return { ...controle, stats };
    });

    res.json({
      controles: controlesAvecStats,
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
      controleur: req.user.id,
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

// POST /api/qualite/controles-qualite/:id/resultats - Ajouter des résultats
router.post('/controles-qualite/:id/resultats', async (req, res) => {
  try {
    const controle = await ControleQualite.findById(req.params.id);
    if (!controle) {
      return res.status(404).json({ message: 'Contrôle qualité non trouvé' });
    }

    controle.ajouterResultat(
      req.body.critereId,
      req.body.valeur,
      req.body.unite,
      req.user.id
    );
    await controle.save();

    res.json(controle);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// POST /api/qualite/controles-qualite/:id/valider - Valider un contrôle
router.post('/controles-qualite/:id/valider', async (req, res) => {
  try {
    const controle = await ControleQualite.findById(req.params.id);
    if (!controle) {
      return res.status(404).json({ message: 'Contrôle qualité non trouvé' });
    }

    controle.valider(req.user.id, req.body.commentaire || '');
    await controle.save();

    res.json(controle);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/qualite/controles-qualite/:id - Supprimer un contrôle qualité
router.delete('/controles-qualite/:id', async (req, res) => {
  try {
    const controle = await ControleQualite.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, updatedBy: req.user.id },
      { new: true }
    );

    if (!controle) {
      return res.status(404).json({ message: 'Contrôle qualité non trouvé' });
    }

    res.json({ message: 'Contrôle qualité supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
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

    // Calculer les statistiques pour chaque non-conformité
    const ncsAvecStats = nonConformites.map(nc => {
      const stats = {
        totalActionsCorrectives: nc.actionsCorrectives ? nc.actionsCorrectives.length : 0,
        actionsEnCours: nc.actionsCorrectives ? 
          nc.actionsCorrectives.filter(a => a.statut === 'En cours').length : 0,
        actionsTerminees: nc.actionsCorrectives ? 
          nc.actionsCorrectives.filter(a => a.statut === 'Terminée').length : 0,
        totalActionsPreventives: nc.actionsPreventives ? nc.actionsPreventives.length : 0,
        coutTotal: (nc.impact?.production?.cout || 0) + (nc.impact?.qualite?.cout || 0),
        delaiResolution: nc.fermeture?.date && nc.detection?.date ? 
          Math.ceil((nc.fermeture.date - nc.detection.date) / (1000 * 60 * 60 * 24)) : null
      };
      
      return { ...nc, stats };
    });

    res.json({
      nonConformites: ncsAvecStats,
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
      .populate('fermeture.fermePar', 'nom prenom')
      .populate('historique.utilisateur', 'nom prenom');

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
      detection: {
        ...req.body.detection,
        detecteur: req.user.id
      },
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

// POST /api/qualite/non-conformites/:id/fermer - Fermer une non-conformité
router.post('/non-conformites/:id/fermer', async (req, res) => {
  try {
    const nonConformite = await NonConformite.findById(req.params.id);
    if (!nonConformite) {
      return res.status(404).json({ message: 'Non-conformité non trouvée' });
    }

    nonConformite.fermer(
      req.user.id,
      req.body.commentaire || '',
      req.body.efficaciteGlobale || 'Efficace'
    );
    await nonConformite.save();

    res.json(nonConformite);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// POST /api/qualite/non-conformites/:id/cloturer - Clôturer une non-conformité
router.post('/non-conformites/:id/cloturer', async (req, res) => {
  try {
    const nonConformite = await NonConformite.findById(req.params.id);
    if (!nonConformite) {
      return res.status(404).json({ message: 'Non-conformité non trouvée' });
    }

    nonConformite.cloturer(req.user.id, req.body.commentaire || '');
    await nonConformite.save();

    res.json(nonConformite);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/qualite/non-conformites/:id - Supprimer une non-conformité
router.delete('/non-conformites/:id', async (req, res) => {
  try {
    const nonConformite = await NonConformite.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, updatedBy: req.user.id },
      { new: true }
    );

    if (!nonConformite) {
      return res.status(404).json({ message: 'Non-conformité non trouvée' });
    }

    res.json({ message: 'Non-conformité supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES STATISTIQUES ====================

// GET /api/qualite/stats - Obtenir les statistiques de qualité
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

    // Statistiques des matières premières
    const matieresPremieresTotal = await MatierePremiere.countDocuments({ isArchived: false });
    const matieresPremieresActives = await MatierePremiere.countDocuments({ 
      statut: 'Actif',
      isArchived: false 
    });

    // Statistiques des contrôles qualité
    const controlesTotal = await ControleQualite.countDocuments({ isArchived: false });
    const controlesConformes = await ControleQualite.countDocuments({ 
      'evaluation.statut': 'Conforme',
      isArchived: false 
    });
    const controlesNonConformes = await ControleQualite.countDocuments({ 
      'evaluation.statut': 'Non conforme',
      isArchived: false 
    });

    // Statistiques des non-conformités
    const nonConformitesTotal = await NonConformite.countDocuments({ isArchived: false });
    const nonConformitesOuvertes = await NonConformite.countDocuments({ 
      statut: { $in: ['Déclarée', 'En investigation', 'En traitement'] },
      isArchived: false 
    });
    const nonConformitesFermees = await NonConformite.countDocuments({ 
      statut: { $in: ['Résolue', 'Fermée', 'Clôturée'] },
      isArchived: false 
    });

    // Calcul des taux
    const tauxConformite = controlesTotal > 0 ? 
      Math.round((controlesConformes / controlesTotal) * 100) : 0;
    const tauxResolution = nonConformitesTotal > 0 ? 
      Math.round((nonConformitesFermees / nonConformitesTotal) * 100) : 0;

    res.json({
      matieresPremieres: {
        total: matieresPremieresTotal,
        actives: matieresPremieresActives
      },
      controlesQualite: {
        total: controlesTotal,
        conformes: controlesConformes,
        nonConformes: controlesNonConformes,
        tauxConformite
      },
      nonConformites: {
        total: nonConformitesTotal,
        ouvertes: nonConformitesOuvertes,
        fermees: nonConformitesFermees,
        tauxResolution
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qualite/stats/avancees - Statistiques avancées
router.get('/stats/avancees', async (req, res) => {
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

    // Évolution des non-conformités par gravité
    const ncsParGravite = await NonConformite.aggregate([
      { $match: { isArchived: false, 'detection.date': { $gte: dateDebut } } },
      { $group: { _id: '$gravite', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Évolution des contrôles par type
    const controlesParType = await ControleQualite.aggregate([
      { $match: { isArchived: false, datePlanification: { $gte: dateDebut } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Taux de conformité par mois
    const conformiteParMois = await ControleQualite.aggregate([
      { $match: { isArchived: false, datePlanification: { $gte: dateDebut } } },
      {
        $group: {
          _id: {
            year: { $year: '$datePlanification' },
            month: { $month: '$datePlanification' }
          },
          total: { $sum: 1 },
          conformes: {
            $sum: { $cond: [{ $eq: ['$evaluation.statut', 'Conforme'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          tauxConformite: {
            $round: [{ $multiply: [{ $divide: ['$conformes', '$total'] }, 100] }, 2]
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top 5 des zones avec le plus de non-conformités
    const topZonesNC = await NonConformite.aggregate([
      { $match: { isArchived: false, 'detection.date': { $gte: dateDebut } } },
      { $group: { _id: '$localisation.zone', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      ncsParGravite,
      controlesParType,
      conformiteParMois,
      topZonesNC
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques avancées:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES ACTIONS RAPIDES ====================

// POST /api/qualite/actions-rapides/valider-controle - Valider un contrôle rapidement
router.post('/actions-rapides/valider-controle', async (req, res) => {
  try {
    const { controleId, commentaire } = req.body;
    
    const controle = await ControleQualite.findById(controleId);
    if (!controle) {
      return res.status(404).json({ message: 'Contrôle non trouvé' });
    }

    controle.valider(req.user.id, commentaire || '');
    await controle.save();

    res.json({ message: 'Contrôle validé avec succès', controle });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/actions-rapides/fermer-nc - Fermer une non-conformité rapidement
router.post('/actions-rapides/fermer-nc', async (req, res) => {
  try {
    const { ncId, commentaire, efficaciteGlobale } = req.body;
    
    const nc = await NonConformite.findById(ncId);
    if (!nc) {
      return res.status(404).json({ message: 'Non-conformité non trouvée' });
    }

    nc.fermer(req.user.id, commentaire || '', efficaciteGlobale || 'Efficace');
    await nc.save();

    res.json({ message: 'Non-conformité fermée avec succès', nc });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/actions-rapides/decider-lot - Prendre une décision sur un lot
router.post('/actions-rapides/decider-lot', async (req, res) => {
  try {
    const { matiereId, numeroLot, decision, commentaire } = req.body;
    
    const matiere = await MatierePremiere.findById(matiereId);
    if (!matiere) {
      return res.status(404).json({ message: 'Matière première non trouvée' });
    }

    matiere.deciderQualiteLot(numeroLot, decision, req.user.id, commentaire || '');
    await matiere.save();

    res.json({ message: 'Décision prise avec succès', matiere });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES AUDITS (Qualité) ====================

// GET /api/qualite/audits - Obtenir les audits du domaine Qualité
router.get('/audits', async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type } = req.query;

    const filter = { isArchived: false, domaine: 'Qualité' };
    if (statut) filter.statut = statut;
    if (type) filter.type = type;

    const audits = await Audit.find(filter)
      .populate('auditeurPrincipal', 'nom prenom')
      .populate('auditeurs.auditeur', 'nom prenom')
      .sort({ datePlanification: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Audit.countDocuments(filter);

    res.json({
      audits,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/audits - Créer un audit (domaine Qualité)
router.post('/audits', async (req, res) => {
  try {
    const audit = new Audit({
      ...req.body,
      domaine: 'Qualité',
      demandeur: req.user.id,
      auditeurPrincipal: req.user.id,
      createdBy: req.user.id
    });

    await audit.save();
    res.status(201).json(audit);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// ==================== ROUTES CONFORMITE ====================

// GET /api/qualite/conformite - Obtenir les enregistrements de conformité (domaine Qualité)
router.get('/conformite', async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type } = req.query;

    const filter = { isArchived: false, domaine: 'Qualité' };
    if (statut) filter.statutConformite = statut;
    if (type) filter.type = type;

    const conformites = await Conformite.find(filter)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .populate('derniereEvaluation.evaluateur', 'nom prenom')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Conformite.countDocuments(filter);

    res.json({
      conformites,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/conformite - Créer un nouvel enregistrement de conformité (domaine Qualité)
router.post('/conformite', async (req, res) => {
  try {
    console.log('📝 Données reçues pour conformité:', JSON.stringify(req.body, null, 2));
    const typeEnum = ['Législation', 'Réglementation', 'Norme', 'Certification', 'Accréditation', 'Autorisation'];
    const statutEnum = ['Conforme', 'Non conforme', 'En cours de mise en conformité', 'Non applicable', 'À évaluer'];
    const docTypeEnum = ['Procédure', 'Instruction', 'Registre', 'Certificat', 'Autorisation', 'Rapport'];
    const certStatutEnum = ['Valide', 'Expiré', 'En cours de renouvellement', 'Suspendu', 'Révoqué'];

    const body = req.body || {};

    const conformiteData = {
      numero: (body.numero && String(body.numero).trim()) || `CONF-${Date.now()}`,
      titre: (body.titre && String(body.titre).trim()) || 'Conformité',
      description: (body.description && String(body.description).trim()) || 'Description non renseignée',
      type: typeEnum.includes(body.type) ? body.type : 'Norme',
      domaine: 'Qualité',
      createdBy: req.user.id
    };

    if (body.reference) {
      if (typeof body.reference === 'string') {
        conformiteData.reference = { texte: body.reference };
      } else if (typeof body.reference === 'object') {
        const ref = body.reference || {};
        conformiteData.reference = {
          texte: ref.texte,
          article: ref.article,
          paragraphe: ref.paragraphe,
          organisme: ref.organisme,
          pays: ref.pays,
          datePublication: ref.datePublication ? new Date(ref.datePublication) : undefined,
          dateEntreeVigueur: ref.dateEntreeVigueur ? new Date(ref.dateEntreeVigueur) : undefined
        };
      }
    }

    if (statutEnum.includes(body.statutConformite)) {
      conformiteData.statutConformite = body.statutConformite;
    }

    if (Array.isArray(body.documents)) {
      conformiteData.documents = body.documents
        .map(d => ({
          nom: d?.nom,
          type: docTypeEnum.includes(d?.type) ? d.type : undefined,
          version: d?.version,
          dateCreation: d?.dateCreation ? new Date(d.dateCreation) : (d?.date ? new Date(d.date) : undefined),
          dateRevision: d?.dateRevision ? new Date(d.dateRevision) : undefined,
          url: d?.url,
          responsable: d?.responsable
        }))
        .filter(d => d.nom && d.type);
    }

    if (Array.isArray(body.certifications)) {
      conformiteData.certifications = body.certifications
        .map(c => ({
          nom: c?.nom || c?.type || 'Certification',
          organisme: c?.organisme,
          numero: c?.numero,
          dateObtention: c?.dateObtention ? new Date(c.dateObtention) : undefined,
          dateExpiration: c?.dateExpiration ? new Date(c.dateExpiration) : undefined,
          statut: certStatutEnum.includes(c?.statut) ? c.statut : undefined,
          conditions: Array.isArray(c?.conditions) ? c.conditions : []
        }))
        .filter(c => c.nom && c.numero);
    }

    // On ignore silencieusement les autres sous-structures optionnelles si non conformes

    const conformite = new Conformite(conformiteData);

    await conformite.save();
    console.log('✅ Conformité créée avec succès:', conformite._id);
    res.status(201).json(conformite);
  } catch (error) {
    console.error('❌ Erreur création conformité:', error.message);
    console.error('❌ Détails validation:', error.errors);
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

// PUT /api/qualite/conformite/:id - Mettre à jour un enregistrement de conformité
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

// DELETE /api/qualite/conformite/:id - Supprimer un enregistrement de conformité
router.delete('/conformite/:id', async (req, res) => {
  try {
    const conformite = await Conformite.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, updatedBy: req.user.id },
      { new: true }
    );

    if (!conformite) {
      return res.status(404).json({ message: 'Conformité non trouvée' });
    }

    res.json({ message: 'Conformité supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES DECISIONS QUALITE ====================

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

// POST /api/qualite/decisions-qualite - Créer une nouvelle décision qualité
router.post('/decisions-qualite', async (req, res) => {
  try {
    const decision = new DecisionQualite({
      ...req.body,
      decisionnaire: req.user.id,
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
      return res.status(404).json({ message: 'Décision non trouvée' });
    }

    res.json(decision);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// POST /api/qualite/decisions-qualite/:id/valider - Valider une décision
router.post('/decisions-qualite/:id/valider', async (req, res) => {
  try {
    const decision = await DecisionQualite.findById(req.params.id);
    if (!decision) {
      return res.status(404).json({ message: 'Décision non trouvée' });
    }

    decision.valider(req.user.id, req.body.commentaire || '');
    await decision.save();

    res.json(decision);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/qualite/decisions-qualite/:id - Supprimer une décision qualité
router.delete('/decisions-qualite/:id', async (req, res) => {
  try {
    const decision = await DecisionQualite.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, updatedBy: req.user.id },
      { new: true }
    );

    if (!decision) {
      return res.status(404).json({ message: 'Décision non trouvée' });
    }

    res.json({ message: 'Décision supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
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
        { description: new RegExp(search, 'i') },
        { 'concerne.reference': new RegExp(search, 'i') }
      ];
    }

    // Configuration du tri
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const plans = await PlanControle.find(filter)
      .populate('responsable', 'nom prenom')
      .populate('equipe.membre', 'nom prenom')
      .populate('createdBy', 'nom prenom')
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
      return res.status(404).json({ message: 'Plan non trouvé' });
    }

    res.json(plan);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// POST /api/qualite/plans-controle/:id/approuver - Approuver un plan
router.post('/plans-controle/:id/approuver', async (req, res) => {
  try {
    const plan = await PlanControle.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan non trouvé' });
    }

    plan.approuver(req.user.id, req.body.commentaire || '');
    await plan.save();

    res.json(plan);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/qualite/plans-controle/:id - Supprimer un plan de contrôle
router.delete('/plans-controle/:id', async (req, res) => {
  try {
    const plan = await PlanControle.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, updatedBy: req.user.id },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ message: 'Plan non trouvé' });
    }

    res.json({ message: 'Plan supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES TRACABILITÉ ====================

// GET /api/qualite/tracabilite - Obtenir tous les enregistrements de traçabilité
router.get('/tracabilite', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      statut, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { isArchived: false };
    
    // Filtres de base
    if (type) filter.type = type;
    if (statut) filter.statut = statut;
    
    // Recherche textuelle
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { reference: new RegExp(search, 'i') },
        { nom: new RegExp(search, 'i') },
        { lot: new RegExp(search, 'i') }
      ];
    }

    // Configuration du tri
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const tracabilites = await Tracabilite.find(filter)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .populate('transformation.responsable', 'nom prenom')
      .populate('controles.responsable', 'nom prenom')
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
    console.error('Erreur lors de la récupération de la traçabilité:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/tracabilite - Créer un nouvel enregistrement de traçabilité
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

// POST /api/qualite/tracabilite/:id/simuler-rappel - Simuler un rappel
router.post('/tracabilite/:id/simuler-rappel', async (req, res) => {
  try {
    const tracabilite = await Tracabilite.findById(req.params.id);
    if (!tracabilite) {
      return res.status(404).json({ message: 'Enregistrement de traçabilité non trouvé' });
    }

    tracabilite.simulerRappel(
      req.body.raison,
      req.body.quantite,
      req.body.unite
    );
    await tracabilite.save();

    res.json(tracabilite);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
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
    
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { nom: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const analyses = await Analyse.find(filter)
      .populate('responsable', 'nom prenom')
      .populate('createdBy', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Analyse.countDocuments(filter);

    res.json({
      analyses,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des analyses:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/analyses - Créer une nouvelle analyse
router.post('/analyses', async (req, res) => {
  try {
    const analyse = new Analyse({
      ...req.body,
      responsable: req.user.id,
      createdBy: req.user.id
    });

    await analyse.save();
    res.status(201).json(analyse);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
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
    
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { nom: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const echantillons = await Echantillon.find(filter)
      .populate('responsable', 'nom prenom')
      .populate('createdBy', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Echantillon.countDocuments(filter);

    res.json({
      echantillons,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des échantillons:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/echantillons - Créer un nouvel échantillon
router.post('/echantillons', async (req, res) => {
  try {
    const echantillon = new Echantillon({
      ...req.body,
      responsable: req.user.id,
      createdBy: req.user.id
    });

    await echantillon.save();
    res.status(201).json(echantillon);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// ==================== ROUTES PRODUITS CHIMIQUES ====================

// GET /api/qualite/produits-chimiques - Obtenir tous les produits chimiques
router.get('/produits-chimiques', async (req, res) => {
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
    
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { nom: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const produits = await ProduitChimique.find(filter)
      .populate('responsable', 'nom prenom')
      .populate('createdBy', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ProduitChimique.countDocuments(filter);

    res.json({
      produits,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits chimiques:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/produits-chimiques - Créer un nouveau produit chimique
router.post('/produits-chimiques', async (req, res) => {
  try {
    const produit = new ProduitChimique({
      ...req.body,
      responsable: req.user.id,
      createdBy: req.user.id
    });

    await produit.save();
    res.status(201).json(produit);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// ==================== ROUTES RISQUES ====================

// GET /api/qualite/risques - Obtenir tous les risques
router.get('/risques', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      statut, 
      type, 
      gravite,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { isArchived: false };
    
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (gravite) filter.gravite = gravite;
    
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { nom: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const risques = await Risque.find(filter)
      .populate('responsable', 'nom prenom')
      .populate('createdBy', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Risque.countDocuments(filter);

    res.json({
      risques,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des risques:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/risques - Créer un nouveau risque
router.post('/risques', async (req, res) => {
  try {
    const risque = new Risque({
      ...req.body,
      responsable: req.user.id,
      createdBy: req.user.id
    });

    await risque.save();
    res.status(201).json(risque);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// ==================== ROUTES FORMATIONS ====================

// GET /api/qualite/formations - Obtenir toutes les formations
router.get('/formations', async (req, res) => {
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
    
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { nom: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const formations = await Formation.find(filter)
      .populate('formateur', 'nom prenom')
      .populate('createdBy', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Formation.countDocuments(filter);

    res.json({
      formations,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des formations:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/formations - Créer une nouvelle formation
router.post('/formations', async (req, res) => {
  try {
    const formation = new Formation({
      ...req.body,
      formateur: req.user.id,
      createdBy: req.user.id
    });

    await formation.save();
    res.status(201).json(formation);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// ==================== ROUTES HYGIÈNE ====================

// GET /api/qualite/hygiene - Obtenir tous les enregistrements d'hygiène
router.get('/hygiene', async (req, res) => {
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
    
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { nom: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const hygiene = await Hygiene.find(filter)
      .populate('responsable', 'nom prenom')
      .populate('createdBy', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Hygiene.countDocuments(filter);

    res.json({
      hygiene,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des enregistrements d\'hygiène:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/hygiene - Créer un nouvel enregistrement d'hygiène
router.post('/hygiene', async (req, res) => {
  try {
    const hygiene = new Hygiene({
      ...req.body,
      responsable: req.user.id,
      createdBy: req.user.id
    });

    await hygiene.save();
    res.status(201).json(hygiene);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// ==================== ROUTES INCIDENTS ====================

// GET /api/qualite/incidents - Obtenir tous les incidents
router.get('/incidents', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      statut, 
      type, 
      gravite,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { isArchived: false };
    
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (gravite) filter.gravite = gravite;
    
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { nom: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const incidents = await Incident.find(filter)
      .populate('responsable', 'nom prenom')
      .populate('createdBy', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Incident.countDocuments(filter);

    res.json({
      incidents,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des incidents:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/incidents - Créer un nouvel incident
router.post('/incidents', async (req, res) => {
  try {
    const incident = new Incident({
      ...req.body,
      responsable: req.user.id,
      createdBy: req.user.id
    });

    await incident.save();
    res.status(201).json(incident);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// ==================== ROUTES EPI ====================

// GET /api/qualite/epi - Obtenir tous les EPI
router.get('/epi', async (req, res) => {
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
    
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    
    if (search) {
      filter.$or = [
        { numero: new RegExp(search, 'i') },
        { nom: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const epi = await EPI.find(filter)
      .populate('responsable', 'nom prenom')
      .populate('createdBy', 'nom prenom')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await EPI.countDocuments(filter);

    res.json({
      epi,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des EPI:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qualite/epi - Créer un nouvel EPI
router.post('/epi', async (req, res) => {
  try {
    const epi = new EPI({
      ...req.body,
      responsable: req.user.id,
      createdBy: req.user.id
    });

    await epi.save();
    res.status(201).json(epi);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

module.exports = router;
