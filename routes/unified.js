const express = require('express');
const router = express.Router();
const { auth, checkPermission } = require('../middlewares/auth');

// Import des contrôleurs unifiés
const AuditController = require('../controllers/AuditController');
const IncidentController = require('../controllers/IncidentController');
const RisqueController = require('../controllers/RisqueController');
const FormationController = require('../controllers/FormationController');
const ConformiteController = require('../controllers/ConformiteController');
const StatistiquesController = require('../controllers/StatistiquesController');

// Middleware d'authentification pour toutes les routes
router.use(auth);

// ==================== ROUTES AUDITS UNIFIÉES ====================

// GET /api/qhse/audits - Obtenir tous les audits
router.get('/audits', 
  checkPermission('audit_read'),
  AuditController.getAll
);

// GET /api/qhse/audits/:id - Obtenir un audit par ID
router.get('/audits/:id', 
  checkPermission('audit_read'),
  AuditController.getById
);

// POST /api/qhse/audits - Créer un nouvel audit
router.post('/audits', 
  checkPermission('audit_write'),
  AuditController.create
);

// PUT /api/qhse/audits/:id - Mettre à jour un audit
router.put('/audits/:id', 
  checkPermission('audit_write'),
  AuditController.update
);

// DELETE /api/qhse/audits/:id - Supprimer un audit
router.delete('/audits/:id', 
  checkPermission('audit_delete'),
  AuditController.delete
);

// GET /api/qhse/audits/statut/:statut - Obtenir audits par statut
router.get('/audits/statut/:statut', 
  checkPermission('audit_read'),
  AuditController.getByStatut
);

// GET /api/qhse/audits/type/:type - Obtenir audits par type
router.get('/audits/type/:type', 
  checkPermission('audit_read'),
  AuditController.getByType
);

// ==================== ROUTES INCIDENTS UNIFIÉES ====================

// GET /api/qhse/incidents - Obtenir tous les incidents
router.get('/incidents', 
  checkPermission('incident_read'),
  IncidentController.getAll
);

// GET /api/qhse/incidents/:id - Obtenir un incident par ID
router.get('/incidents/:id', 
  checkPermission('incident_read'),
  IncidentController.getById
);

// POST /api/qhse/incidents - Créer un nouvel incident
router.post('/incidents', 
  checkPermission('incident_write'),
  IncidentController.create
);

// PUT /api/qhse/incidents/:id - Mettre à jour un incident
router.put('/incidents/:id', 
  checkPermission('incident_write'),
  IncidentController.update
);

// DELETE /api/qhse/incidents/:id - Supprimer un incident
router.delete('/incidents/:id', 
  checkPermission('incident_delete'),
  IncidentController.delete
);

// GET /api/qhse/incidents/gravite/:gravite - Obtenir incidents par gravité
router.get('/incidents/gravite/:gravite', 
  checkPermission('incident_read'),
  IncidentController.getByGravite
);

// GET /api/qhse/incidents/type/:type - Obtenir incidents par type
router.get('/incidents/type/:type', 
  checkPermission('incident_read'),
  IncidentController.getByType
);

// ==================== ROUTES RISQUES UNIFIÉES ====================

// GET /api/qhse/risques - Obtenir tous les risques
router.get('/risques', 
  checkPermission('risque_read'),
  RisqueController.getAll
);

// GET /api/qhse/risques/:id - Obtenir un risque par ID
router.get('/risques/:id', 
  checkPermission('risque_read'),
  RisqueController.getById
);

// POST /api/qhse/risques - Créer un nouveau risque
router.post('/risques', 
  checkPermission('risque_write'),
  RisqueController.create
);

// PUT /api/qhse/risques/:id - Mettre à jour un risque
router.put('/risques/:id', 
  checkPermission('risque_write'),
  RisqueController.update
);

// DELETE /api/qhse/risques/:id - Supprimer un risque
router.delete('/risques/:id', 
  checkPermission('risque_delete'),
  RisqueController.delete
);

// GET /api/qhse/risques/niveau/:niveau - Obtenir risques par niveau
router.get('/risques/niveau/:niveau', 
  checkPermission('risque_read'),
  RisqueController.getByNiveau
);

// GET /api/qhse/risques/categorie/:categorie - Obtenir risques par catégorie
router.get('/risques/categorie/:categorie', 
  checkPermission('risque_read'),
  RisqueController.getByCategorie
);

