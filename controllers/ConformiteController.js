const BaseController = require('./BaseController');
const Conformite = require('../models/Conformite');

class ConformiteController extends BaseController {
  constructor() {
    super(Conformite);
  }

  // Obtenir toutes les conformités
  async getAll(req, res) {
    try {
      const conformites = await Conformite.find()
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email')
        .sort({ dateEvaluation: -1 });
      
      res.json({
        success: true,
        data: conformites,
        message: 'Conformités récupérées avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des conformités',
        error: error.message
      });
    }
  }

  // Obtenir une conformité par ID
  async getById(req, res) {
    try {
      const conformite = await Conformite.findById(req.params.id)
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email')
        .populate('actionsCorrectives.responsable', 'nom prenom email');
      
      if (!conformite) {
        return res.status(404).json({
          success: false,
          message: 'Conformité non trouvée'
        });
      }

      res.json({
        success: true,
        data: conformite,
        message: 'Conformité récupérée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la conformité',
        error: error.message
      });
    }
  }

  // Créer une nouvelle conformité
  async create(req, res) {
    try {
      const conformiteData = {
        ...req.body,
        evaluateur: req.user.id,
        dateCreation: new Date()
      };

      const conformite = new Conformite(conformiteData);
      await conformite.save();

      const populatedConformite = await Conformite.findById(conformite._id)
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email');

      res.status(201).json({
        success: true,
        data: populatedConformite,
        message: 'Conformité créée avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la création de la conformité',
        error: error.message
      });
    }
  }

  // Mettre à jour une conformité
  async update(req, res) {
    try {
      const conformite = await Conformite.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('responsable', 'nom prenom email')
       .populate('evaluateur', 'nom prenom email');

      if (!conformite) {
        return res.status(404).json({
          success: false,
          message: 'Conformité non trouvée'
        });
      }

      res.json({
        success: true,
        data: conformite,
        message: 'Conformité mise à jour avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la conformité',
        error: error.message
      });
    }
  }

  // Supprimer une conformité
  async delete(req, res) {
    try {
      const conformite = await Conformite.findByIdAndDelete(req.params.id);

      if (!conformite) {
        return res.status(404).json({
          success: false,
          message: 'Conformité non trouvée'
        });
      }

      res.json({
        success: true,
        message: 'Conformité supprimée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la conformité',
        error: error.message
      });
    }
  }

  // Obtenir les conformités par type
  async getByType(req, res) {
    try {
      const conformites = await Conformite.find({ type: req.params.type })
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email')
        .sort({ dateEvaluation: -1 });

      res.json({
        success: true,
        data: conformites,
        message: `Conformités de type ${req.params.type} récupérées avec succès`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des conformités',
        error: error.message
      });
    }
  }

  // Obtenir les conformités par domaine
  async getByDomaine(req, res) {
    try {
      const conformites = await Conformite.find({ domaine: req.params.domaine })
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email')
        .sort({ dateEvaluation: -1 });

      res.json({
        success: true,
        data: conformites,
        message: `Conformités du domaine ${req.params.domaine} récupérées avec succès`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des conformités',
        error: error.message
      });
    }
  }

  // Obtenir les conformités expirantes
  async getExpirantes(req, res) {
    try {
      const dateLimite = new Date();
      dateLimite.setMonth(dateLimite.getMonth() + 3); // 3 mois à l'avance

      const conformites = await Conformite.find({
        dateExpiration: { $lte: dateLimite },
        statut: { $ne: 'conforme' }
      })
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email')
        .sort({ dateExpiration: 1 });

      res.json({
        success: true,
        data: conformites,
        message: 'Conformités expirantes récupérées avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des conformités expirantes',
        error: error.message
      });
    }
  }

  // Obtenir les non-conformités
  async getNonConformes(req, res) {
    try {
      const conformites = await Conformite.find({
        statut: { $in: ['non_conforme', 'partiellement_conforme'] }
      })
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email')
        .populate('actionsCorrectives.responsable', 'nom prenom email')
        .sort({ dateEvaluation: -1 });

      res.json({
        success: true,
        data: conformites,
        message: 'Non-conformités récupérées avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des non-conformités',
        error: error.message
      });
    }
  }

  // Exporter les conformités
  async export(req, res) {
    try {
      const format = req.query.format || 'excel';
      const conformites = await Conformite.find()
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email');

      // Ici vous pouvez implémenter l'export selon le format demandé
      // Pour l'instant, on retourne les données en JSON
      res.json({
        success: true,
        data: conformites,
        message: 'Export des conformités récupéré avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export des conformités',
        error: error.message
      });
    }
  }
}

module.exports = new ConformiteController();
