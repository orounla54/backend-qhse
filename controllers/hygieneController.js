const Hygiene = require('../models/Hygiene');

// Créer un nouveau contrôle d'hygiène
const createHygiene = async (req, res) => {
  try {
    const hygieneData = req.body;
    
    // Validation des données requises
    if (!hygieneData.titre || !hygieneData.description || !hygieneData.type || !hygieneData.datePlanification) {
      return res.status(400).json({
        success: false,
        message: 'Les champs titre, description, type et date de planification sont obligatoires'
      });
    }

    // Validation des points de contrôle
    if (hygieneData.pointsControle && hygieneData.pointsControle.length > 0) {
      for (const point of hygieneData.pointsControle) {
        if (!point.nom) {
          return res.status(400).json({
            success: false,
            message: 'Le nom de chaque point de contrôle est obligatoire'
          });
        }
      }
    }

    // Validation des actions
    if (hygieneData.actions && hygieneData.actions.length > 0) {
      for (const action of hygieneData.actions) {
        if (!action.description || !action.responsable || !action.echeance) {
          return res.status(400).json({
            success: false,
            message: 'La description, le responsable et l\'échéance de chaque action sont obligatoires'
          });
        }
      }
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
};

// Récupérer tous les contrôles d'hygiène
const getAllHygiene = async (req, res) => {
  try {
    const hygiene = await Hygiene.find().sort({ dateCreation: -1 });
    
    res.status(200).json({
      success: true,
      data: hygiene
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des contrôles d\'hygiène:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
};

// Récupérer un contrôle d'hygiène par ID
const getHygieneById = async (req, res) => {
  try {
    const { id } = req.params;
    const hygiene = await Hygiene.findById(id);

    if (!hygiene) {
      return res.status(404).json({
        success: false,
        message: 'Contrôle d\'hygiène non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: hygiene
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du contrôle d\'hygiène:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
};

// Mettre à jour un contrôle d'hygiène
const updateHygiene = async (req, res) => {
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
};

// Supprimer un contrôle d'hygiène
const deleteHygiene = async (req, res) => {
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
};

module.exports = {
  createHygiene,
  getAllHygiene,
  getHygieneById,
  updateHygiene,
  deleteHygiene
};
