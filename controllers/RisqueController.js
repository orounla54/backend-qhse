const BaseController = require('./BaseController');
const Risque = require('../models/Risque');

class RisqueController extends BaseController {
  constructor() {
    super(Risque);
  }

  // Obtenir tous les risques
  async getAll(req, res) {
    try {
      const risques = await Risque.find()
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email')
        .sort({ niveau: -1, dateCreation: -1 });
      
      res.json({
        success: true,
        data: risques,
        message: 'Risques récupérés avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des risques',
        error: error.message
      });
    }
  }

  // Obtenir un risque par ID
  async getById(req, res) {
    try {
      const risque = await Risque.findById(req.params.id)
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email')
        .populate('actionsPreventives.responsable', 'nom prenom email');
      
      if (!risque) {
        return res.status(404).json({
          success: false,
          message: 'Risque non trouvé'
        });
      }

      res.json({
        success: true,
        data: risque,
        message: 'Risque récupéré avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du risque',
        error: error.message
      });
    }
  }

  // Créer un nouveau risque
  async create(req, res) {
    try {
      const risqueData = {
        ...req.body,
        evaluateur: req.user.id,
        dateCreation: new Date()
      };

      const risque = new Risque(risqueData);
      await risque.save();

      const populatedRisque = await Risque.findById(risque._id)
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email');

      res.status(201).json({
        success: true,
        data: populatedRisque,
        message: 'Risque créé avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la création du risque',
        error: error.message
      });
    }
  }

  // Mettre à jour un risque
  async update(req, res) {
    try {
      const risque = await Risque.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('responsable', 'nom prenom email')
       .populate('evaluateur', 'nom prenom email');

      if (!risque) {
        return res.status(404).json({
          success: false,
          message: 'Risque non trouvé'
        });
      }

      res.json({
        success: true,
        data: risque,
        message: 'Risque mis à jour avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la mise à jour du risque',
        error: error.message
      });
    }
  }

  // Supprimer un risque
  async delete(req, res) {
    try {
      const risque = await Risque.findByIdAndDelete(req.params.id);

      if (!risque) {
        return res.status(404).json({
          success: false,
          message: 'Risque non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Risque supprimé avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du risque',
        error: error.message
      });
    }
  }

  // Obtenir les risques par niveau
  async getByNiveau(req, res) {
    try {
      const risques = await Risque.find({ niveau: req.params.niveau })
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email')
        .sort({ dateCreation: -1 });

      res.json({
        success: true,
        data: risques,
        message: `Risques de niveau ${req.params.niveau} récupérés avec succès`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des risques',
        error: error.message
      });
    }
  }

  // Obtenir les risques par catégorie
  async getByCategorie(req, res) {
    try {
      const risques = await Risque.find({ categorie: req.params.categorie })
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email')
        .sort({ niveau: -1, dateCreation: -1 });

      res.json({
        success: true,
        data: risques,
        message: `Risques de catégorie ${req.params.categorie} récupérés avec succès`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des risques',
        error: error.message
      });
    }
  }

  // Obtenir la matrice des risques
  async getMatrice(req, res) {
    try {
      const risques = await Risque.find()
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email');

      // Grouper les risques par probabilité et impact
      const matrice = {
        'faible': { 'faible': [], 'moyen': [], 'eleve': [] },
        'moyen': { 'faible': [], 'moyen': [], 'eleve': [] },
        'eleve': { 'faible': [], 'moyen': [], 'eleve': [] }
      };

      risques.forEach(risque => {
        if (matrice[risque.probabilite] && matrice[risque.probabilite][risque.impact]) {
          matrice[risque.probabilite][risque.impact].push(risque);
        }
      });

      res.json({
        success: true,
        data: matrice,
        message: 'Matrice des risques récupérée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la matrice des risques',
        error: error.message
      });
    }
  }

  // Exporter les risques
  async export(req, res) {
    try {
      const format = req.query.format || 'excel';
      const risques = await Risque.find()
        .populate('responsable', 'nom prenom email')
        .populate('evaluateur', 'nom prenom email');

      // Ici vous pouvez implémenter l'export selon le format demandé
      // Pour l'instant, on retourne les données en JSON
      res.json({
        success: true,
        data: risques,
        message: 'Export des risques récupéré avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export des risques',
        error: error.message
      });
    }
  }
}

module.exports = new RisqueController();
