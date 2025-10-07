const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const Audit = require('../models/Audit');
const Incident = require('../models/Incident');
const Risque = require('../models/Risque');
const Formation = require('../models/Formation');
const Conformite = require('../models/Conformite');

// Protection des routes par authentification
router.use(auth);

// ==================== ROUTES AUDITS ====================

// GET /api/qhse/audits - Obtenir tous les audits
router.get('/audits', async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type, domaine } = req.query;
    
    const filter = { isArchived: false };
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (domaine) filter.domaine = domaine;

    const audits = await Audit.find(filter)
      .populate('auditeurPrincipal', 'nom prenom')
      .populate('demandeur', 'nom prenom')
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

// GET /api/qhse/audits/:id - Obtenir un audit par ID
router.get('/audits/:id', async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id)
      .populate('auditeurPrincipal', 'nom prenom')
      .populate('auditeurs.auditeur', 'nom prenom')
      .populate('demandeur', 'nom prenom')
      .populate('constatations.responsable', 'nom prenom')
      .populate('actionsCorrectives.responsable', 'nom prenom');

    if (!audit) {
      return res.status(404).json({ message: 'Audit non trouvé' });
    }

    res.json(audit);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qhse/audits - Créer un nouvel audit
router.post('/audits', async (req, res) => {
  try {
    // Générer un numéro d'audit automatique
    const count = await Audit.countDocuments({});
    const numero = `AUD-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    
    // Préparer les données avec les champs requis par défaut
    const auditData = {
      ...req.body,
      numero,
      createdBy: req.user.id,
      demandeur: req.user.id,
      // Ajouter des valeurs par défaut pour les champs requis si manquants
      statut: req.body.statut || 'Planifié',
      priorite: req.body.priorite || 'Normale'
    };

    const audit = new Audit(auditData);

    await audit.save();
    
    const populatedAudit = await Audit.findById(audit._id)
      .populate('auditeurPrincipal', 'nom prenom')
      .populate('auditeurs.auditeur', 'nom prenom');
    
    res.status(201).json(populatedAudit);
  } catch (error) {
    console.error('Erreur création audit:', error);
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

// PUT /api/qhse/audits/:id - Mettre à jour un audit
router.put('/audits/:id', async (req, res) => {
  try {
    const audit = await Audit.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!audit) {
      return res.status(404).json({ message: 'Audit non trouvé' });
    }

    res.json(audit);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// DELETE /api/qhse/audits/:id - Supprimer un audit
router.delete('/audits/:id', async (req, res) => {
  try {
    const audit = await Audit.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, updatedBy: req.user.id },
      { new: true }
    );

    if (!audit) {
      return res.status(404).json({ message: 'Audit non trouvé' });
    }

    res.json({ message: 'Audit supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES INCIDENTS ====================

// GET /api/qhse/incidents - Obtenir tous les incidents
router.get('/incidents', async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type, gravite } = req.query;
    
    // Filtre pour récupérer seulement les incidents non-archivés
    const filter = { $or: [{ isArchived: false }, { isArchived: { $exists: false } }] };
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

// GET /api/qhse/incidents/:id - Obtenir un incident par ID
router.get('/incidents/:id', async (req, res) => {
  try {
    const incident = await Incident.findOne({ _id: req.params.id, isArchived: false })
      .populate('declarant', 'nom prenom')
      .populate('personnesImpliquees.personne', 'nom prenom')
      .populate('actionsCorrectives.responsable', 'nom prenom')
      .populate('actionsPreventives.responsable', 'nom prenom')
      .populate('investigation.investigateur', 'nom prenom');

    if (!incident) {
      return res.status(404).json({ message: 'Incident non trouvé' });
    }

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qhse/incidents - Créer un nouvel incident
router.post('/incidents', async (req, res) => {
  try {
    // Générer un numéro d'incident automatique
    const count = await Incident.countDocuments({});
    const numero = `INC-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    
    // Préparer les données avec les champs requis par défaut
    const incidentData = {
      numero,
      titre: req.body.titre,
      description: req.body.description,
      type: req.body.type,
      categorie: req.body.categorie || 'Sécurité',
      gravite: req.body.gravite,
      urgence: req.body.urgence || 'Modérée',
      dateIncident: new Date(req.body.dateIncident),
      localisation: req.body.localisation || {},
      impacts: {
        humains: {
          blesses: req.body.impacts?.humains?.blesses || 0,
          deces: req.body.impacts?.humains?.deces || 0
        },
        materiels: {
          degats: req.body.impacts?.materiels?.degats || 'Aucun',
          coutEstime: req.body.impacts?.materiels?.coutEstime || 0
        },
        environnementaux: {
          pollution: req.body.impacts?.environnementaux?.pollution || 'Aucune',
          impact: req.body.impacts?.environnementaux?.impact || ''
        }
      },
      personnesImpliquees: req.body.personnesImpliquees || [],
      actionsCorrectives: req.body.actionsCorrectives || [],
      declarant: req.user.id,
      createdBy: req.user.id,
      statut: req.body.statut || 'Déclaré'
    };

    const incident = new Incident(incidentData);
    await incident.save();
    
    const populatedIncident = await Incident.findById(incident._id)
      .populate('declarant', 'nom prenom')
      .populate('actionsCorrectives.responsable', 'nom prenom');
    
    res.status(201).json(populatedIncident);
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

// PUT /api/qhse/incidents/:id - Mettre à jour un incident
router.put('/incidents/:id', async (req, res) => {
  try {
    // Filtrer les champs valides selon le modèle Incident
    const validFields = {
      titre: req.body.titre,
      description: req.body.description,
      type: req.body.type,
      categorie: req.body.categorie,
      gravite: req.body.gravite,
      urgence: req.body.urgence,
      dateIncident: req.body.dateIncident,
      localisation: req.body.localisation,
      impacts: req.body.impacts,
      personnesImpliquees: req.body.personnesImpliquees,
      actionsCorrectives: req.body.actionsCorrectives,
      statut: req.body.statut,
      updatedBy: req.user.id
    };
    
    // Supprimer les champs undefined
    Object.keys(validFields).forEach(key => {
      if (validFields[key] === undefined) {
        delete validFields[key];
      }
    });

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      validFields,
      { new: true, runValidators: true }
    );

    if (!incident) {
      return res.status(404).json({ message: 'Incident non trouvé' });
    }

    res.json(incident);
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

// DELETE /api/qhse/incidents/:id - Supprimer un incident
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

// GET /api/qhse/audits/statut/:statut - Obtenir audits par statut
router.get('/audits/statut/:statut', async (req, res) => {
  try {
    const audits = await Audit.find({ 
      statut: req.params.statut, 
      isArchived: false 
    })
    .populate('auditeurPrincipal', 'nom prenom')
    .populate('auditeurs.auditeur', 'nom prenom')
    .sort({ datePlanification: -1 });

    res.json(audits);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/audits/type/:type - Obtenir audits par type
router.get('/audits/type/:type', async (req, res) => {
  try {
    const audits = await Audit.find({ 
      type: req.params.type, 
      isArchived: false 
    })
    .populate('auditeurPrincipal', 'nom prenom')
    .populate('auditeurs.auditeur', 'nom prenom')
    .sort({ datePlanification: -1 });

    res.json(audits);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/incidents/gravite/:gravite - Obtenir incidents par gravité
router.get('/incidents/gravite/:gravite', async (req, res) => {
  try {
    const incidents = await Incident.find({ 
      gravite: req.params.gravite, 
      isArchived: false 
    })
    .populate('declarant', 'nom prenom')
    .populate('actionsCorrectives.responsable', 'nom prenom')
    .sort({ dateIncident: -1 });

    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/incidents/type/:type - Obtenir incidents par type
router.get('/incidents/type/:type', async (req, res) => {
  try {
    const incidents = await Incident.find({ 
      type: req.params.type, 
      isArchived: false 
    })
    .populate('declarant', 'nom prenom')
    .populate('actionsCorrectives.responsable', 'nom prenom')
    .sort({ dateIncident: -1 });

    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES STATISTIQUES ====================

// GET /api/qhse/stats - Obtenir les statistiques QHSE
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

    // Statistiques des audits avec structure du frontend
    const auditsTotal = await Audit.countDocuments({ isArchived: false });
    const auditsEnCours = await Audit.countDocuments({ statut: 'En cours', isArchived: false });
    const auditsPlanifies = await Audit.countDocuments({ statut: 'Planifié', isArchived: false });
    const auditsTermines = await Audit.countDocuments({ statut: 'Terminé', isArchived: false });

    // Statistiques des incidents avec structure du frontend
    const incidentsTotal = await Incident.countDocuments({ isArchived: false });
    const incidentsCritiques = await Incident.countDocuments({ gravite: 'Critique', isArchived: false });
    const incidentsEnCours = await Incident.countDocuments({ 
      statut: { $in: ['En cours d\'investigation', 'En cours de traitement'] }, 
      isArchived: false 
    });
    const incidentsResolus = await Incident.countDocuments({ 
      statut: { $in: ['Résolu', 'Fermé'] }, 
      isArchived: false 
    });

    // Score de sécurité calculé (exemple basé sur le ratio incidents critiques/total)
    const scoreSecurite = incidentsTotal > 0 ? 
      Math.max(0, 100 - (incidentsCritiques / incidentsTotal) * 100) : 100;

    // Actions en retard (exemple)
    const actionsEnRetard = await Incident.aggregate([
      { $unwind: '$actionsCorrectives' },
      { 
        $match: { 
          'actionsCorrectives.dateLimite': { $lt: new Date() },
          'actionsCorrectives.statut': { $ne: 'Terminée' },
          isArchived: false
        } 
      },
      { $count: 'total' }
    ]);

    res.json({
      audits: {
        total: auditsTotal,
        planifies: auditsPlanifies,
        enCours: auditsEnCours,
        termines: auditsTermines
      },
      incidents: {
        total: incidentsTotal,
        critiques: incidentsCritiques,
        enCours: incidentsEnCours,
        resolus: incidentsResolus
      },
      securite: {
        score: Math.round(scoreSecurite),
        evolution: 5.2 // À calculer avec les données historiques
      },
      actions: {
        enRetard: actionsEnRetard[0]?.total || 0,
        aTraiter: 12 // À calculer
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES ACTIONS CORRECTIVES ====================

// GET /api/qhse/actions-correctives - Obtenir toutes les actions correctives
router.get('/actions-correctives', async (req, res) => {
  try {
    const { statut, responsable } = req.query;
    
    const filter = {};
    if (statut) filter['actionsCorrectives.statut'] = statut;
    if (responsable) filter['actionsCorrectives.responsable'] = responsable;

    const incidents = await Incident.find(filter)
      .populate('actionsCorrectives.responsable', 'nom prenom')
      .select('numero titre actionsCorrectives');

    const actionsCorrectives = incidents.flatMap(incident => 
      incident.actionsCorrectives.map(action => ({
        ...action.toObject(),
        incidentNumero: incident.numero,
        incidentTitre: incident.titre
      }))
    );

    res.json(actionsCorrectives);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/qhse/actions-correctives/:incidentId/:actionId - Mettre à jour une action corrective
router.put('/actions-correctives/:incidentId/:actionId', async (req, res) => {
  try {
    const { incidentId, actionId } = req.params;
    
    const incident = await Incident.findById(incidentId);
    if (!incident) {
      return res.status(404).json({ message: 'Incident non trouvé' });
    }

    const action = incident.actionsCorrectives.id(actionId);
    if (!action) {
      return res.status(404).json({ message: 'Action corrective non trouvée' });
    }

    Object.assign(action, req.body);
    await incident.save();

    res.json(action);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides', error: error.message });
  }
});

// GET /api/qhse/actions-correctives/statut/:statut - Obtenir actions par statut
router.get('/actions-correctives/statut/:statut', async (req, res) => {
  try {
    const filter = { 'actionsCorrectives.statut': req.params.statut };

    const incidents = await Incident.find(filter)
      .populate('actionsCorrectives.responsable', 'nom prenom')
      .select('numero titre actionsCorrectives');

    const actionsCorrectives = incidents.flatMap(incident => 
      incident.actionsCorrectives
        .filter(action => action.statut === req.params.statut)
        .map(action => ({
          ...action.toObject(),
          incidentNumero: incident.numero,
          incidentTitre: incident.titre
        }))
    );

    res.json(actionsCorrectives);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/actions-correctives/retard - Obtenir actions en retard
router.get('/actions-correctives/retard', async (req, res) => {
  try {
    const incidents = await Incident.find({
      'actionsCorrectives.dateLimite': { $lt: new Date() },
      'actionsCorrectives.statut': { $ne: 'Terminée' },
      isArchived: false
    })
    .populate('actionsCorrectives.responsable', 'nom prenom')
    .select('numero titre actionsCorrectives');

    const actionsEnRetard = incidents.flatMap(incident => 
      incident.actionsCorrectives
        .filter(action => 
          action.dateLimite && 
          action.dateLimite < new Date() && 
          action.statut !== 'Terminée'
        )
        .map(action => ({
          ...action.toObject(),
          incidentNumero: incident.numero,
          incidentTitre: incident.titre,
          joursRetard: Math.ceil((new Date() - action.dateLimite) / (1000 * 60 * 60 * 24))
        }))
    );

    res.json(actionsEnRetard);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/qhse/actions-correctives/:id - Mettre à jour une action corrective
router.put('/actions-correctives/:id', async (req, res) => {
  try {
    // Pour le moment, retourner une réponse simple
    res.json({
      message: 'Action corrective mise à jour',
      id: req.params.id,
      data: req.body
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES RISQUES ====================

// GET /api/qhse/risques - Obtenir tous les risques
router.get('/risques', async (req, res) => {
  try {
    const { page = 1, limit = 10, niveau, categorie, statut } = req.query;
    
    const filter = { isArchived: false };
    if (niveau) filter.niveauRisque = niveau;
    if (categorie) filter.categorie = categorie;
    if (statut) filter.statut = statut;

    const risques = await Risque.find(filter)
      .populate('createdBy', 'nom prenom')
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

// GET /api/qhse/risques/niveau/:niveau - Obtenir risques par niveau
router.get('/risques/niveau/:niveau', async (req, res) => {
  try {
    const risques = await Risque.find({ 
      niveauRisque: req.params.niveau, 
      isArchived: false 
    })
    .populate('createdBy', 'nom prenom')
    .sort({ scoreRisque: -1 });

    res.json(risques);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/risques/categorie/:categorie - Obtenir risques par catégorie
router.get('/risques/categorie/:categorie', async (req, res) => {
  try {
    const risques = await Risque.find({ 
      categorie: req.params.categorie, 
      isArchived: false 
    })
    .populate('createdBy', 'nom prenom')
    .sort({ scoreRisque: -1 });

    res.json(risques);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/risques/matrice - Obtenir la matrice des risques
router.get('/risques/matrice', async (req, res) => {
  try {
    const risques = await Risque.find({ isArchived: false })
      .select('numero titre probabilite impact niveauRisque scoreRisque')
      .sort({ scoreRisque: -1 });

    // Organiser en matrice
    const matrice = {
      critique: risques.filter(r => r.niveauRisque === 'Critique'),
      eleve: risques.filter(r => r.niveauRisque === 'Élevé'),
      moyen: risques.filter(r => r.niveauRisque === 'Moyen'),
      faible: risques.filter(r => r.niveauRisque === 'Faible')
    };

    res.json(matrice);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qhse/risques - Créer un nouveau risque
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

// PUT /api/qhse/risques/:id - Mettre à jour un risque
router.put('/risques/:id', async (req, res) => {
  try {
    const risque = await Risque.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
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

// ==================== ROUTES FORMATIONS ====================

// GET /api/qhse/formations - Obtenir toutes les formations
router.get('/formations', async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type, categorie, employeId } = req.query;
    
    const filter = { isArchived: false };
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (categorie) filter.categorie = categorie;
    if (employeId) filter['participants.employe'] = employeId;

    const formations = await Formation.find(filter)
      .populate('createdBy', 'nom prenom')
      .populate('participants.employe', 'nom prenom matricule')
      .sort({ datePlanification: 1 })
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

// GET /api/qhse/formations/type/:type - Obtenir formations par type
router.get('/formations/type/:type', async (req, res) => {
  try {
    const formations = await Formation.find({ 
      type: req.params.type, 
      isArchived: false 
    })
    .populate('createdBy', 'nom prenom')
    .populate('participants.employe', 'nom prenom')
    .sort({ datePlanification: 1 });

    res.json(formations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/formations/categorie/:categorie - Obtenir formations par catégorie
router.get('/formations/categorie/:categorie', async (req, res) => {
  try {
    const formations = await Formation.find({ 
      categorie: req.params.categorie, 
      isArchived: false 
    })
    .populate('createdBy', 'nom prenom')
    .populate('participants.employe', 'nom prenom')
    .sort({ datePlanification: 1 });

    res.json(formations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qhse/formations - Créer une nouvelle formation
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

// PUT /api/qhse/formations/:id - Mettre à jour une formation
router.put('/formations/:id', async (req, res) => {
  try {
    const formation = await Formation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
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

// GET /api/qhse/formations/expirantes - Obtenir les formations expirantes
router.get('/formations/expirantes', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const formations = await Formation.getFormationsExpirantes(parseInt(days));
    res.json(formations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES CONFORMITE ====================

// GET /api/qhse/conformites - Obtenir toutes les conformités
router.get('/conformites', async (req, res) => {
  try {
    const { page = 1, limit = 10, statutConformite, type, domaine } = req.query;
    
    const filter = { isArchived: false };
    if (statutConformite) filter.statutConformite = statutConformite;
    if (type) filter.type = type;
    if (domaine) filter.domaine = domaine;

    const conformites = await Conformite.find(filter)
      .populate('createdBy', 'nom prenom')
      .populate('actionsConformite.responsable', 'nom prenom')
      .sort({ prochaineEvaluation: 1 })
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

// GET /api/qhse/conformites/type/:type - Obtenir conformités par type
router.get('/conformites/type/:type', async (req, res) => {
  try {
    const conformites = await Conformite.find({ 
      type: req.params.type, 
      isArchived: false 
    })
    .populate('createdBy', 'nom prenom')
    .sort({ prochaineEvaluation: 1 });

    res.json(conformites);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/conformites/domaine/:domaine - Obtenir conformités par domaine
router.get('/conformites/domaine/:domaine', async (req, res) => {
  try {
    const conformites = await Conformite.find({ 
      domaine: req.params.domaine, 
      isArchived: false 
    })
    .populate('createdBy', 'nom prenom')
    .sort({ prochaineEvaluation: 1 });

    res.json(conformites);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qhse/conformites - Créer une nouvelle conformité
router.post('/conformites', async (req, res) => {
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

// PUT /api/qhse/conformites/:id - Mettre à jour une conformité
router.put('/conformites/:id', async (req, res) => {
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

// GET /api/qhse/conformites/expirantes - Obtenir les conformités expirantes
router.get('/conformites/expirantes', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const conformites = await Conformite.getConformitesExpirantes(parseInt(days));
    res.json(conformites);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/conformites/non-conformes - Obtenir les non-conformités
router.get('/conformites/non-conformes', async (req, res) => {
  try {
    const conformites = await Conformite.getNonConformites();
    res.json(conformites);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/stats/etendues - Statistiques complètes QHSE
router.get('/stats/etendues', async (req, res) => {
  try {
    const { periode = 'mois' } = req.query;
    
    // Calcul de la date de début selon la période
    const dateDebut = new Date();
    switch (periode) {
      case 'semaine':
        dateDebut.setDate(dateDebut.getDate() - 7);
        break;
      case 'mois':
        dateDebut.setMonth(dateDebut.getMonth() - 1);
        break;
      case 'trimestre':
        dateDebut.setMonth(dateDebut.getMonth() - 3);
        break;
      case 'annee':
        dateDebut.setFullYear(dateDebut.getFullYear() - 1);
        break;
    }

    // Statistiques des risques
    const risquesStats = await Risque.aggregate([
      {
        $match: {
          dateEvaluation: { $gte: dateDebut },
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$niveauRisque',
          count: { $sum: 1 },
          avgScore: { $avg: '$scoreRisque' }
        }
      }
    ]);

    // Statistiques des formations
    const formationsStats = await Formation.aggregate([
      {
        $match: {
          datePlanification: { $gte: dateDebut },
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 },
          totalParticipants: { $sum: { $size: '$participants' } }
        }
      }
    ]);

    // Statistiques de conformité
    const conformitesStats = await Conformite.aggregate([
      {
        $match: {
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$statutConformite',
          count: { $sum: 1 },
          avgScore: { $avg: '$scoreConformite' }
        }
      }
    ]);

    res.json({
      risques: risquesStats,
      formations: formationsStats,
      conformites: conformitesStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/stats/periode - Statistiques par période
router.get('/stats/periode', async (req, res) => {
  try {
    const { debut, fin } = req.query;
    
    if (!debut || !fin) {
      return res.status(400).json({ 
        message: 'Les paramètres debut et fin sont requis' 
      });
    }

    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);

    // Statistiques pour la période donnée
    const stats = {
      audits: await Audit.countDocuments({
        datePlanification: { $gte: dateDebut, $lte: dateFin },
        isArchived: false
      }),
      incidents: await Incident.countDocuments({
        dateIncident: { $gte: dateDebut, $lte: dateFin },
        isArchived: false
      }),
      formations: await Formation.countDocuments({
        datePlanification: { $gte: dateDebut, $lte: dateFin },
        isArchived: false
      })
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES EXPORTS ====================

// GET /api/qhse/exports/audits - Exporter les audits
router.get('/exports/audits', async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;
    
    // Pour le moment, retourner une réponse simple
    // TODO: Implémenter la génération réelle de fichiers
    res.json({
      message: `Export des audits en format ${format} en cours de développement`,
      format,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/exports/incidents - Exporter les incidents
router.get('/exports/incidents', async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;
    
    res.json({
      message: `Export des incidents en format ${format} en cours de développement`,
      format,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/exports/risques - Exporter les risques
router.get('/exports/risques', async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;
    
    res.json({
      message: `Export des risques en format ${format} en cours de développement`,
      format,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/exports/formations - Exporter les formations
router.get('/exports/formations', async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;
    
    res.json({
      message: `Export des formations en format ${format} en cours de développement`,
      format,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/exports/conformites - Exporter les conformités
router.get('/exports/conformites', async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;
    
    res.json({
      message: `Export des conformités en format ${format} en cours de développement`,
      format,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/exports/rapport-complet - Exporter le rapport complet
router.get('/exports/rapport-complet', async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;
    
    res.json({
      message: `Export du rapport complet en format ${format} en cours de développement`,
      format,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES NOTIFICATIONS ====================

// GET /api/qhse/notifications - Obtenir les notifications
router.get('/notifications', async (req, res) => {
  try {
    // Notifications d'exemple
    const notifications = [
      {
        id: '1',
        type: 'audit',
        message: 'Audit AUD-2024-001 planifié pour demain',
        read: false,
        createdAt: new Date(),
        priority: 'medium'
      },
      {
        id: '2',
        type: 'incident',
        message: 'Nouveau incident critique déclaré',
        read: false,
        createdAt: new Date(),
        priority: 'high'
      }
    ];

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/qhse/notifications/:id/lue - Marquer une notification comme lue
router.put('/notifications/:id/lue', async (req, res) => {
  try {
    res.json({
      message: 'Notification marquée comme lue',
      id: req.params.id
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/qhse/notifications/toutes-lues - Marquer toutes les notifications comme lues
router.put('/notifications/toutes-lues', async (req, res) => {
  try {
    res.json({
      message: 'Toutes les notifications ont été marquées comme lues'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qhse/notifications/config - Configurer les alertes
router.post('/notifications/config', async (req, res) => {
  try {
    res.json({
      message: 'Configuration des alertes mise à jour',
      config: req.body
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES CONFIGURATION ====================

// GET /api/qhse/config - Obtenir la configuration complète
router.get('/config', async (req, res) => {
  try {
    const config = {
      notifications: {
        email: true,
        sms: false,
        push: true,
        rappels: true,
        destinataires: ['admin@entreprise.ci', 'qhse@entreprise.ci']
      },
      securite: {
        motDePasseMin: 8,
        expirationSession: 24,
        tentativesConnexion: 3,
        authentificationDouble: false,
        ipWhitelist: [],
        sessionTimeout: 30
      },
      systeme: {
        langue: 'fr',
        fuseauHoraire: 'Africa/Abidjan',
        formatDate: 'DD/MM/YYYY',
        formatHeure: 'HH:mm',
        sauvegardeAuto: true,
        version: '1.0.0',
        maintenance: false
      },
      qhse: {
        seuilsAlertes: {
          incidents: 5,
          risques: 3,
          audits: 2,
          formations: 7
        },
        rapports: {
          format: 'PDF',
          signature: true,
          logo: true,
          entete: 'Entreprise QHSE - Côte d\'Ivoire',
          piedPage: 'Rapport généré automatiquement'
        },
        conformite: {
          normeISO14001: true,
          normeOHSAS18001: true,
          normeISO45001: true,
          reglementationLocale: true
        }
      },
      localisation: {
        pays: 'Côte d\'Ivoire',
        region: 'Abidjan',
        devise: 'XOF',
        telephone: '+225',
        adresse: 'Abidjan, Côte d\'Ivoire'
      },
      exports: {
        defaultFormat: 'pdf',
        autoGenerate: false,
        formatsDisponibles: ['PDF', 'Excel', 'Word'],
        compression: true
      }
    };

    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/qhse/config - Mettre à jour la configuration
router.put('/config', async (req, res) => {
  try {
    const { section, data } = req.body;
    
    // Validation des données selon la section
    if (section === 'securite') {
      if (data.motDePasseMin < 6) {
        return res.status(400).json({ 
          message: 'Le mot de passe doit contenir au moins 6 caractères' 
        });
      }
      if (data.expirationSession < 1 || data.expirationSession > 168) {
        return res.status(400).json({ 
          message: 'L\'expiration de session doit être entre 1 et 168 heures' 
        });
      }
    }

    // Ici, vous pourriez sauvegarder en base de données
    // Pour l'instant, on simule la sauvegarde
    console.log(`Configuration ${section} mise à jour:`, data);
    
    res.json({
      message: `Configuration ${section} mise à jour avec succès`,
      section,
      data
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/config/parametres - Obtenir les paramètres spécifiques
router.get('/config/parametres', async (req, res) => {
  try {
    const parametres = {
      entreprise: {
        nom: 'QHSE Solutions Côte d\'Ivoire',
        secteur: 'Industrie',
        adresse: 'Abidjan, Côte d\'Ivoire',
        telephone: '+225 XX XX XX XX',
        email: 'contact@qhse.ci',
        siteWeb: 'www.qhse.ci',
        siret: 'CI-XXXX-XXXX-XXXX',
        capital: '10000000 XOF'
      },
      reglementations: {
        normes: [
          'ISO 14001:2015 - Management environnemental',
          'ISO 45001:2018 - Santé et sécurité au travail',
          'OHSAS 18001:2007 - Système de management SST',
          'Réglementation locale Côte d\'Ivoire'
        ],
        organismes: [
          'Ministère de l\'Environnement et du Développement Durable',
          'Ministère de l\'Emploi et de la Protection Sociale',
          'Agence Nationale de l\'Environnement (ANDE)',
          'Caisse Nationale de Prévoyance Sociale (CNPS)'
        ]
      },
      alertes: {
        seuils: {
          incidents: 5,
          risques: 3,
          audits: 2,
          formations: 7,
          conformite: 1
        },
        frequence: 'quotidienne',
        canaux: ['email', 'sms', 'push']
      }
    };

    res.json(parametres);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qhse/config/backup - Créer une sauvegarde de la configuration
router.post('/config/backup', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      timestamp,
      version: '1.0.0',
      config: req.body,
      createdBy: req.user?.id || 'system'
    };

    // Ici, vous pourriez sauvegarder dans un fichier ou en base
    console.log('Sauvegarde de configuration créée:', backupData);
    
    res.json({
      message: 'Sauvegarde créée avec succès',
      backupId: `backup_${timestamp}`,
      timestamp
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/config/export - Exporter la configuration
router.get('/config/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const configData = {
      notifications: {
        email: true,
        sms: false,
        push: true,
        rappels: true
      },
      securite: {
        motDePasseMin: 8,
        expirationSession: 24,
        tentativesConnexion: 3,
        authentificationDouble: false
      },
      systeme: {
        langue: 'fr',
        fuseauHoraire: 'Africa/Abidjan',
        formatDate: 'DD/MM/YYYY',
        sauvegardeAuto: true
      },
      qhse: {
        seuilsAlertes: {
          incidents: 5,
          risques: 3,
          audits: 2
        },
        rapports: {
          format: 'PDF',
          signature: true,
          logo: true
        }
      }
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=config-qhse.json');
      res.json(configData);
    } else {
      res.status(400).json({ message: 'Format non supporté' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/qhse/config/import - Importer une configuration
router.post('/config/import', async (req, res) => {
  try {
    const { configData } = req.body;
    
    // Validation de la structure de configuration
    const requiredSections = ['notifications', 'securite', 'systeme', 'qhse'];
    const isValid = requiredSections.every(section => configData[section]);
    
    if (!isValid) {
      return res.status(400).json({ 
        message: 'Structure de configuration invalide' 
      });
    }

    // Ici, vous pourriez appliquer la configuration importée
    console.log('Configuration importée:', configData);
    
    res.json({
      message: 'Configuration importée avec succès',
      sections: Object.keys(configData)
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/qhse/config/reglementations - Obtenir les réglementations locales
router.get('/config/reglementations', async (req, res) => {
  try {
    const reglementations = {
      coteIvoire: {
        environnement: [
          {
            nom: 'Code de l\'Environnement',
            version: '2021',
            description: 'Réglementation environnementale de la Côte d\'Ivoire',
            obligations: [
              'Étude d\'impact environnemental',
              'Plan de gestion environnementale',
              'Surveillance continue'
            ]
          }
        ],
        securite: [
          {
            nom: 'Code du Travail',
            version: '2015',
            description: 'Réglementation de la sécurité au travail',
            obligations: [
              'Formation sécurité obligatoire',
              'Équipements de protection individuelle',
              'Comité de sécurité'
            ]
          }
        ],
        sante: [
          {
            nom: 'Réglementation CNPS',
            version: '2020',
            description: 'Protection sociale et santé au travail',
            obligations: [
              'Visite médicale annuelle',
              'Déclaration d\'accident',
              'Prévention des risques'
            ]
          }
        ]
      },
      internationales: [
        {
          nom: 'ISO 14001:2015',
          description: 'Système de management environnemental',
          applicable: true
        },
        {
          nom: 'ISO 45001:2018',
          description: 'Système de management SST',
          applicable: true
        }
      ]
    };

    res.json(reglementations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router; 