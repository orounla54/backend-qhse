const BaseController = require('./BaseController');
const Audit = require('../models/Audit');

class AuditController extends BaseController {
  constructor() {
    super(Audit, 'Audit');
  }

  getSearchFields() {
    return ['numero', 'titre', 'description', 'domaine', 'type'];
  }

  getPopulateFields() {
    return [
      'auditeurPrincipal',
      'auditeurs.auditeur',
      'demandeur',
      'constatations.responsable',
      'actionsCorrectives.responsable',
      'createdBy',
      'updatedBy'
    ];
  }

  getCollectionName() {
    return 'audits';
  }

  /**
   * Obtenir les audits par statut
   */
  async getByStatut(req, res) {
    try {
      const audits = await Audit.find({ 
        statut: req.params.statut, 
        isArchived: false 
      })
      .populate(this.getPopulateFields())
      .sort({ datePlanification: -1 });

      res.json(audits);
    } catch (error) {
      console.error('Erreur lors de la récupération des audits par statut:', error);
      res.status(500).json({ 
        message: 'Erreur serveur', 
        error: error.message 
      });
    }
  }

  /**
   * Obtenir les audits par type
   */
  async getByType(req, res) {
    try {
      const audits = await Audit.find({ 
        type: req.params.type, 
        isArchived: false 
      })
      .populate(this.getPopulateFields())
      .sort({ datePlanification: -1 });

      res.json(audits);
    } catch (error) {
      console.error('Erreur lors de la récupération des audits par type:', error);
      res.status(500).json({ 
        message: 'Erreur serveur', 
        error: error.message 
      });
    }
  }

  /**
   * Créer un nouvel audit avec numéro automatique
   */
  async create(req, res) {
    try {
      // Générer un numéro d'audit automatique
      const count = await Audit.countDocuments({});
      const numero = `AUD-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
      
      const auditData = {
        ...req.body,
        numero,
        createdBy: req.user.id,
        demandeur: req.user.id,
        statut: req.body.statut || 'Planifié',
        priorite: req.body.priorite || 'Normale'
      };

      const audit = new Audit(auditData);
      await audit.save();
      
      const populatedAudit = await Audit.findById(audit._id)
        .populate(this.getPopulateFields());
      
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
  }
}

module.exports = new AuditController();
