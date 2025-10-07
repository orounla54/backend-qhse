const express = require('express');
const router = express.Router();
const Hygiene = require('../models/Hygiene');

// ==================== ROUTES HYGIÈNE SANS AUTHENTIFICATION ====================

// GET /api/hygiene - Obtenir tous les contrôles d'hygiène
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type, zone } = req.query;
    
    const filter = {};
    if (statut) filter.statut = statut;
    if (type) filter.type = type;
    if (zone) filter['zone.nom'] = new RegExp(zone, 'i');

    const hygiene = await Hygiene.find(filter)
      .sort({ dateCreation: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Hygiene.countDocuments(filter);

    res.json({
      hygiene,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des contrôles d\'hygiène:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

// GET /api/hygiene/:id - Obtenir un contrôle d'hygiène par ID
router.get('/:id', async (req, res) => {
  try {
    const hygiene = await Hygiene.findById(req.params.id);

    if (!hygiene) {
      return res.status(404).json({ 
        success: false,
        message: 'Contrôle d\'hygiène non trouvé' 
      });
    }

    res.json({
      success: true,
      data: hygiene
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du contrôle d\'hygiène:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

// POST /api/hygiene - Créer un nouveau contrôle d'hygiène
router.post('/', async (req, res) => {
  try {
    const hygieneData = req.body;
    
    // Validation des données requises
    if (!hygieneData.titre || !hygieneData.description || !hygieneData.type || !hygieneData.datePlanification) {
      return res.status(400).json({
        success: false,
        message: 'Les champs titre, description, type et date de planification sont obligatoires'
      });
    }

    // Filtrage des points de contrôle vides
    if (hygieneData.pointsControle && hygieneData.pointsControle.length > 0) {
      hygieneData.pointsControle = hygieneData.pointsControle.filter(point => 
        point.nom && point.nom.trim() !== ''
      );
    }

    // Filtrage des actions vides
    if (hygieneData.actions && hygieneData.actions.length > 0) {
      hygieneData.actions = hygieneData.actions.filter(action => 
        action.description && action.description.trim() !== '' &&
        action.responsable && action.responsable.trim() !== '' &&
        action.echeance
      );
    }

    const hygiene = new Hygiene(hygieneData);
    await hygiene.save();

    res.status(201).json({
      success: true,
      message: 'Contrôle d\'hygiène créé avec succès',
      data: hygiene
    });

  } catch (error) {
    console.error('Erreur lors de la création du contrôle d\'hygiène:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un contrôle d\'hygiène avec ce numéro existe déjà'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

// PUT /api/hygiene/:id - Mettre à jour un contrôle d'hygiène
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const hygiene = await Hygiene.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!hygiene) {
      return res.status(404).json({
        success: false,
        message: 'Contrôle d\'hygiène non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contrôle d\'hygiène mis à jour avec succès',
      data: hygiene
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du contrôle d\'hygiène:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

// DELETE /api/hygiene/:id - Supprimer un contrôle d'hygiène
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const hygiene = await Hygiene.findByIdAndDelete(id);

    if (!hygiene) {
      return res.status(404).json({
        success: false,
        message: 'Contrôle d\'hygiène non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contrôle d\'hygiène supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du contrôle d\'hygiène:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

module.exports = router;
