const BaseController = require('./BaseController');
const Formation = require('../models/Formation');

class FormationController extends BaseController {
  constructor() {
    super(Formation);
  }

  // Obtenir toutes les formations
  async getAll(req, res) {
    try {
      const formations = await Formation.find()
        .populate('formateur', 'nom prenom email')
        .populate('participants.participant', 'nom prenom email')
        .sort({ dateDebut: -1 });
      
      res.json({
        success: true,
        data: formations,
        message: 'Formations récupérées avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des formations',
        error: error.message
      });
    }
  }

  // Obtenir une formation par ID
  async getById(req, res) {
    try {
      const formation = await Formation.findById(req.params.id)
        .populate('formateur', 'nom prenom email')
        .populate('participants.participant', 'nom prenom email');
      
      if (!formation) {
        return res.status(404).json({
          success: false,
          message: 'Formation non trouvée'
        });
      }

      res.json({
        success: true,
        data: formation,
        message: 'Formation récupérée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la formation',
        error: error.message
      });
    }
  }

  // Créer une nouvelle formation
  async create(req, res) {
    try {
      const formationData = {
        ...req.body,
        createur: req.user.id,
        dateCreation: new Date()
      };

      const formation = new Formation(formationData);
      await formation.save();

      const populatedFormation = await Formation.findById(formation._id)
        .populate('formateur', 'nom prenom email')
        .populate('participants.participant', 'nom prenom email');

      res.status(201).json({
        success: true,
        data: populatedFormation,
        message: 'Formation créée avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la création de la formation',
        error: error.message
      });
    }
  }

  // Mettre à jour une formation
  async update(req, res) {
    try {
      const formation = await Formation.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('formateur', 'nom prenom email')
       .populate('participants.participant', 'nom prenom email');

      if (!formation) {
        return res.status(404).json({
          success: false,
          message: 'Formation non trouvée'
        });
      }

      res.json({
        success: true,
        data: formation,
        message: 'Formation mise à jour avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la formation',
        error: error.message
      });
    }
  }

  // Supprimer une formation
  async delete(req, res) {
    try {
      const formation = await Formation.findByIdAndDelete(req.params.id);

      if (!formation) {
        return res.status(404).json({
          success: false,
          message: 'Formation non trouvée'
        });
      }

      res.json({
        success: true,
        message: 'Formation supprimée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la formation',
        error: error.message
      });
    }
  }

  // Obtenir les formations par type
  async getByType(req, res) {
    try {
      const formations = await Formation.find({ type: req.params.type })
        .populate('formateur', 'nom prenom email')
        .populate('participants.participant', 'nom prenom email')
        .sort({ dateDebut: -1 });

      res.json({
        success: true,
        data: formations,
        message: `Formations de type ${req.params.type} récupérées avec succès`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des formations',
        error: error.message
      });
    }
  }

  // Obtenir les formations par catégorie
  async getByCategorie(req, res) {
    try {
      const formations = await Formation.find({ categorie: req.params.categorie })
        .populate('formateur', 'nom prenom email')
        .populate('participants.participant', 'nom prenom email')
        .sort({ dateDebut: -1 });

      res.json({
        success: true,
        data: formations,
        message: `Formations de catégorie ${req.params.categorie} récupérées avec succès`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des formations',
        error: error.message
      });
    }
  }

  // Obtenir les formations expirantes
  async getExpirantes(req, res) {
    try {
      const dateLimite = new Date();
      dateLimite.setMonth(dateLimite.getMonth() + 3); // 3 mois à l'avance

      const formations = await Formation.find({
        dateFin: { $lte: dateLimite },
        statut: { $ne: 'terminee' }
      })
        .populate('formateur', 'nom prenom email')
        .populate('participants.participant', 'nom prenom email')
        .sort({ dateFin: 1 });

      res.json({
        success: true,
        data: formations,
        message: 'Formations expirantes récupérées avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des formations expirantes',
        error: error.message
      });
    }
  }

  // Exporter les formations
  async export(req, res) {
    try {
      const format = req.query.format || 'excel';
      const formations = await Formation.find()
        .populate('formateur', 'nom prenom email')
        .populate('participants.participant', 'nom prenom email');

      // Ici vous pouvez implémenter l'export selon le format demandé
      // Pour l'instant, on retourne les données en JSON
      res.json({
        success: true,
        data: formations,
        message: 'Export des formations récupéré avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export des formations',
        error: error.message
      });
    }
  }
}

module.exports = new FormationController();