// GET /api/qhse/risques/matrice - Obtenir la matrice des risques
router.get('/risques/matrice', 
  checkPermission('risque_read'),
  RisqueController.getMatrice
);

// ==================== ROUTES FORMATIONS UNIFIÉES ====================

// GET /api/qhse/formations - Obtenir toutes les formations
router.get('/formations', 
  checkPermission('formation_read'),
  FormationController.getAll
);

// GET /api/qhse/formations/:id - Obtenir une formation par ID
router.get('/formations/:id', 
  checkPermission('formation_read'),
  FormationController.getById
);

// POST /api/qhse/formations - Créer une nouvelle formation
router.post('/formations', 
  checkPermission('formation_write'),
  FormationController.create
);

// PUT /api/qhse/formations/:id - Mettre à jour une formation
router.put('/formations/:id', 
  checkPermission('formation_write'),
  FormationController.update
);

// DELETE /api/qhse/formations/:id - Supprimer une formation
router.delete('/formations/:id', 
  checkPermission('formation_delete'),
  FormationController.delete
);

// GET /api/qhse/formations/type/:type - Obtenir formations par type
router.get('/formations/type/:type', 
  checkPermission('formation_read'),
  FormationController.getByType
);

// GET /api/qhse/formations/categorie/:categorie - Obtenir formations par catégorie
router.get('/formations/categorie/:categorie', 
  checkPermission('formation_read'),
  FormationController.getByCategorie
);

// GET /api/qhse/formations/expirantes - Obtenir les formations expirantes
router.get('/formations/expirantes', 
  checkPermission('formation_read'),
  FormationController.getExpirantes
);

// ==================== ROUTES CONFORMITÉ UNIFIÉES ====================

// GET /api/qhse/conformites - Obtenir toutes les conformités
router.get('/conformites', 
  checkPermission('conformite_read'),
  ConformiteController.getAll
);

// GET /api/qhse/conformites/:id - Obtenir une conformité par ID
router.get('/conformites/:id', 
  checkPermission('conformite_read'),
  ConformiteController.getById
);

// POST /api/qhse/conformites - Créer une nouvelle conformité
router.post('/conformites', 
  checkPermission('conformite_write'),
  ConformiteController.create
);

// PUT /api/qhse/conformites/:id - Mettre à jour une conformité
router.put('/conformites/:id', 
  checkPermission('conformite_write'),
  ConformiteController.update
);

// DELETE /api/qhse/conformites/:id - Supprimer une conformité
router.delete('/conformites/:id', 
  checkPermission('conformite_delete'),
  ConformiteController.delete
);

// GET /api/qhse/conformites/type/:type - Obtenir conformités par type
router.get('/conformites/type/:type', 
  checkPermission('conformite_read'),
  ConformiteController.getByType
);

// GET /api/qhse/conformites/domaine/:domaine - Obtenir conformités par domaine
router.get('/conformites/domaine/:domaine', 
  checkPermission('conformite_read'),
  ConformiteController.getByDomaine
);

// GET /api/qhse/conformites/expirantes - Obtenir les conformités expirantes
router.get('/conformites/expirantes', 
  checkPermission('conformite_read'),
  ConformiteController.getExpirantes
);

// GET /api/qhse/conformites/non-conformes - Obtenir les non-conformités
router.get('/conformites/non-conformes', 
  checkPermission('conformite_read'),
  ConformiteController.getNonConformes
);

// ==================== ROUTES STATISTIQUES UNIFIÉES ====================

// GET /api/qhse/stats - Obtenir les statistiques de base
router.get('/stats', 
  checkPermission('audit_read'),
  StatistiquesController.getBase
);

// GET /api/qhse/stats/etendues - Obtenir les statistiques étendues
router.get('/stats/etendues', 
  checkPermission('audit_read'),
  StatistiquesController.getEtendues
);

// GET /api/qhse/stats/periode - Obtenir les statistiques par période
router.get('/stats/periode', 
  checkPermission('audit_read'),
  StatistiquesController.getParPeriode
);

// GET /api/qhse/dashboard - Obtenir les données du tableau de bord
router.get('/dashboard', 
  checkPermission('audit_read'),
  StatistiquesController.getDashboard
);

// ==================== ROUTES ACTIONS CORRECTIVES UNIFIÉES ====================

