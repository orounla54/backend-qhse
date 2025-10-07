const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { applyCrudRoutes } = require('../utils/crudOperations');

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
const ProduitChimique = require('../models/ProduitChimique');
const Risque = require('../models/Risque');
const Formation = require('../models/Formation');
const Hygiene = require('../models/Hygiene');
const Incident = require('../models/Incident');
const EPI = require('../models/EPI');

// Protection des routes par authentification
router.use(auth);

// ==================== ROUTES MATIÈRES PREMIÈRES ====================
applyCrudRoutes(router, MatierePremiere, {
  basePath: '/matieres-premieres',
  populateFields: ['createdBy', 'updatedBy', 'lots.controles.responsable', 'lots.decisionQualite.decideur'],
  customRoutes: [
    {
      method: 'POST',
      path: '/matieres-premieres/:id/lots',
      handler: async (req, res) => {
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
      }
    },
    {
      method: 'POST',
      path: '/matieres-premieres/:id/lots/:numeroLot/decision',
      handler: async (req, res) => {
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
      }
    }
  ]
});

// ==================== ROUTES CONTRÔLES QUALITÉ ====================
applyCrudRoutes(router, ControleQualite, {
  basePath: '/controles-qualite',
  populateFields: ['controleur', 'equipe.membre', 'resultats.mesureur', 'actionsCorrectives.responsable', 'historique.utilisateur'],
  customRoutes: [
    {
      method: 'POST',
      path: '/controles-qualite/:id/resultats',
      handler: async (req, res) => {
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
      }
    },
    {
      method: 'POST',
      path: '/controles-qualite/:id/valider',
      handler: async (req, res) => {
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
      }
    }
  ]
});

// ==================== ROUTES NON-CONFORMITÉS ====================
applyCrudRoutes(router, NonConformite, {
  basePath: '/non-conformites',
  populateFields: ['detection.detecteur', 'actionsCorrectives.responsable', 'actionsPreventives.responsable', 'investigation.investigateur', 'fermeture.fermePar', 'historique.utilisateur'],
  customRoutes: [
    {
      method: 'POST',
      path: '/non-conformites/:id/fermer',
      handler: async (req, res) => {
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
      }
    },
    {
      method: 'POST',
      path: '/non-conformites/:id/cloturer',
      handler: async (req, res) => {
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
      }
    }
  ]
});

// ==================== ROUTES DÉCISIONS QUALITÉ ====================
applyCrudRoutes(router, DecisionQualite, {
  basePath: '/decisions-qualite',
  populateFields: ['decisionnaire', 'matierePremiere', 'controleQualite', 'nonConformite', 'validation.validateur'],
  customRoutes: [
    {
      method: 'POST',
      path: '/decisions-qualite/:id/valider',
      handler: async (req, res) => {
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
      }
    }
  ]
});

// ==================== ROUTES PLANS DE CONTRÔLE ====================
applyCrudRoutes(router, PlanControle, {
  basePath: '/plans-controle',
  populateFields: ['responsable', 'equipe.membre', 'createdBy'],
  customRoutes: [
    {
      method: 'POST',
      path: '/plans-controle/:id/approuver',
      handler: async (req, res) => {
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
      }
    }
  ]
});

// ==================== ROUTES TRACABILITÉ ====================
applyCrudRoutes(router, Tracabilite, {
  basePath: '/tracabilite',
  populateFields: ['createdBy', 'updatedBy', 'transformation.responsable', 'controles.responsable'],
  customRoutes: [
    {
      method: 'POST',
      path: '/tracabilite/:id/simuler-rappel',
      handler: async (req, res) => {
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
      }
    }
  ]
});

// ==================== ROUTES ANALYSES ====================
applyCrudRoutes(router, Analyse, {
  basePath: '/analyses',
  populateFields: ['responsable', 'createdBy']
});

// ==================== ROUTES ÉCHANTILLONS ====================
applyCrudRoutes(router, Echantillon, {
  basePath: '/echantillons',
  populateFields: ['responsable', 'createdBy']
});

// ==================== ROUTES PRODUITS CHIMIQUES ====================
applyCrudRoutes(router, ProduitChimique, {
  basePath: '/produits-chimiques',
  populateFields: ['responsable', 'createdBy']
});

// ==================== ROUTES RISQUES ====================
applyCrudRoutes(router, Risque, {
  basePath: '/risques',
  populateFields: ['responsable', 'createdBy']
});

// ==================== ROUTES FORMATIONS ====================
applyCrudRoutes(router, Formation, {
  basePath: '/formations',
  populateFields: ['formateur', 'createdBy']
});

// ==================== ROUTES HYGIÈNE ====================
applyCrudRoutes(router, Hygiene, {
  basePath: '/hygiene',
  populateFields: ['responsable', 'createdBy']
});

// ==================== ROUTES INCIDENTS ====================
applyCrudRoutes(router, Incident, {
  basePath: '/incidents',
  populateFields: ['responsable', 'createdBy']
});

// ==================== ROUTES EPI ====================
applyCrudRoutes(router, EPI, {
  basePath: '/epi',
  populateFields: ['responsable', 'createdBy']
});

// ==================== ROUTES AUDITS (Qualité) ====================
applyCrudRoutes(router, Audit, {
  basePath: '/audits',
  populateFields: ['auditeurPrincipal', 'auditeurs.auditeur'],
  additionalCreateFields: { domaine: 'Qualité' }
});

// ==================== ROUTES CONFORMITÉ ====================
applyCrudRoutes(router, Conformite, {
  basePath: '/conformite',
  populateFields: ['createdBy', 'updatedBy', 'derniereEvaluation.evaluateur'],
  additionalCreateFields: { domaine: 'Qualité' }
});

// ==================== ROUTES STATISTIQUES ====================
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

// ==================== ROUTES ACTIONS RAPIDES ====================
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

module.exports = router;
