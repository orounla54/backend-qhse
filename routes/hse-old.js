const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const Hygiene = require('../models/Hygiene');
const EPI = require('../models/EPI');
const ProduitChimique = require('../models/ProduitChimique');
const Incident = require('../models/Incident');
const Risque = require('../models/Risque');
const Formation = require('../models/Formation');

// Protection des routes par authentification
router.use(auth);

// ==================== ROUTES HYGIÈNE ====================

// GET /api/hse/hygiene - Obtenir tous les contrôles d'hygiène
router.get('/hygiene', async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type, zone } = req.query;
    
    const filter = { isArchived: false };
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (zone) filter['zone.nom'] = new RegExp(zone, 'i');

    const hygiene = await Hygiene.find(filter)
      .populate('responsable', 'nom prenom')
      .populate('equipe.membre', 'nom prenom')
      .populate('resultats.mesureur', 'nom prenom')
      .populate('actionsCorrectives.responsable', 'nom prenom')
      .sort({ datePlanification: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Hygiene.countDocuments(filter);

    res.json({
      hygiene,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/hse/hygiene/:id - Obtenir un contrôle d'hygiène par ID
router.get('/hygiene/:id', async (req, res) => {
  try {
    const hygiene = await Hygiene.findById(req.params.id)
      .populate('responsable', 'nom prenom')
      .populate('equipe.membre', 'nom prenom')
      .populate('resultats.mesureur', 'nom prenom')
      .populate('actionsCorrectives.responsable', 'nom prenom')
      .populate('historique.utilisateur', 'nom prenom');

    if (!hygiene) {
      return res.status(404).json({ message: 'Contrôle d\'hygiène non trouvé' });
    }

    res.json(hygiene);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/hse/hygiene - Créer un nouveau contrôle d'hygiène
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

// PUT /api/hse/hygiene/:id - Mettre à jour un contrôle d'hygiène
router.put('/hygiene/:id', async (req, res) => {
  try {
    const hygiene = await Hygiene.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!hygiene) {
      return res.status(404).json({ message: 'Contrôle d\'hygiène non trouvé' });
    }

    res.json(hygiene);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// POST /api/hse/hygiene/:id/resultats - Ajouter des résultats
router.post('/hygiene/:id/resultats', async (req, res) => {
  try {
    const hygiene = await Hygiene.findById(req.params.id);
    if (!hygiene) {
      return res.status(404).json({ message: 'Contrôle d\'hygiène non trouvé' });
    }

    hygiene.ajouterResultat(
      req.body.critereId,
      req.body.valeur,
      req.body.unite,
      req.user.id
    );
    await hygiene.save();

    res.json(hygiene);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// ==================== ROUTES EPI ====================

// GET /api/hse/epi - Obtenir tous les EPI
router.get('/epi', async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type, categorie } = req.query;
    
    const filter = { isArchived: false };
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (categorie) filter.categorie = categorie;

    const epi = await EPI.find(filter)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .populate('dotations.employe', 'nom prenom')
      .populate('dotations.responsable', 'nom prenom')
      .populate('maintenance.responsable', 'nom prenom')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await EPI.countDocuments(filter);

    res.json({
      epi,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/hse/epi/:id - Obtenir un EPI par ID
router.get('/epi/:id', async (req, res) => {
  try {
    const epi = await EPI.findById(req.params.id)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .populate('dotations.employe', 'nom prenom')
      .populate('dotations.responsable', 'nom prenom')
      .populate('maintenance.responsable', 'nom prenom')
      .populate('historique.utilisateur', 'nom prenom');

    if (!epi) {
      return res.status(404).json({ message: 'EPI non trouvé' });
    }

    res.json(epi);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/hse/epi - Créer un nouvel EPI
router.post('/epi', async (req, res) => {
  try {
    const epi = new EPI({
      ...req.body,
      createdBy: req.user.id
    });

    await epi.save();
    res.status(201).json(epi);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// PUT /api/hse/epi/:id - Mettre à jour un EPI
router.put('/epi/:id', async (req, res) => {
  try {
    const epi = await EPI.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!epi) {
      return res.status(404).json({ message: 'EPI non trouvé' });
    }

    res.json(epi);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// POST /api/hse/epi/:id/dotation - Doter un employé
router.post('/epi/:id/dotation', async (req, res) => {
  try {
    const epi = await EPI.findById(req.params.id);
    if (!epi) {
      return res.status(404).json({ message: 'EPI non trouvé' });
    }

    epi.doterEmploye(
      req.body.employe,
      req.body.quantite,
      req.user.id,
      req.body.commentaire || ''
    );
    await epi.save();

    res.json(epi);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// POST /api/hse/epi/:id/retour - Rendre un EPI
router.post('/epi/:id/retour', async (req, res) => {
  try {
    const epi = await EPI.findById(req.params.id);
    if (!epi) {
      return res.status(404).json({ message: 'EPI non trouvé' });
    }

    epi.rendreEPI(
      req.body.employe,
      req.body.quantite,
      req.user.id,
      req.body.commentaire || ''
    );
    await epi.save();

    res.json(epi);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// GET /api/hse/epi/alertes-stock - Obtenir les EPI en alerte de stock
router.get('/epi/alertes-stock', async (req, res) => {
  try {
    const epi = await EPI.find({ isArchived: false });
    const epiEnAlerte = epi.filter(e => e.estEnAlerteStock());

    res.json(epiEnAlerte);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES PRODUITS CHIMIQUES ====================

// GET /api/hse/produits-chimiques - Obtenir tous les produits chimiques
router.get('/produits-chimiques', async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type, zone } = req.query;
    
    const filter = { isArchived: false };
    if (statut) filter.statut = statut;
    if (type) filter['classification.type'] = type;
    if (zone) filter['stock.localisation.zone'] = new RegExp(zone, 'i');

    const produits = await ProduitChimique.find(filter)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .populate('utilisation.utilisateur', 'nom prenom')
      .populate('controles.responsable', 'nom prenom')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ProduitChimique.countDocuments(filter);

    res.json({
      produits,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/hse/produits-chimiques/:id - Obtenir un produit chimique par ID
router.get('/produits-chimiques/:id', async (req, res) => {
  try {
    const produit = await ProduitChimique.findById(req.params.id)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .populate('utilisation.utilisateur', 'nom prenom')
      .populate('controles.responsable', 'nom prenom')
      .populate('historique.utilisateur', 'nom prenom');

    if (!produit) {
      return res.status(404).json({ message: 'Produit chimique non trouvé' });
    }

    res.json(produit);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/hse/produits-chimiques - Créer un nouveau produit chimique
router.post('/produits-chimiques', async (req, res) => {
  try {
    const produit = new ProduitChimique({
      ...req.body,
      createdBy: req.user.id
    });

    await produit.save();
    res.status(201).json(produit);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// PUT /api/hse/produits-chimiques/:id - Mettre à jour un produit chimique
router.put('/produits-chimiques/:id', async (req, res) => {
  try {
    const produit = await ProduitChimique.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!produit) {
      return res.status(404).json({ message: 'Produit chimique non trouvé' });
    }

    res.json(produit);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// POST /api/hse/produits-chimiques/:id/utilisation - Enregistrer une utilisation
router.post('/produits-chimiques/:id/utilisation', async (req, res) => {
  try {
    const produit = await ProduitChimique.findById(req.params.id);
    if (!produit) {
      return res.status(404).json({ message: 'Produit chimique non trouvé' });
    }

    produit.enregistrerUtilisation(
      req.body.quantite,
      req.user.id,
      req.body.zone,
      req.body.objectif,
      req.body.commentaire || ''
    );
    await produit.save();

    res.json(produit);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// GET /api/hse/produits-chimiques/alertes-stock - Obtenir les produits en alerte de stock
router.get('/produits-chimiques/alertes-stock', async (req, res) => {
  try {
    const produits = await ProduitChimique.find({ isArchived: false });
    const produitsEnAlerte = produits.filter(p => p.estEnAlerteStock());

    res.json(produitsEnAlerte);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/hse/produits-chimiques/perimes - Obtenir les produits périmés
router.get('/produits-chimiques/perimes', async (req, res) => {
  try {
    const produits = await ProduitChimique.find({ isArchived: false });
    const produitsPerimes = produits.filter(p => p.estPerime());

    res.json(produitsPerimes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES STATISTIQUES ====================

// GET /api/hse/test - Endpoint de test simple
router.get('/test', async (req, res) => {
  try {
    res.json({
      message: 'API HSE fonctionne correctement',
      timestamp: new Date().toISOString(),
      test: true
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/hse/dashboard-test - Endpoint de test avec données mock
router.get('/dashboard-test', async (req, res) => {
  try {
    const testData = {
      generales: {
        hygiene: 25,
        epi: 150,
        produitsChimiques: 45,
        incidents: 8,
        risques: 12,
        formations: 18
      },
      hygiene: {
        total: 25,
        conformes: 20,
        nonConformes: 3,
        enCours: 2,
        planifies: 5,
        tauxConformite: 80
      },
      epi: {
        total: 150,
        actifs: 120,
        inactifs: 20,
        enMaintenance: 5,
        enAlerte: 8
      },
      produitsChimiques: {
        total: 45,
        actifs: 40,
        inactifs: 3,
        enAlerte: 5,
        perimes: 2
      },
      incidents: {
        total: 8,
        critiques: 1,
        majeurs: 2,
        mineurs: 5,
        enCours: 3,
        resolus: 5,
        tauxResolution: 62,
        evolution: [],
        topZones: [
          { _id: 'Atelier Production', count: 3 },
          { _id: 'Laboratoire', count: 2 },
          { _id: 'Entrepôt', count: 1 }
        ]
      },
      risques: {
        total: 12,
        eleves: 2,
        moyens: 4,
        faibles: 6,
        enCours: 5,
        traites: 7,
        tauxTraitement: 58
      },
      formations: {
        total: 18,
        planifiees: 6,
        enCours: 3,
        terminees: 8,
        annulees: 1
      },
      alertes: [
        {
          type: 'warning',
          message: '8 EPI en alerte de stock',
          icon: 'HardHat'
        },
        {
          type: 'warning',
          message: '5 produits chimiques en alerte de stock',
          icon: 'AlertTriangle'
        },
        {
          type: 'error',
          message: '2 produits chimiques périmés',
          icon: 'AlertCircle'
        }
      ],
      periode: {
        debut: new Date().toISOString(),
        fin: new Date().toISOString(),
        type: 'mois'
      }
    };
    
    res.json(testData);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/hse/dashboard - Endpoint unifié pour le tableau de bord
router.get('/dashboard', async (req, res) => {
  try {
    const { periode = 'mois', dateDebut, dateFin } = req.query;
    
    console.log('Requête dashboard reçue avec paramètres:', { periode, dateDebut, dateFin });
    
    // Calcul de la période
    let startDate = new Date();
    if (dateDebut && dateFin) {
      startDate = new Date(dateDebut);
    } else {
      if (periode === 'semaine') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (periode === 'mois') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (periode === 'trimestre') {
        startDate.setMonth(startDate.getMonth() - 3);
      } else if (periode === 'annee') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }
    }

    const endDate = dateFin ? new Date(dateFin) : new Date();

    // Filtre de date pour les requêtes
    const dateFilter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // Statistiques générales - Totaux
    const [
      totalHygiene,
      totalEPI,
      totalProduitsChimiques,
      totalIncidents,
      totalRisques,
      totalFormations
    ] = await Promise.all([
      Hygiene.countDocuments({ isArchived: false }),
      EPI.countDocuments({ isArchived: false }),
      ProduitChimique.countDocuments({ isArchived: false }),
      Incident.countDocuments({ isArchived: false }),
      Risque.countDocuments({ isArchived: false }),
      Formation.countDocuments({ isArchived: false })
    ]);

    console.log('Statistiques générales:', {
      totalHygiene,
      totalEPI,
      totalProduitsChimiques,
      totalIncidents,
      totalRisques,
      totalFormations
    });

    // Statistiques d'hygiène détaillées
    const [
      hygieneConformes,
      hygieneNonConformes,
      hygieneEnCours,
      hygienePlanifies
    ] = await Promise.all([
      Hygiene.countDocuments({ 
        'evaluation.statut': 'Conforme',
        isArchived: false 
      }),
      Hygiene.countDocuments({ 
        'evaluation.statut': 'Non conforme',
        isArchived: false 
      }),
      Hygiene.countDocuments({ 
        'evaluation.statut': 'En cours',
        isArchived: false 
      }),
      Hygiene.countDocuments({ 
        statut: 'Planifie',
        isArchived: false 
      })
    ]);

    // Statistiques des EPI détaillées
    const [
      epiActifs,
      epiInactifs,
      epiEnMaintenance
    ] = await Promise.all([
      EPI.countDocuments({ 
        statut: 'Actif',
        isArchived: false 
      }),
      EPI.countDocuments({ 
        statut: 'Inactif',
        isArchived: false 
      }),
      EPI.countDocuments({ 
        statut: 'En maintenance',
        isArchived: false 
      })
    ]);

    // EPI en alerte de stock
    const epiEnAlerte = await EPI.find({ isArchived: false })
      .then(epi => epi.filter(e => e.estEnAlerteStock()).length);

    // Statistiques des produits chimiques détaillées
    const [
      produitsActifs,
      produitsInactifs,
      produitsEnAlerte,
      produitsPerimes
    ] = await Promise.all([
      ProduitChimique.countDocuments({ 
        statut: 'Actif',
        isArchived: false 
      }),
      ProduitChimique.countDocuments({ 
        statut: 'Inactif',
        isArchived: false 
      }),
      ProduitChimique.find({ isArchived: false })
        .then(produits => produits.filter(p => p.estEnAlerteStock()).length),
      ProduitChimique.find({ isArchived: false })
        .then(produits => produits.filter(p => p.estPerime()).length)
    ]);

    // Statistiques des incidents par gravité
    const [
      incidentsCritiques,
      incidentsMajeurs,
      incidentsMineurs,
      incidentsEnCours,
      incidentsResolus
    ] = await Promise.all([
      Incident.countDocuments({ 
        gravite: 'Critique',
        isArchived: false 
      }),
      Incident.countDocuments({ 
        gravite: 'Majeur',
        isArchived: false 
      }),
      Incident.countDocuments({ 
        gravite: 'Mineur',
        isArchived: false 
      }),
      Incident.countDocuments({ 
        statut: 'En cours',
        isArchived: false 
      }),
      Incident.countDocuments({ 
        statut: 'Résolu',
        isArchived: false 
      })
    ]);

    // Statistiques des risques par niveau
    const [
      risquesEleves,
      risquesMoyens,
      risquesFaibles,
      risquesEnCours,
      risquesTraites
    ] = await Promise.all([
      Risque.countDocuments({ 
        niveauRisque: 'Élevé',
        isArchived: false 
      }),
      Risque.countDocuments({ 
        niveauRisque: 'Moyen',
        isArchived: false 
      }),
      Risque.countDocuments({ 
        niveauRisque: 'Faible',
        isArchived: false 
      }),
      Risque.countDocuments({ 
        statut: 'En cours',
        isArchived: false 
      }),
      Risque.countDocuments({ 
        statut: 'Traité',
        isArchived: false 
      })
    ]);

    // Statistiques des formations
    const [
      formationsPlanifiees,
      formationsEnCours,
      formationsTerminees,
      formationsAnnulees
    ] = await Promise.all([
      Formation.countDocuments({ 
        statut: 'Planifiée',
        isArchived: false 
      }),
      Formation.countDocuments({ 
        statut: 'En cours',
        isArchived: false 
      }),
      Formation.countDocuments({ 
        statut: 'Terminée',
        isArchived: false 
      }),
      Formation.countDocuments({ 
        statut: 'Annulée',
        isArchived: false 
      })
    ]);

    // Évolution des incidents (6 derniers mois)
    const sixMoisAgo = new Date();
    sixMoisAgo.setMonth(sixMoisAgo.getMonth() - 6);
    
    const evolutionIncidents = await Incident.aggregate([
      {
        $match: {
          isArchived: false,
          dateIncident: { $gte: sixMoisAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateIncident' },
            month: { $month: '$dateIncident' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top 5 des zones avec le plus d'incidents
    const topZonesIncidents = await Incident.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$localisation.zone', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Calcul des taux de conformité
    const tauxConformiteHygiene = totalHygiene > 0 ? 
      Math.round((hygieneConformes / totalHygiene) * 100) : 0;
    
    const tauxResolutionIncidents = totalIncidents > 0 ? 
      Math.round((incidentsResolus / totalIncidents) * 100) : 0;
    
    const tauxTraitementRisques = totalRisques > 0 ? 
      Math.round((risquesTraites / totalRisques) * 100) : 0;

    // Alertes et notifications
    const alertes = [];
    if (epiEnAlerte > 0) {
      alertes.push({
        type: 'warning',
        message: `${epiEnAlerte} EPI en alerte de stock`,
        icon: 'HardHat'
      });
    }
    if (produitsEnAlerte > 0) {
      alertes.push({
        type: 'warning',
        message: `${produitsEnAlerte} produits chimiques en alerte de stock`,
        icon: 'AlertTriangle'
      });
    }
    if (produitsPerimes > 0) {
      alertes.push({
        type: 'error',
        message: `${produitsPerimes} produits chimiques périmés`,
        icon: 'AlertCircle'
      });
    }
    if (incidentsCritiques > 0) {
      alertes.push({
        type: 'error',
        message: `${incidentsCritiques} incidents critiques en cours`,
        icon: 'AlertTriangle'
      });
    }
    if (risquesEleves > 0) {
      alertes.push({
        type: 'error',
        message: `${risquesEleves} risques élevés identifiés`,
        icon: 'Shield'
      });
    }

    res.json({
      // Statistiques générales
      generales: {
        hygiene: totalHygiene,
        epi: totalEPI,
        produitsChimiques: totalProduitsChimiques,
        incidents: totalIncidents,
        risques: totalRisques,
        formations: totalFormations
      },
      
      // Statistiques détaillées par module
      hygiene: {
        total: totalHygiene,
        conformes: hygieneConformes,
        nonConformes: hygieneNonConformes,
        enCours: hygieneEnCours,
        planifies: hygienePlanifies,
        tauxConformite: tauxConformiteHygiene
      },
      
      epi: {
        total: totalEPI,
        actifs: epiActifs,
        inactifs: epiInactifs,
        enMaintenance: epiEnMaintenance,
        enAlerte: epiEnAlerte
      },
      
      produitsChimiques: {
        total: totalProduitsChimiques,
        actifs: produitsActifs,
        inactifs: produitsInactifs,
        enAlerte: produitsEnAlerte,
        perimes: produitsPerimes
      },
      
      incidents: {
        total: totalIncidents,
        critiques: incidentsCritiques,
        majeurs: incidentsMajeurs,
        mineurs: incidentsMineurs,
        enCours: incidentsEnCours,
        resolus: incidentsResolus,
        tauxResolution: tauxResolutionIncidents,
        evolution: evolutionIncidents,
        topZones: topZonesIncidents
      },
      
      risques: {
        total: totalRisques,
        eleves: risquesEleves,
        moyens: risquesMoyens,
        faibles: risquesFaibles,
        enCours: risquesEnCours,
        traites: risquesTraites,
        tauxTraitement: tauxTraitementRisques
      },
      
      formations: {
        total: totalFormations,
        planifiees: formationsPlanifiees,
        enCours: formationsEnCours,
        terminees: formationsTerminees,
        annulees: formationsAnnulees
      },
      
      // Alertes et notifications
      alertes: alertes,
      
      // Métadonnées
      periode: {
        debut: startDate,
        fin: endDate,
        type: periode
      }
    });
  } catch (error) {
    console.error('Erreur lors du chargement du tableau de bord:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/hse/stats - Obtenir les statistiques HSE (endpoint existant maintenu pour compatibilité)
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

    // Statistiques d'hygiène
    const hygieneTotal = await Hygiene.countDocuments({ isArchived: false });
    const hygieneConformes = await Hygiene.countDocuments({ 
      'evaluation.statut': 'Conforme',
      isArchived: false 
    });
    const hygieneNonConformes = await Hygiene.countDocuments({ 
      'evaluation.statut': 'Non conforme',
      isArchived: false 
    });

    // Statistiques des EPI
    const epiTotal = await EPI.countDocuments({ isArchived: false });
    const epiActifs = await EPI.countDocuments({ 
      statut: 'Actif',
      isArchived: false 
    });
    const epiEnAlerte = await EPI.find({ isArchived: false })
      .then(epi => epi.filter(e => e.estEnAlerteStock()).length);

    // Statistiques des produits chimiques
    const produitsTotal = await ProduitChimique.countDocuments({ isArchived: false });
    const produitsActifs = await ProduitChimique.countDocuments({ 
      statut: 'Actif',
      isArchived: false 
    });
    const produitsEnAlerte = await ProduitChimique.find({ isArchived: false })
      .then(produits => produits.filter(p => p.estEnAlerteStock()).length);
    const produitsPerimes = await ProduitChimique.find({ isArchived: false })
      .then(produits => produits.filter(p => p.estPerime()).length);

    // Calcul des taux
    const tauxConformiteHygiene = hygieneTotal > 0 ? 
      Math.round((hygieneConformes / hygieneTotal) * 100) : 0;

    res.json({
      hygiene: {
        total: hygieneTotal,
        conformes: hygieneConformes,
        nonConformes: hygieneNonConformes,
        tauxConformite: tauxConformiteHygiene
      },
      epi: {
        total: epiTotal,
        actifs: epiActifs,
        enAlerte: epiEnAlerte
      },
      produitsChimiques: {
        total: produitsTotal,
        actifs: produitsActifs,
        enAlerte: produitsEnAlerte,
        perimes: produitsPerimes
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES INCIDENTS ====================

// GET /api/hse/incidents - Obtenir tous les incidents
router.get('/incidents', async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type, gravite } = req.query;
    
    const filter = { isArchived: false };
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (gravite) filter.gravite = gravite;

    const incidents = await Incident.find(filter)
      .populate('declarant', 'nom prenom')
      .populate('personnesImpliquees.personne', 'nom prenom')
      .sort({ dateIncident: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Incident.countDocuments(filter);

    res.json({
      incidents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/hse/incidents/:id - Obtenir un incident par ID
router.get('/incidents/:id', async (req, res) => {
  try {
    const incident = await Incident.findOne({ _id: req.params.id, isArchived: false })
      .populate('declarant', 'nom prenom')
      .populate('personnesImpliquees.personne', 'nom prenom')
      .populate('actionsCorrectives.responsable', 'nom prenom')
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom');

    if (!incident) {
      return res.status(404).json({ message: 'Incident non trouvé' });
    }

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/hse/incidents - Créer un nouvel incident
router.post('/incidents', async (req, res) => {
  try {
    const incident = new Incident({
      ...req.body,
      createdBy: req.user.id
    });

    await incident.save();
    res.status(201).json(incident);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// PUT /api/hse/incidents/:id - Mettre à jour un incident
router.put('/incidents/:id', async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    );

    if (!incident) {
      return res.status(404).json({ message: 'Incident non trouvé' });
    }

    res.json(incident);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/hse/incidents/:id - Supprimer un incident
router.delete('/incidents/:id', async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, updatedBy: req.user.id },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ message: 'Incident non trouvé' });
    }

    res.json({ message: 'Incident supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES RISQUES ====================

// GET /api/hse/risques - Obtenir tous les risques
router.get('/risques', async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type, niveauRisque } = req.query;
    
    const filter = { isArchived: false };
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (niveauRisque) filter.niveauRisque = niveauRisque;

    const risques = await Risque.find(filter)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .populate('mesuresCorrectives.responsable', 'nom prenom')
      .sort({ scoreRisque: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Risque.countDocuments(filter);

    res.json({
      risques,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/hse/risques/:id - Obtenir un risque par ID
router.get('/risques/:id', async (req, res) => {
  try {
    const risque = await Risque.findOne({ _id: req.params.id, isArchived: false })
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .populate('mesuresCorrectives.responsable', 'nom prenom')
      .populate('personnesExposees.employe', 'nom prenom');

    if (!risque) {
      return res.status(404).json({ message: 'Risque non trouvé' });
    }

    res.json(risque);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/hse/risques - Créer un nouveau risque
router.post('/risques', async (req, res) => {
  try {
    const risque = new Risque({
      ...req.body,
      createdBy: req.user.id
    });

    await risque.save();
    res.status(201).json(risque);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// PUT /api/hse/risques/:id - Mettre à jour un risque
router.put('/risques/:id', async (req, res) => {
  try {
    const risque = await Risque.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    );

    if (!risque) {
      return res.status(404).json({ message: 'Risque non trouvé' });
    }

    res.json(risque);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/hse/risques/:id - Supprimer un risque
router.delete('/risques/:id', async (req, res) => {
  try {
    const risque = await Risque.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, updatedBy: req.user.id },
      { new: true }
    );

    if (!risque) {
      return res.status(404).json({ message: 'Risque non trouvé' });
    }

    res.json({ message: 'Risque supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES FORMATIONS ====================

// GET /api/hse/formations - Obtenir toutes les formations
router.get('/formations', async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type, categorie } = req.query;
    
    const filter = { isArchived: false };
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (categorie) filter.categorie = categorie;

    const formations = await Formation.find(filter)
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .populate('participants.employe', 'nom prenom')
      .sort({ datePlanification: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Formation.countDocuments(filter);

    res.json({
      formations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/hse/formations/:id - Obtenir une formation par ID
router.get('/formations/:id', async (req, res) => {
  try {
    const formation = await Formation.findOne({ _id: req.params.id, isArchived: false })
      .populate('createdBy', 'nom prenom')
      .populate('updatedBy', 'nom prenom')
      .populate('participants.employe', 'nom prenom');

    if (!formation) {
      return res.status(404).json({ message: 'Formation non trouvée' });
    }

    res.json(formation);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/hse/formations - Créer une nouvelle formation
router.post('/formations', async (req, res) => {
  try {
    const formation = new Formation({
      ...req.body,
      createdBy: req.user.id
    });

    await formation.save();
    res.status(201).json(formation);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// PUT /api/hse/formations/:id - Mettre à jour une formation
router.put('/formations/:id', async (req, res) => {
  try {
    const formation = await Formation.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    );

    if (!formation) {
      return res.status(404).json({ message: 'Formation non trouvée' });
    }

    res.json(formation);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/hse/formations/:id - Supprimer une formation
router.delete('/formations/:id', async (req, res) => {
  try {
    const formation = await Formation.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, updatedBy: req.user.id },
      { new: true }
    );

    if (!formation) {
      return res.status(404).json({ message: 'Formation non trouvée' });
    }

    res.json({ message: 'Formation supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES STATISTIQUES ====================

// GET /api/hse/statistiques - Obtenir les statistiques générales
router.get('/statistiques', async (req, res) => {
  try {
    const { dateDebut, dateFin } = req.query;
    
    // Filtres de date si fournis
    const dateFilter = {};
    if (dateDebut && dateFin) {
      dateFilter.createdAt = {
        $gte: new Date(dateDebut),
        $lte: new Date(dateFin)
      };
    }

    // Statistiques générales
    const [
      totalHygiene,
      totalEPI,
      totalProduitsChimiques,
      totalIncidents,
      totalRisques,
      totalFormations
    ] = await Promise.all([
      Hygiene.countDocuments({ isArchived: false, ...dateFilter }),
      EPI.countDocuments({ isArchived: false, ...dateFilter }),
      ProduitChimique.countDocuments({ isArchived: false, ...dateFilter }),
      Incident.countDocuments({ isArchived: false, ...dateFilter }),
      Risque.countDocuments({ isArchived: false, ...dateFilter }),
      Formation.countDocuments({ isArchived: false, ...dateFilter })
    ]);

    // Statistiques des incidents par gravité
    const incidentsParGravite = await Incident.aggregate([
      { $match: { isArchived: false, ...dateFilter } },
      { $group: { _id: '$gravite', count: { $sum: 1 } } }
    ]);

    // Statistiques des risques par niveau
    const risquesParNiveau = await Risque.aggregate([
      { $match: { isArchived: false, ...dateFilter } },
      { $group: { _id: '$niveauRisque', count: { $sum: 1 } } }
    ]);

    // Statistiques des formations par statut
    const formationsParStatut = await Formation.aggregate([
      { $match: { isArchived: false, ...dateFilter } },
      { $group: { _id: '$statut', count: { $sum: 1 } } }
    ]);

    // Statistiques des EPI par statut
    const epiParStatut = await EPI.aggregate([
      { $match: { isArchived: false, ...dateFilter } },
      { $group: { _id: '$statut', count: { $sum: 1 } } }
    ]);

    // Évolution mensuelle des incidents (6 derniers mois)
    const sixMoisAgo = new Date();
    sixMoisAgo.setMonth(sixMoisAgo.getMonth() - 6);
    
    const evolutionIncidents = await Incident.aggregate([
      {
        $match: {
          isArchived: false,
          dateIncident: { $gte: sixMoisAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateIncident' },
            month: { $month: '$dateIncident' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top 5 des zones avec le plus d'incidents
    const topZonesIncidents = await Incident.aggregate([
      { $match: { isArchived: false, ...dateFilter } },
      { $group: { _id: '$localisation.zone', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      generales: {
        hygiene: totalHygiene,
        epi: totalEPI,
        produitsChimiques: totalProduitsChimiques,
        incidents: totalIncidents,
        risques: totalRisques,
        formations: totalFormations
      },
      incidents: {
        parGravite: incidentsParGravite,
        evolution: evolutionIncidents,
        topZones: topZonesIncidents
      },
      risques: {
        parNiveau: risquesParNiveau
      },
      formations: {
        parStatut: formationsParStatut
      },
      epi: {
        parStatut: epiParStatut
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