// GET /api/qhse/actions-correctives - Obtenir toutes les actions correctives
router.get('/actions-correctives', 
  checkPermission('incident_read'),
  IncidentController.getActionsCorrectives
);

// PUT /api/qhse/actions-correctives/:incidentId/:actionId - Mettre à jour une action corrective
router.put('/actions-correctives/:incidentId/:actionId', 
  checkPermission('incident_write'),
  IncidentController.updateActionCorrective
);

// GET /api/qhse/actions-correctives/statut/:statut - Obtenir actions par statut
router.get('/actions-correctives/statut/:statut', 
  checkPermission('incident_read'),
  IncidentController.getActionsByStatut
);

// GET /api/qhse/actions-correctives/retard - Obtenir actions en retard
router.get('/actions-correctives/retard', 
  checkPermission('incident_read'),
  IncidentController.getActionsEnRetard
);

// ==================== ROUTES EXPORTS UNIFIÉES ====================

// GET /api/qhse/exports/audits - Exporter les audits
router.get('/exports/audits', 
  checkPermission('audit_read'),
  AuditController.export
);

// GET /api/qhse/exports/incidents - Exporter les incidents
router.get('/exports/incidents', 
  checkPermission('incident_read'),
  IncidentController.export
);

// GET /api/qhse/exports/risques - Exporter les risques
router.get('/exports/risques', 
  checkPermission('risque_read'),
  RisqueController.export
);

// GET /api/qhse/exports/formations - Exporter les formations
router.get('/exports/formations', 
  checkPermission('formation_read'),
  FormationController.export
);

// GET /api/qhse/exports/conformites - Exporter les conformités
router.get('/exports/conformites', 
  checkPermission('conformite_read'),
  ConformiteController.export
);

// GET /api/qhse/exports/rapport-complet - Exporter le rapport complet
router.get('/exports/rapport-complet', 
  checkPermission('audit_read'),
  StatistiquesController.exportRapportComplet
);

// ==================== ROUTES NOTIFICATIONS UNIFIÉES ====================

// GET /api/qhse/notifications - Obtenir les notifications
router.get('/notifications', 
  checkPermission('audit_read'),
  StatistiquesController.getNotifications
);

// PUT /api/qhse/notifications/:id/lue - Marquer une notification comme lue
router.put('/notifications/:id/lue', 
  checkPermission('audit_read'),
  StatistiquesController.marquerNotificationLue
);

// PUT /api/qhse/notifications/toutes-lues - Marquer toutes les notifications comme lues
router.put('/notifications/toutes-lues', 
  checkPermission('audit_read'),
  StatistiquesController.marquerToutesNotificationsLues
);

// POST /api/qhse/notifications/config - Configurer les alertes
router.post('/notifications/config', 
  checkPermission('config_write'),
  StatistiquesController.configurerAlertes
);

// ==================== ROUTES CONFIGURATION UNIFIÉES ====================

// GET /api/qhse/config - Obtenir la configuration complète
router.get('/config', async (req, res) => {
  try {
    res.json({
      message: 'Configuration QHSE',
      version: '1.0.0',
      modules: {
        qualite: true,
        hse: true,
        laboratoire: true,
        audit: true
      },
      permissions: req.user ? req.user.permissions : [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/qhse/config - Mettre à jour la configuration
router.put('/config', 
  checkPermission('config_write'),
  StatistiquesController.updateConfig
);

// GET /api/qhse/config/parametres - Obtenir les paramètres spécifiques
router.get('/config/parametres', 
  checkPermission('config_read'),
  StatistiquesController.getParametres
);

// POST /api/qhse/config/backup - Créer une sauvegarde de la configuration
router.post('/config/backup', 
  checkPermission('config_write'),
  StatistiquesController.createBackup
);

// GET /api/qhse/config/export - Exporter la configuration
router.get('/config/export', 
  checkPermission('config_read'),
  StatistiquesController.exportConfig
);

// POST /api/qhse/config/import - Importer une configuration
router.post('/config/import', 
  checkPermission('config_write'),
  StatistiquesController.importConfig
);

// GET /api/qhse/config/reglementations - Obtenir les réglementations locales
router.get('/config/reglementations', 
  checkPermission('config_read'),
  StatistiquesController.getReglementations
);

module.exports = router;
