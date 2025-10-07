const jwt = require('jsonwebtoken');
const { getConfig } = require('../config/app');

// Configuration JWT
const config = getConfig();

/**
 * Middleware d'authentification JWT
 * Vérifie la présence et la validité du token JWT
 */
const auth = async (req, res, next) => {
  try {
    // Récupération du token depuis le header Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès manquant',
        code: 'MISSING_TOKEN'
      });
    }

    // Extraction du token (suppression du préfixe "Bearer ")
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès invalide',
        code: 'INVALID_TOKEN'
      });
    }

    try {
      // Vérification et décodage du token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Ajout des informations utilisateur à la requête
      req.user = {
        id: decoded.id,
        email: decoded.email,
        nom: decoded.nom,
        prenom: decoded.prenom,
        role: decoded.role,
        permissions: decoded.permissions || [],
        entreprise: decoded.entreprise
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token d\'accès expiré',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token d\'accès invalide',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Erreur d\'authentification',
          code: 'AUTH_ERROR'
        });
      }
    }
  } catch (error) {
    console.error('Erreur middleware auth:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'authentification',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Middleware de vérification des permissions
 * Vérifie si l'utilisateur a les permissions nécessaires
 */
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // Vérification des permissions
      const userPermissions = req.user.permissions || [];
      
      if (!userPermissions.includes(requiredPermission) && !userPermissions.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: requiredPermission,
          userPermissions: userPermissions
        });
      }

      next();
    } catch (error) {
      console.error('Erreur middleware checkPermission:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la vérification des permissions',
        code: 'SERVER_ERROR'
      });
    }
  };
};

/**
 * Middleware de vérification des rôles
 * Vérifie si l'utilisateur a le rôle requis
 */
const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // Conversion en tableau si ce n'est pas déjà le cas
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Rôle insuffisant',
          code: 'INSUFFICIENT_ROLE',
          required: roles,
          userRole: req.user.role
        });
      }

      next();
    } catch (error) {
      console.error('Erreur middleware checkRole:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la vérification du rôle',
        code: 'SERVER_ERROR'
      });
    }
  };
};

/**
 * Middleware de vérification de propriétaire
 * Vérifie si l'utilisateur est le propriétaire de la ressource
 */
const checkOwnership = (model, field = 'createdBy') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const resourceId = req.params.id;
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'ID de ressource manquant',
          code: 'MISSING_RESOURCE_ID'
        });
      }

      // Recherche de la ressource
      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Ressource non trouvée',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // Vérification de la propriété
      const isOwner = resource[field] && resource[field].toString() === req.user.id;
      const isAdmin = req.user.permissions && req.user.permissions.includes('admin');

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette ressource',
          code: 'UNAUTHORIZED_ACCESS'
        });
      }

      // Ajout de la ressource à la requête pour utilisation ultérieure
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Erreur middleware checkOwnership:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la vérification de propriété',
        code: 'SERVER_ERROR'
      });
    }
  };
};

/**
 * Middleware de vérification d'entreprise
 * Vérifie si l'utilisateur appartient à la même entreprise
 */
const checkCompany = (model, field = 'entreprise') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const resourceId = req.params.id;
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'ID de ressource manquant',
          code: 'MISSING_RESOURCE_ID'
        });
      }

      // Recherche de la ressource
      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Ressource non trouvée',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // Vérification de l'entreprise
      const resourceCompany = resource[field] && resource[field].toString();
      const userCompany = req.user.entreprise && req.user.entreprise.toString();

      if (resourceCompany && userCompany && resourceCompany !== userCompany) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette ressource',
          code: 'UNAUTHORIZED_ACCESS'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Erreur middleware checkCompany:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la vérification d\'entreprise',
        code: 'SERVER_ERROR'
      });
    }
  };
};

/**
 * Middleware de génération de token
 * Génère un nouveau token JWT
 */
const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role,
    permissions: user.permissions || [],
    entreprise: user.entreprise
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

/**
 * Middleware de génération de token de rafraîchissement
 * Génère un token de rafraîchissement
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user._id,
    type: 'refresh'
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn
  });
};

module.exports = {
  auth,
  checkPermission,
  checkRole,
  checkOwnership,
  checkCompany,
  generateToken,
  generateRefreshToken
}; 