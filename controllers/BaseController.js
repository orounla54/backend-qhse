/**
 * Contrôleur de base avec méthodes communes
 */
class BaseController {
  constructor(model, modelName) {
    this.model = model;
    this.modelName = modelName;
  }

  /**
   * Obtenir tous les éléments avec pagination et filtres
   */
  async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...filters 
      } = req.query;

      // Construction du filtre
      const filter = { isArchived: false };
      
      // Filtres spécifiques
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '') {
          filter[key] = filters[key];
        }
      });

      // Recherche textuelle
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        filter.$or = this.getSearchFields().map(field => ({
          [field]: searchRegex
        }));
      }

      // Configuration du tri
      const sortConfig = {};
      sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Exécution de la requête
      const items = await this.model.find(filter)
        .populate(this.getPopulateFields())
        .sort(sortConfig)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await this.model.countDocuments(filter);

      res.json({
        [this.getCollectionName()]: items,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération des ${this.modelName}:`, error);
      res.status(500).json({ 
        message: `Erreur serveur lors de la récupération des ${this.modelName}`, 
        error: error.message 
      });
    }
  }

  /**
   * Obtenir un élément par ID
   */
  async getById(req, res) {
    try {
      const item = await this.model.findById(req.params.id)
        .populate(this.getPopulateFields());

      if (!item) {
        return res.status(404).json({ 
          message: `${this.modelName} non trouvé` 
        });
      }

      res.json(item);
    } catch (error) {
      console.error(`Erreur lors de la récupération du ${this.modelName}:`, error);
      res.status(500).json({ 
        message: `Erreur serveur lors de la récupération du ${this.modelName}`, 
        error: error.message 
      });
    }
  }

  /**
   * Créer un nouvel élément
   */
  async create(req, res) {
    try {
      const itemData = {
        ...req.body,
        createdBy: req.user.id
      };

      const item = new this.model(itemData);
      await item.save();

      const populatedItem = await this.model.findById(item._id)
        .populate(this.getPopulateFields());

      res.status(201).json(populatedItem);
    } catch (error) {
      console.error(`Erreur lors de la création du ${this.modelName}:`, error);
      res.status(400).json({ 
        message: `Données invalides pour le ${this.modelName}`, 
        error: error.message,
        details: error.errors ? Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        })) : null
      });
    }
  }

  /**
   * Mettre à jour un élément
   */
  async update(req, res) {
    try {
      const item = await this.model.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedBy: req.user.id },
        { new: true, runValidators: true }
      ).populate(this.getPopulateFields());

      if (!item) {
        return res.status(404).json({ 
          message: `${this.modelName} non trouvé` 
        });
      }

      res.json(item);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du ${this.modelName}:`, error);
      res.status(400).json({ 
        message: `Données invalides pour le ${this.modelName}`, 
        error: error.message 
      });
    }
  }

  /**
   * Supprimer un élément (archivage)
   */
  async delete(req, res) {
    try {
      const item = await this.model.findByIdAndUpdate(
        req.params.id,
        { isArchived: true, updatedBy: req.user.id },
        { new: true }
      );

      if (!item) {
        return res.status(404).json({ 
          message: `${this.modelName} non trouvé` 
        });
      }

      res.json({ 
        message: `${this.modelName} supprimé avec succès` 
      });
    } catch (error) {
      console.error(`Erreur lors de la suppression du ${this.modelName}:`, error);
      res.status(500).json({ 
        message: `Erreur serveur lors de la suppression du ${this.modelName}`, 
        error: error.message 
      });
    }
  }

  /**
   * Exporter les données
   */
  async export(req, res) {
    try {
      const { format = 'pdf' } = req.query;
      
      // Pour le moment, retourner une réponse simple
      // TODO: Implémenter la génération réelle de fichiers
      res.json({
        message: `Export des ${this.modelName} en format ${format} en cours de développement`,
        format,
        status: 'pending'
      });
    } catch (error) {
      console.error(`Erreur lors de l'export des ${this.modelName}:`, error);
      res.status(500).json({ 
        message: `Erreur serveur lors de l'export des ${this.modelName}`, 
        error: error.message 
      });
    }
  }

  /**
   * Méthodes abstraites à implémenter dans les classes filles
   */
  getSearchFields() {
    return ['numero', 'titre', 'description'];
  }

  getPopulateFields() {
    return ['createdBy', 'updatedBy'];
  }

  getCollectionName() {
    return this.modelName.toLowerCase() + 's';
  }
}

module.exports = BaseController;
