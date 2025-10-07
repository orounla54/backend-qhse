const BaseController = require('./BaseController');
const Incident = require('../models/Incident');

class IncidentController extends BaseController {
  constructor() {
    super(Incident);
  }

  // Obtenir tous les incidents
  async getAll(req, res) {
    try {
      const incidents = await Incident.find()
        .populate('rapporteur', 'nom prenom email')
        .populate('responsable', 'nom prenom email')
        .sort({ dateIncident: -1 });
      
      res.json({
        success: true,
        data: incidents,
        message: 'Incidents récupérés avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des incidents',
        error: error.message
      });
    }
  }

  // Obtenir un incident par ID
  async getById(req, res) {
    try {
      const incident = await Incident.findById(req.params.id)
        .populate('rapporteur', 'nom prenom email')
        .populate('responsable', 'nom prenom email')
        .populate('actionsCorrectives.responsable', 'nom prenom email');
      
      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Incident non trouvé'
        });
      }

      res.json({
        success: true,
        data: incident,
        message: 'Incident récupéré avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'incident',
        error: error.message
      });
    }
  }

  // Créer un nouvel incident
  async create(req, res) {
    try {
      const incidentData = {
        ...req.body,
        rapporteur: req.user.id,
        dateIncident: new Date(req.body.dateIncident || Date.now())
      };

      const incident = new Incident(incidentData);
      await incident.save();

      const populatedIncident = await Incident.findById(incident._id)
        .populate('rapporteur', 'nom prenom email')
        .populate('responsable', 'nom prenom email');

      res.status(201).json({
        success: true,
        data: populatedIncident,
        message: 'Incident créé avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la création de l\'incident',
        error: error.message
      });
    }
  }

  // Mettre à jour un incident
  async update(req, res) {
    try {
      const incident = await Incident.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('rapporteur', 'nom prenom email')
       .populate('responsable', 'nom prenom email');

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Incident non trouvé'
        });
      }

      res.json({
        success: true,
        data: incident,
        message: 'Incident mis à jour avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'incident',
        error: error.message
      });
    }
  }

  // Supprimer un incident
  async delete(req, res) {
    try {
      const incident = await Incident.findByIdAndDelete(req.params.id);

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Incident non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Incident supprimé avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'incident',
        error: error.message
      });
    }
  }

  // Obtenir les incidents par gravité
  async getByGravite(req, res) {
    try {
      const incidents = await Incident.find({ gravite: req.params.gravite })
        .populate('rapporteur', 'nom prenom email')
        .populate('responsable', 'nom prenom email')
        .sort({ dateIncident: -1 });

      res.json({
        success: true,
        data: incidents,
        message: `Incidents de gravité ${req.params.gravite} récupérés avec succès`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des incidents',
        error: error.message
      });
    }
  }

  // Obtenir les incidents par type
  async getByType(req, res) {
    try {
      const incidents = await Incident.find({ type: req.params.type })
        .populate('rapporteur', 'nom prenom email')
        .populate('responsable', 'nom prenom email')
        .sort({ dateIncident: -1 });

      res.json({
        success: true,
        data: incidents,
        message: `Incidents de type ${req.params.type} récupérés avec succès`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des incidents',
        error: error.message
      });
    }
  }

  // Obtenir les actions correctives
  async getActionsCorrectives(req, res) {
    try {
      const incidents = await Incident.find({ 'actionsCorrectives.0': { $exists: true } })
        .populate('rapporteur', 'nom prenom email')
        .populate('responsable', 'nom prenom email')
        .populate('actionsCorrectives.responsable', 'nom prenom email');

      res.json({
        success: true,
        data: incidents,
        message: 'Actions correctives récupérées avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des actions correctives',
        error: error.message
      });
    }
  }

  // Mettre à jour une action corrective
  async updateActionCorrective(req, res) {
    try {
      const { incidentId, actionId } = req.params;
      const updateData = req.body;

      const incident = await Incident.findById(incidentId);
      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Incident non trouvé'
        });
      }

      const actionIndex = incident.actionsCorrectives.findIndex(
        action => action._id.toString() === actionId
      );

      if (actionIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Action corrective non trouvée'
        });
      }

      incident.actionsCorrectives[actionIndex] = {
        ...incident.actionsCorrectives[actionIndex].toObject(),
        ...updateData
      };

      await incident.save();

      res.json({
        success: true,
        data: incident,
        message: 'Action corrective mise à jour avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'action corrective',
        error: error.message
      });
    }
  }

  // Obtenir les actions par statut
  async getActionsByStatut(req, res) {
    try {
      const incidents = await Incident.find({
        'actionsCorrectives.statut': req.params.statut
      })
        .populate('rapporteur', 'nom prenom email')
        .populate('responsable', 'nom prenom email')
        .populate('actionsCorrectives.responsable', 'nom prenom email');

      res.json({
        success: true,
        data: incidents,
        message: `Actions correctives avec statut ${req.params.statut} récupérées avec succès`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des actions correctives',
        error: error.message
      });
    }
  }

  // Obtenir les actions en retard
  async getActionsEnRetard(req, res) {
    try {
      const today = new Date();
      const incidents = await Incident.find({
        'actionsCorrectives.echeance': { $lt: today },
        'actionsCorrectives.statut': { $ne: 'terminee' }
      })
        .populate('rapporteur', 'nom prenom email')
        .populate('responsable', 'nom prenom email')
        .populate('actionsCorrectives.responsable', 'nom prenom email');

      res.json({
        success: true,
        data: incidents,
        message: 'Actions correctives en retard récupérées avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des actions en retard',
        error: error.message
      });
    }
  }

  // Exporter les incidents
  async export(req, res) {
    try {
      const format = req.query.format || 'excel';
      const incidents = await Incident.find()
        .populate('rapporteur', 'nom prenom email')
        .populate('responsable', 'nom prenom email');

      // Ici vous pouvez implémenter l'export selon le format demandé
      // Pour l'instant, on retourne les données en JSON
      res.json({
        success: true,
        data: incidents,
        message: 'Export des incidents récupéré avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export des incidents',
        error: error.message
      });
    }
  }
}

module.exports = new IncidentController();
