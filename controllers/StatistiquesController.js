const Audit = require('../models/Audit');
const Incident = require('../models/Incident');
const Risque = require('../models/Risque');
const Formation = require('../models/Formation');
const Conformite = require('../models/Conformite');

class StatistiquesController {
  // Obtenir les statistiques de base
  async getBase(req, res) {
    try {
      const [
        totalAudits,
        auditsPlanifies,
        auditsEnCours,
        auditsTermines,
        totalIncidents,
        incidentsCritiques,
        incidentsEnCours,
        incidentsResolus,
        totalRisques,
        risquesCritiques,
        risquesEleves,
        risquesModeres,
        totalFormations,
        formationsPlanifiees,
        formationsEnCours,
        formationsTerminees,
        totalConformites,
        conformitesConformes,
        conformitesNonConformes,
        conformitesAEvaluer
      ] = await Promise.all([
        Audit.countDocuments(),
        Audit.countDocuments({ statut: 'planifie' }),
        Audit.countDocuments({ statut: 'en_cours' }),
        Audit.countDocuments({ statut: 'termine' }),
        Incident.countDocuments(),
        Incident.countDocuments({ gravite: 'critique' }),
        Incident.countDocuments({ statut: 'en_cours' }),
        Incident.countDocuments({ statut: 'resolu' }),
        Risque.countDocuments(),
        Risque.countDocuments({ niveau: 'critique' }),
        Risque.countDocuments({ niveau: 'eleve' }),
        Risque.countDocuments({ niveau: 'modere' }),
        Formation.countDocuments(),
        Formation.countDocuments({ statut: 'planifiee' }),
        Formation.countDocuments({ statut: 'en_cours' }),
        Formation.countDocuments({ statut: 'terminee' }),
        Conformite.countDocuments(),
        Conformite.countDocuments({ statut: 'conforme' }),
        Conformite.countDocuments({ statut: 'non_conforme' }),
        Conformite.countDocuments({ statut: 'a_evaluer' })
      ]);

      const statistiques = {
        audits: {
          total: totalAudits,
          planifies: auditsPlanifies,
          enCours: auditsEnCours,
          termines: auditsTermines
        },
        incidents: {
          total: totalIncidents,
          critiques: incidentsCritiques,
          enCours: incidentsEnCours,
          resolus: incidentsResolus
        },
        risques: {
          total: totalRisques,
          critiques: risquesCritiques,
          eleves: risquesEleves,
          moderes: risquesModeres
        },
        formations: {
          total: totalFormations,
          planifiees: formationsPlanifiees,
          enCours: formationsEnCours,
          terminees: formationsTerminees
        },
        conformites: {
          total: totalConformites,
          conformes: conformitesConformes,
          nonConformes: conformitesNonConformes,
          aEvaluer: conformitesAEvaluer
        }
      };

      res.json({
        success: true,
        data: statistiques,
        message: 'Statistiques de base récupérées avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }

  // Obtenir les statistiques étendues
  async getEtendues(req, res) {
    try {
      const [
        auditsParType,
        incidentsParGravite,
        risquesParCategorie,
        formationsParType,
        conformitesParDomaine
      ] = await Promise.all([
        Audit.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        Incident.aggregate([
          { $group: { _id: '$gravite', count: { $sum: 1 } } }
        ]),
        Risque.aggregate([
          { $group: { _id: '$categorie', count: { $sum: 1 } } }
        ]),
        Formation.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        Conformite.aggregate([
          { $group: { _id: '$domaine', count: { $sum: 1 } } }
        ])
      ]);

      const statistiques = {
        auditsParType,
        incidentsParGravite,
        risquesParCategorie,
        formationsParType,
        conformitesParDomaine
      };

      res.json({
        success: true,
        data: statistiques,
        message: 'Statistiques étendues récupérées avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques étendues',
        error: error.message
      });
    }
  }

  // Obtenir les statistiques par période
  async getParPeriode(req, res) {
    try {
      const { debut, fin } = req.query;
      const dateDebut = new Date(debut);
      const dateFin = new Date(fin);

      const [
        auditsPeriode,
        incidentsPeriode,
        risquesPeriode,
        formationsPeriode,
        conformitesPeriode
      ] = await Promise.all([
        Audit.countDocuments({
          dateAudit: { $gte: dateDebut, $lte: dateFin }
        }),
        Incident.countDocuments({
          dateIncident: { $gte: dateDebut, $lte: dateFin }
        }),
        Risque.countDocuments({
          dateCreation: { $gte: dateDebut, $lte: dateFin }
        }),
        Formation.countDocuments({
          dateDebut: { $gte: dateDebut, $lte: dateFin }
        }),
        Conformite.countDocuments({
          dateEvaluation: { $gte: dateDebut, $lte: dateFin }
        })
      ]);

      const statistiques = {
        periode: { debut: dateDebut, fin: dateFin },
        audits: auditsPeriode,
        incidents: incidentsPeriode,
        risques: risquesPeriode,
        formations: formationsPeriode,
        conformites: conformitesPeriode
      };

      res.json({
        success: true,
        data: statistiques,
        message: 'Statistiques par période récupérées avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques par période',
        error: error.message
      });
    }
  }

  // Obtenir les données du dashboard
  async getDashboard(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;

      const [
        auditsRecents,
        incidentsRecents,
        formationsExpirantes,
        conformitesExpirantes,
        actionsCorrectivesEnRetard
      ] = await Promise.all([
        Audit.find()
          .populate('auditeur', 'nom prenom email')
          .sort({ dateAudit: -1 })
          .limit(limit),
        Incident.find()
          .populate('rapporteur', 'nom prenom email')
          .sort({ dateIncident: -1 })
          .limit(limit),
        Formation.find({
          dateFin: { $lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
          statut: { $ne: 'terminee' }
        })
          .populate('formateur', 'nom prenom email')
          .sort({ dateFin: 1 })
          .limit(limit),
        Conformite.find({
          dateExpiration: { $lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
          statut: { $ne: 'conforme' }
        })
          .populate('responsable', 'nom prenom email')
          .sort({ dateExpiration: 1 })
          .limit(limit),
        Incident.find({
          'actionsCorrectives.echeance': { $lt: new Date() },
          'actionsCorrectives.statut': { $ne: 'terminee' }
        })
          .populate('rapporteur', 'nom prenom email')
          .limit(limit)
      ]);

      const dashboardData = {
        auditsRecents,
        incidentsRecents,
        formationsExpirantes,
        conformitesExpirantes,
        actionsCorrectivesEnRetard
      };

      res.json({
        success: true,
        data: dashboardData,
        message: 'Données du dashboard récupérées avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des données du dashboard',
        error: error.message
      });
    }
  }

  // Obtenir les notifications
  async getNotifications(req, res) {
    try {
      const notifications = [
        {
          id: '1',
          type: 'warning',
          titre: 'Formations expirantes',
          message: '3 formations arrivent à expiration dans les 30 prochains jours',
          date: new Date(),
          lue: false
        },
        {
          id: '2',
          type: 'info',
          titre: 'Nouvel audit programmé',
          message: 'Un audit qualité est programmé pour la semaine prochaine',
          date: new Date(),
          lue: false
        }
      ];

      res.json({
        success: true,
        data: notifications,
        message: 'Notifications récupérées avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications',
        error: error.message
      });
    }
  }

  // Marquer une notification comme lue
  async marquerNotificationLue(req, res) {
    try {
      // Ici vous pouvez implémenter la logique pour marquer une notification comme lue
      res.json({
        success: true,
        message: 'Notification marquée comme lue'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la notification',
        error: error.message
      });
    }
  }

  // Marquer toutes les notifications comme lues
  async marquerToutesNotificationsLues(req, res) {
    try {
      // Ici vous pouvez implémenter la logique pour marquer toutes les notifications comme lues
      res.json({
        success: true,
        message: 'Toutes les notifications marquées comme lues'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour des notifications',
        error: error.message
      });
    }
  }

  // Configurer les alertes
  async configurerAlertes(req, res) {
    try {
      const config = req.body;
      // Ici vous pouvez implémenter la logique pour sauvegarder la configuration des alertes
      res.json({
        success: true,
        data: config,
        message: 'Configuration des alertes mise à jour avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la configuration des alertes',
        error: error.message
      });
    }
  }

  // Obtenir la configuration
  async getConfig(req, res) {
    try {
      const config = {
        entreprise: {
          nom: 'Trafrule',
          adresse: '123 Rue de la Qualité',
          ville: 'Paris',
          codePostal: '75001'
        },
        parametres: {
          theme: 'light',
          langue: 'fr',
          notifications: {
            email: true,
            incidents: true,
            audits: true,
            formations: true
          }
        }
      };

      res.json({
        success: true,
        data: config,
        message: 'Configuration récupérée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la configuration',
        error: error.message
      });
    }
  }

  // Mettre à jour la configuration
  async updateConfig(req, res) {
    try {
      const { section, data } = req.body;
      // Ici vous pouvez implémenter la logique pour mettre à jour la configuration
      res.json({
        success: true,
        data: { section, data },
        message: 'Configuration mise à jour avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la configuration',
        error: error.message
      });
    }
  }

  // Obtenir les paramètres
  async getParametres(req, res) {
    try {
      const parametres = {
        theme: 'light',
        langue: 'fr',
        notifications: {
          email: true,
          incidents: true,
          audits: true,
          formations: true
        }
      };

      res.json({
        success: true,
        data: parametres,
        message: 'Paramètres récupérés avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paramètres',
        error: error.message
      });
    }
  }

  // Créer une sauvegarde
  async createBackup(req, res) {
    try {
      const backupData = req.body;
      // Ici vous pouvez implémenter la logique pour créer une sauvegarde
      res.json({
        success: true,
        data: { id: 'backup_' + Date.now() },
        message: 'Sauvegarde créée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la sauvegarde',
        error: error.message
      });
    }
  }

  // Exporter la configuration
  async exportConfig(req, res) {
    try {
      const format = req.query.format || 'json';
      const config = {
        entreprise: {
          nom: 'Trafrule',
          adresse: '123 Rue de la Qualité',
          ville: 'Paris',
          codePostal: '75001'
        },
        parametres: {
          theme: 'light',
          langue: 'fr',
          notifications: {
            email: true,
            incidents: true,
            audits: true,
            formations: true
          }
        }
      };

      res.json({
        success: true,
        data: config,
        message: 'Configuration exportée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export de la configuration',
        error: error.message
      });
    }
  }

  // Importer une configuration
  async importConfig(req, res) {
    try {
      const { configData } = req.body;
      // Ici vous pouvez implémenter la logique pour importer une configuration
      res.json({
        success: true,
        data: configData,
        message: 'Configuration importée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'import de la configuration',
        error: error.message
      });
    }
  }

  // Obtenir les réglementations
  async getReglementations(req, res) {
    try {
      const reglementations = [
        {
          id: '1',
          nom: 'ISO 9001:2015',
          description: 'Systèmes de management de la qualité',
          statut: 'applicable',
          dateExpiration: new Date('2025-12-31')
        },
        {
          id: '2',
          nom: 'ISO 14001:2015',
          description: 'Systèmes de management environnemental',
          statut: 'applicable',
          dateExpiration: new Date('2025-12-31')
        }
      ];

      res.json({
        success: true,
        data: reglementations,
        message: 'Réglementations récupérées avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des réglementations',
        error: error.message
      });
    }
  }

  // Exporter le rapport complet
  async exportRapportComplet(req, res) {
    try {
      const format = req.query.format || 'pdf';
      // Ici vous pouvez implémenter l'export du rapport complet
      res.json({
        success: true,
        data: { url: '/exports/rapport-complet.pdf' },
        message: 'Rapport complet exporté avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export du rapport complet',
        error: error.message
      });
    }
  }
}

module.exports = new StatistiquesController();
