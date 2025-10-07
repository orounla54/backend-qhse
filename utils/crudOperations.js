/**
 * Utilitaires CRUD réutilisables pour toutes les entités
 */

/**
 * Créer une route GET pour lister les entités avec pagination et filtres
 */
const createListRoute = (Model, populateFields = []) => {
  return async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...filters
      } = req.query;
      
      const filter = { isArchived: false };
      
      // Appliquer les filtres dynamiques
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          filter[key] = new RegExp(filters[key], 'i');
        }
      });
      
      // Recherche textuelle
      if (search) {
        filter.$or = [
          { numero: new RegExp(search, 'i') },
          { nom: new RegExp(search, 'i') },
          { titre: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') }
        ];
      }

      // Configuration du tri
      const sortConfig = {};
      sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const query = Model.find(filter);
      
      // Populate les champs spécifiés
      populateFields.forEach(field => {
        query.populate(field);
      });
      
      const items = await query
        .sort(sortConfig)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Model.countDocuments(filter);

      res.json({
        items,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération des ${Model.modelName}:`, error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  };
};

/**
 * Créer une route GET pour obtenir une entité par ID
 */
const createGetByIdRoute = (Model, populateFields = []) => {
  return async (req, res) => {
    try {
      const query = Model.findById(req.params.id);
      
      // Populate les champs spécifiés
      populateFields.forEach(field => {
        query.populate(field);
      });
      
      const item = await query;

      if (!item) {
        return res.status(404).json({ message: `${Model.modelName} non trouvé` });
      }

      res.json(item);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  };
};

/**
 * Créer une route POST pour créer une nouvelle entité
 */
const createCreateRoute = (Model, additionalFields = {}) => {
  return async (req, res) => {
    try {
      const item = new Model({
        ...req.body,
        ...additionalFields,
        createdBy: req.user.id
      });

      await item.save();
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: 'Données invalides', error: error.message });
    }
  };
};

/**
 * Créer une route PUT pour mettre à jour une entité
 */
const createUpdateRoute = (Model) => {
  return async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedBy: req.user.id },
        { new: true, runValidators: true }
      );

      if (!item) {
        return res.status(404).json({ message: `${Model.modelName} non trouvé` });
      }

      res.json(item);
    } catch (error) {
      res.status(400).json({ message: 'Données invalides', error: error.message });
    }
  };
};

/**
 * Créer une route DELETE pour supprimer une entité (archivage)
 */
const createDeleteRoute = (Model) => {
  return async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(
        req.params.id,
        { isArchived: true, updatedBy: req.user.id },
        { new: true }
      );

      if (!item) {
        return res.status(404).json({ message: `${Model.modelName} non trouvé` });
      }

      res.json({ message: `${Model.modelName} supprimé avec succès` });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  };
};

/**
 * Créer toutes les routes CRUD pour une entité
 */
const createCrudRoutes = (Model, options = {}) => {
  const {
    basePath = '',
    populateFields = [],
    additionalCreateFields = {},
    customRoutes = []
  } = options;

  const routes = {};

  // Routes CRUD de base
  routes[`GET ${basePath}`] = createListRoute(Model, populateFields);
  routes[`GET ${basePath}/:id`] = createGetByIdRoute(Model, populateFields);
  routes[`POST ${basePath}`] = createCreateRoute(Model, additionalCreateFields);
  routes[`PUT ${basePath}/:id`] = createUpdateRoute(Model);
  routes[`DELETE ${basePath}/:id`] = createDeleteRoute(Model);

  // Ajouter les routes personnalisées
  customRoutes.forEach(route => {
    routes[`${route.method} ${route.path}`] = route.handler;
  });

  return routes;
};

/**
 * Appliquer les routes CRUD à un router Express
 */
const applyCrudRoutes = (router, Model, options = {}) => {
  const routes = createCrudRoutes(Model, options);
  
  Object.entries(routes).forEach(([routeKey, handler]) => {
    const [method, path] = routeKey.split(' ', 2);
    router[method.toLowerCase()](path, handler);
  });
};

module.exports = {
  createListRoute,
  createGetByIdRoute,
  createCreateRoute,
  createUpdateRoute,
  createDeleteRoute,
  createCrudRoutes,
  applyCrudRoutes
};
