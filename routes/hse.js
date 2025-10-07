const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { applyCrudRoutes } = require('../utils/crudOperations');

// Import des modèles
const Hygiene = require('../models/Hygiene');
const EPI = require('../models/EPI');
const ProduitChimique = require('../models/ProduitChimique');
const Incident = require('../models/Incident');
const Risque = require('../models/Risque');
const Formation = require('../models/Formation');

// Protection des routes par authentification
router.use(auth);

// ==================== ROUTES HYGIÈNE ====================
applyCrudRoutes(router, Hygiene, {
  basePath: '/hygiene',
  populateFields: ['responsable', 'createdBy'],
  customRoutes: [
    {
      method: 'POST',
      path: '/hygiene/:id/resultats',
      handler: async (req, res) => {
        try {
          const hygiene = await Hygiene.findById(req.params.id);
          if (!hygiene) {
            return res.status(404).json({ message: 'Enregistrement d\'hygiène non trouvé' });
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
      }
    }
  ]
});

// ==================== ROUTES EPI ====================
applyCrudRoutes(router, EPI, {
  basePath: '/epi',
  populateFields: ['responsable', 'createdBy'],
  customRoutes: [
    {
      method: 'POST',
      path: '/epi/:id/dotation',
      handler: async (req, res) => {
        try {
          const epi = await EPI.findById(req.params.id);
          if (!epi) {
            return res.status(404).json({ message: 'EPI non trouvé' });
          }
          epi.doter(
            req.body.utilisateur,
            req.body.quantite,
            req.body.dateDotation,
            req.user.id
          );
          await epi.save();
          res.json(epi);
        } catch (error) {
          res.status(400).json({ message: 'Données invalides', error: error.message });
        }
      }
    },
    {
      method: 'POST',
      path: '/epi/:id/retour',
      handler: async (req, res) => {
        try {
          const epi = await EPI.findById(req.params.id);
          if (!epi) {
            return res.status(404).json({ message: 'EPI non trouvé' });
          }
          epi.retourner(
            req.body.utilisateur,
            req.body.quantite,
            req.body.etat,
            req.user.id
          );
          await epi.save();
          res.json(epi);
        } catch (error) {
          res.status(400).json({ message: 'Données invalides', error: error.message });
        }
      }
    },
    {
      method: 'GET',
      path: '/epi/alertes-stock',
      handler: async (req, res) => {
        try {
          const epiAvecStockFaible = await EPI.find({
            isArchived: false,
            'stock.quantite': { $lte: '$stock.seuilAlerte' }
          }).populate('responsable', 'nom prenom');
          
          res.json(epiAvecStockFaible);
        } catch (error) {
          res.status(500).json({ message: 'Erreur serveur', error: error.message });
        }
      }
    }
  ]
});

// ==================== ROUTES PRODUITS CHIMIQUES ====================
applyCrudRoutes(router, ProduitChimique, {
  basePath: '/produits-chimiques',
  populateFields: ['responsable', 'createdBy'],
  customRoutes: [
    {
      method: 'POST',
      path: '/produits-chimiques/:id/utilisation',
      handler: async (req, res) => {
        try {
          const produit = await ProduitChimique.findById(req.params.id);
          if (!produit) {
            return res.status(404).json({ message: 'Produit chimique non trouvé' });
          }
          produit.enregistrerUtilisation(
            req.body.quantite,
            req.body.utilisateur,
            req.body.raison,
            req.user.id
          );
          await produit.save();
          res.json(produit);
        } catch (error) {
          res.status(400).json({ message: 'Données invalides', error: error.message });
        }
      }
    },
    {
      method: 'GET',
      path: '/produits-chimiques/alertes-stock',
      handler: async (req, res) => {
        try {
          const produitsAvecStockFaible = await ProduitChimique.find({
            isArchived: false,
            'stock.quantite': { $lte: '$stock.seuilAlerte' }
          }).populate('responsable', 'nom prenom');
          
          res.json(produitsAvecStockFaible);
        } catch (error) {
          res.status(500).json({ message: 'Erreur serveur', error: error.message });
        }
      }
    },
    {
      method: 'GET',
      path: '/produits-chimiques/perimes',
      handler: async (req, res) => {
        try {
          const produitsPerimes = await ProduitChimique.find({
            isArchived: false,
            'stock.dateExpiration': { $lte: new Date() }
          }).populate('responsable', 'nom prenom');
          
          res.json(produitsPerimes);
        } catch (error) {
          res.status(500).json({ message: 'Erreur serveur', error: error.message });
        }
      }
    }
  ]
});

// ==================== ROUTES INCIDENTS ====================
applyCrudRoutes(router, Incident, {
  basePath: '/incidents',
  populateFields: ['responsable', 'createdBy', 'actionsCorrectives.responsable', 'investigation.investigateur'],
  customRoutes: [
    {
      method: 'POST',
      path: '/incidents/:id/fermer',
      handler: async (req, res) => {
        try {
          const incident = await Incident.findById(req.params.id);
          if (!incident) {
            return res.status(404).json({ message: 'Incident non trouvé' });
          }
          incident.fermer(
            req.user.id,
            req.body.commentaire || '',
            req.body.efficaciteGlobale || 'Efficace'
          );
          await incident.save();
          res.json(incident);
        } catch (error) {
          res.status(400).json({ message: 'Données invalides', error: error.message });
        }
      }
    },
    {
      method: 'POST',
      path: '/incidents/:id/cloturer',
      handler: async (req, res) => {
        try {
          const incident = await Incident.findById(req.params.id);
          if (!incident) {
            return res.status(404).json({ message: 'Incident non trouvé' });
          }
          incident.cloturer(req.user.id, req.body.commentaire || '');
          await incident.save();
          res.json(incident);
        } catch (error) {
          res.status(400).json({ message: 'Données invalides', error: error.message });
        }
      }
    }
  ]
});

// ==================== ROUTES RISQUES ====================
applyCrudRoutes(router, Risque, {
  basePath: '/risques',
  populateFields: ['responsable', 'createdBy', 'evaluation.evaluateur', 'actionsPreventives.responsable'],
  customRoutes: [
    {
      method: 'POST',
      path: '/risques/:id/evaluer',
      handler: async (req, res) => {
        try {
          const risque = await Risque.findById(req.params.id);
          if (!risque) {
            return res.status(404).json({ message: 'Risque non trouvé' });
          }
          risque.evaluer(
            req.body.probabilite,
            req.body.gravite,
            req.body.impact,
            req.user.id,
            req.body.commentaire
          );
          await risque.save();
          res.json(risque);
        } catch (error) {
          res.status(400).json({ message: 'Données invalides', error: error.message });
        }
      }
    },
    {
      method: 'POST',
      path: '/risques/:id/mitiger',
      handler: async (req, res) => {
        try {
          const risque = await Risque.findById(req.params.id);
          if (!risque) {
            return res.status(404).json({ message: 'Risque non trouvé' });
          }
          risque.mitiger(
            req.body.mesures,
            req.body.responsable,
            req.body.echeance,
            req.user.id
          );
          await risque.save();
          res.json(risque);
        } catch (error) {
          res.status(400).json({ message: 'Données invalides', error: error.message });
        }
      }
    }
  ]
});

// ==================== ROUTES FORMATIONS ====================
applyCrudRoutes(router, Formation, {
  basePath: '/formations',
  populateFields: ['formateur', 'createdBy', 'participants.participant'],
  customRoutes: [
    {
      method: 'POST',
      path: '/formations/:id/inscrire',
      handler: async (req, res) => {
        try {
          const formation = await Formation.findById(req.params.id);
          if (!formation) {
            return res.status(404).json({ message: 'Formation non trouvée' });
          }
          formation.inscrireParticipant(
            req.body.participant,
            req.body.dateInscription
          );
          await formation.save();
          res.json(formation);
        } catch (error) {
          res.status(400).json({ message: 'Données invalides', error: error.message });
        }
      }
    },
    {
      method: 'POST',
      path: '/formations/:id/evaluer',
      handler: async (req, res) => {
        try {
          const formation = await Formation.findById(req.params.id);
          if (!formation) {
            return res.status(404).json({ message: 'Formation non trouvée' });
          }
          formation.evaluerParticipant(
            req.body.participant,
            req.body.note,
            req.body.commentaire,
            req.user.id
          );
          await formation.save();
          res.json(formation);
        } catch (error) {
          res.status(400).json({ message: 'Données invalides', error: error.message });
        }
      }
    }
  ]
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

    // Statistiques des incidents
    const incidentsTotal = await Incident.countDocuments({ isArchived: false });
    const incidentsOuverts = await Incident.countDocuments({ 
      statut: { $in: ['Déclaré', 'En cours', 'En investigation'] },
      isArchived: false 
    });
    const incidentsFermes = await Incident.countDocuments({ 
      statut: { $in: ['Résolu', 'Fermé', 'Clôturé'] },
      isArchived: false 
    });

    // Statistiques des risques
    const risquesTotal = await Risque.countDocuments({ isArchived: false });
    const risquesEleves = await Risque.countDocuments({ 
      niveau: { $in: ['Élevé', 'Critique'] },
      isArchived: false 
    });

    // Statistiques des formations
    const formationsTotal = await Formation.countDocuments({ isArchived: false });
    const formationsEnCours = await Formation.countDocuments({ 
      statut: 'En cours',
      isArchived: false 
    });

    res.json({
      incidents: {
        total: incidentsTotal,
        ouverts: incidentsOuverts,
        fermes: incidentsFermes
      },
      risques: {
        total: risquesTotal,
        eleves: risquesEleves
      },
      formations: {
        total: formationsTotal,
        enCours: formationsEnCours
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ROUTES DASHBOARD ====================
router.get('/dashboard', async (req, res) => {
  try {
    // Données récentes
    const incidentsRecents = await Incident.find({ isArchived: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('responsable', 'nom prenom');

    const risquesRecents = await Risque.find({ isArchived: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('responsable', 'nom prenom');

    const formationsRecentes = await Formation.find({ isArchived: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('formateur', 'nom prenom');

    // Alertes
    const epiStockFaible = await EPI.find({
      isArchived: false,
      'stock.quantite': { $lte: '$stock.seuilAlerte' }
    }).countDocuments();

    const produitsPerimes = await ProduitChimique.find({
      isArchived: false,
      'stock.dateExpiration': { $lte: new Date() }
    }).countDocuments();

    res.json({
      incidentsRecents,
      risquesRecents,
      formationsRecentes,
      alertes: {
        epiStockFaible,
        produitsPerimes
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
