const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware de validation des résultats
 * Vérifie les erreurs de validation et retourne une réponse d'erreur si nécessaire
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données de validation invalides',
      code: 'VALIDATION_ERROR',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

/**
 * Règles de validation pour les audits
 */
const auditValidationRules = {
  create: [
    body('numero')
      .notEmpty()
      .withMessage('Le numéro d\'audit est requis')
      .isString()
      .withMessage('Le numéro doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Le numéro doit contenir entre 3 et 20 caractères'),
    
    body('titre')
      .notEmpty()
      .withMessage('Le titre est requis')
      .isString()
      .withMessage('Le titre doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Le titre doit contenir entre 5 et 200 caractères'),
    
    body('description')
      .notEmpty()
      .withMessage('La description est requise')
      .isString()
      .withMessage('La description doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('La description doit contenir entre 10 et 1000 caractères'),
    
    body('type')
      .notEmpty()
      .withMessage('Le type d\'audit est requis')
      .isIn(['Interne', 'Externe', 'Certification', 'Surveillance', 'Suivi'])
      .withMessage('Type d\'audit invalide'),
    
    body('domaine')
      .notEmpty()
      .withMessage('Le domaine est requis')
      .isIn(['Qualité', 'Sécurité', 'Environnement', 'Hygiène', 'Mixte'])
      .withMessage('Domaine invalide'),
    
    body('datePlanification')
      .notEmpty()
      .withMessage('La date de planification est requise')
      .isISO8601()
      .withMessage('Format de date invalide'),
    
    body('dureeEstimee')
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage('La durée estimée doit être entre 1 et 168 heures'),
    
    body('priorite')
      .optional()
      .isIn(['Basse', 'Normale', 'Haute', 'Critique'])
      .withMessage('Priorité invalide')
  ],
  
  update: [
    param('id')
      .isMongoId()
      .withMessage('ID d\'audit invalide'),
    
    body('numero')
      .optional()
      .isString()
      .withMessage('Le numéro doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Le numéro doit contenir entre 3 et 20 caractères'),
    
    body('titre')
      .optional()
      .isString()
      .withMessage('Le titre doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Le titre doit contenir entre 5 et 200 caractères'),
    
    body('type')
      .optional()
      .isIn(['Interne', 'Externe', 'Certification', 'Surveillance', 'Suivi'])
      .withMessage('Type d\'audit invalide'),
    
    body('statut')
      .optional()
      .isIn(['Planifié', 'En cours', 'Terminé', 'Annulé', 'Reporté'])
      .withMessage('Statut invalide')
  ],
  
  getById: [
    param('id')
      .isMongoId()
      .withMessage('ID d\'audit invalide')
  ]
};

/**
 * Règles de validation pour les incidents
 */
const incidentValidationRules = {
  create: [
    body('numero')
      .notEmpty()
      .withMessage('Le numéro d\'incident est requis')
      .isString()
      .withMessage('Le numéro doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Le numéro doit contenir entre 3 et 20 caractères'),
    
    body('titre')
      .notEmpty()
      .withMessage('Le titre est requis')
      .isString()
      .withMessage('Le titre doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Le titre doit contenir entre 5 et 200 caractères'),
    
    body('description')
      .notEmpty()
      .withMessage('La description est requise')
      .isString()
      .withMessage('La description doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('La description doit contenir entre 10 et 1000 caractères'),
    
    body('type')
      .notEmpty()
      .withMessage('Le type d\'incident est requis')
      .isIn(['Accident', 'Incident', 'Presqu\'accident', 'Maladie'])
      .withMessage('Type d\'incident invalide'),
    
    body('gravite')
      .notEmpty()
      .withMessage('La gravité est requise')
      .isIn(['Légère', 'Modérée', 'Grave', 'Critique'])
      .withMessage('Gravité invalide'),
    
    body('dateIncident')
      .notEmpty()
      .withMessage('La date d\'incident est requise')
      .isISO8601()
      .withMessage('Format de date invalide'),
    
    body('localisation.zone')
      .notEmpty()
      .withMessage('La zone de localisation est requise')
      .isString()
      .withMessage('La zone doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('La zone doit contenir entre 2 et 100 caractères')
  ],
  
  update: [
    param('id')
      .isMongoId()
      .withMessage('ID d\'incident invalide'),
    
    body('statut')
      .optional()
      .isIn(['Déclaré', 'En cours d\'investigation', 'En cours de traitement', 'Résolu', 'Clôturé'])
      .withMessage('Statut invalide'),
    
    body('gravite')
      .optional()
      .isIn(['Légère', 'Modérée', 'Grave', 'Critique'])
      .withMessage('Gravité invalide')
  ]
};

/**
 * Règles de validation pour les risques
 */
const risqueValidationRules = {
  create: [
    body('numero')
      .notEmpty()
      .withMessage('Le numéro de risque est requis')
      .isString()
      .withMessage('Le numéro doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Le numéro doit contenir entre 3 et 20 caractères'),
    
    body('titre')
      .notEmpty()
      .withMessage('Le titre est requis')
      .isString()
      .withMessage('Le titre doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Le titre doit contenir entre 5 et 200 caractères'),
    
    body('type')
      .notEmpty()
      .withMessage('Le type de risque est requis')
      .isIn(['Sécurité', 'Qualité', 'Environnement', 'Hygiène', 'Santé', 'Mixte'])
      .withMessage('Type de risque invalide'),
    
    body('categorie')
      .notEmpty()
      .withMessage('La catégorie est requise')
      .isIn(['Risque chimique', 'Risque biologique', 'Risque physique', 'Risque ergonomique', 'Risque psychosocial', 'Risque environnemental', 'Autre'])
      .withMessage('Catégorie invalide'),
    
    body('probabilite')
      .notEmpty()
      .withMessage('La probabilité est requise')
      .isIn(['Très faible', 'Faible', 'Modérée', 'Élevée', 'Très élevée'])
      .withMessage('Probabilité invalide'),
    
    body('gravite')
      .notEmpty()
      .withMessage('La gravité est requise')
      .isIn(['Négligeable', 'Faible', 'Modérée', 'Élevée', 'Critique'])
      .withMessage('Gravité invalide'),
    
    body('activite')
      .notEmpty()
      .withMessage('L\'activité est requise')
      .isString()
      .withMessage('L\'activité doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('L\'activité doit contenir entre 3 et 200 caractères')
  ],
  
  update: [
    param('id')
      .isMongoId()
      .withMessage('ID de risque invalide'),
    
    body('statut')
      .optional()
      .isIn(['Actif', 'Maîtrisé', 'En cours de traitement', 'Archivé'])
      .withMessage('Statut invalide')
  ]
};

/**
 * Règles de validation pour les formations
 */
const formationValidationRules = {
  create: [
    body('numero')
      .notEmpty()
      .withMessage('Le numéro de formation est requis')
      .isString()
      .withMessage('Le numéro doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Le numéro doit contenir entre 3 et 20 caractères'),
    
    body('titre')
      .notEmpty()
      .withMessage('Le titre est requis')
      .isString()
      .withMessage('Le titre doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Le titre doit contenir entre 5 et 200 caractères'),
    
    body('type')
      .notEmpty()
      .withMessage('Le type de formation est requis')
      .isIn(['Sécurité', 'Qualité', 'Environnement', 'Hygiène', 'Santé', 'Mixte'])
      .withMessage('Type de formation invalide'),
    
    body('categorie')
      .notEmpty()
      .withMessage('La catégorie est requise')
      .isIn(['Formation initiale', 'Formation continue', 'Recyclage', 'Formation spécifique', 'Sensibilisation'])
      .withMessage('Catégorie invalide'),
    
    body('datePlanification')
      .notEmpty()
      .withMessage('La date de planification est requise')
      .isISO8601()
      .withMessage('Format de date invalide'),
    
    body('duree')
      .notEmpty()
      .withMessage('La durée est requise')
      .isInt({ min: 1, max: 168 })
      .withMessage('La durée doit être entre 1 et 168 heures'),
    
    body('lieu')
      .notEmpty()
      .withMessage('Le lieu est requis')
      .isIn(['Interne', 'Externe', 'Virtuel'])
      .withMessage('Lieu invalide')
  ],
  
  update: [
    param('id')
      .isMongoId()
      .withMessage('ID de formation invalide'),
    
    body('statut')
      .optional()
      .isIn(['Planifiée', 'En cours', 'Terminée', 'Annulée', 'Reportée'])
      .withMessage('Statut invalide')
  ]
};

/**
 * Règles de validation pour les conformités
 */
const conformiteValidationRules = {
  create: [
    body('numero')
      .notEmpty()
      .withMessage('Le numéro de conformité est requis')
      .isString()
      .withMessage('Le numéro doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Le numéro doit contenir entre 3 et 20 caractères'),
    
    body('titre')
      .notEmpty()
      .withMessage('Le titre est requis')
      .isString()
      .withMessage('Le titre doit être une chaîne de caractères')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Le titre doit contenir entre 5 et 200 caractères'),
    
    body('type')
      .notEmpty()
      .withMessage('Le type de conformité est requis')
      .isIn(['Législation', 'Réglementation', 'Norme', 'Certification', 'Accréditation', 'Autorisation'])
      .withMessage('Type de conformité invalide'),
    
    body('domaine')
      .notEmpty()
      .withMessage('Le domaine est requis')
      .isIn(['Sécurité', 'Qualité', 'Environnement', 'Hygiène', 'Santé', 'Mixte'])
      .withMessage('Domaine invalide')
  ],
  
  update: [
    param('id')
      .isMongoId()
      .withMessage('ID de conformité invalide'),
    
    body('statutConformite')
      .optional()
      .isIn(['Conforme', 'Non conforme', 'En cours de mise en conformité', 'Non applicable', 'À évaluer'])
      .withMessage('Statut de conformité invalide'),
    
    body('niveauConformite')
      .optional()
      .isIn(['Exemplaire', 'Bon', 'Acceptable', 'Insuffisant', 'Critique'])
      .withMessage('Niveau de conformité invalide')
  ]
};

/**
 * Règles de validation pour les paramètres de requête
 */
const queryValidationRules = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Le numéro de page doit être un entier positif'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('La limite doit être entre 1 et 100'),
    
    query('periode')
      .optional()
      .isIn(['semaine', 'mois', 'trimestre', 'annee'])
      .withMessage('Période invalide')
  ],
  
  filters: [
    query('statut')
      .optional()
      .isString()
      .withMessage('Le statut doit être une chaîne de caractères'),
    
    query('type')
      .optional()
      .isString()
      .withMessage('Le type doit être une chaîne de caractères'),
    
    query('domaine')
      .optional()
      .isString()
      .withMessage('Le domaine doit être une chaîne de caractères')
  ]
};

/**
 * Règles de validation pour les IDs MongoDB
 */
const idValidationRules = [
  param('id')
    .isMongoId()
    .withMessage('ID invalide')
];

module.exports = {
  validate,
  auditValidationRules,
  incidentValidationRules,
  risqueValidationRules,
  formationValidationRules,
  conformiteValidationRules,
  queryValidationRules,
  idValidationRules
}; 