const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { generateToken, generateRefreshToken, auth } = require('../middlewares/auth');
const { getConfig } = require('../config/app');

const router = express.Router();
const config = getConfig();

// Rate limiting pour les tentatives de connexion
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // 5 en production, 100 en développement
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    code: 'TOO_MANY_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting pour l'inscription
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: process.env.NODE_ENV === 'production' ? 3 : 50, // 3 en production, 50 en développement
  message: {
    success: false,
    message: 'Trop de tentatives d\'inscription. Réessayez dans 1 heure.',
    code: 'TOO_MANY_REGISTRATIONS'
  }
});

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', process.env.NODE_ENV === 'production' ? registerLimiter : (req, res, next) => next(), [
  body('nom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('prenom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('entreprise')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom de l\'entreprise est requis'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'responsable_qhse', 'employe'])
    .withMessage('Rôle invalide')
], async (req, res) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { nom, prenom, email, password, entreprise, departement, poste, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà',
        code: 'USER_EXISTS'
      });
    }

    // Créer le nouvel utilisateur
    const newUser = new User({
      nom,
      prenom,
      email,
      password,
      entreprise,
      departement,
      poste,
      role: role || 'employe'
    });

    await newUser.save();

    // Générer les tokens
    const token = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Ajouter le refresh token à l'utilisateur
    newUser.refreshTokens.push({ token: refreshToken });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: {
          id: newUser._id,
          nom: newUser.nom,
          prenom: newUser.prenom,
          email: newUser.email,
          role: newUser.role,
          permissions: newUser.permissions,
          entreprise: newUser.entreprise,
          departement: newUser.departement,
          poste: newUser.poste
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Connexion utilisateur
 * @access  Public
 */
router.post('/login', process.env.NODE_ENV === 'production' ? loginLimiter : (req, res, next) => next(), [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .exists()
    .withMessage('Mot de passe requis')
], async (req, res) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Compte temporairement verrouillé en raison de trop nombreuses tentatives de connexion',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Incrémenter les tentatives de connexion
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Réinitialiser les tentatives de connexion
    await user.resetLoginAttempts();

    // Générer les tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Ajouter le refresh token à l'utilisateur
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          entreprise: user.entreprise,
          departement: user.departement,
          poste: user.poste,
          preferences: user.preferences
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Rafraîchir le token d'accès
 * @access  Public
 */
router.post('/refresh', [
  body('refreshToken')
    .exists()
    .withMessage('Token de rafraîchissement requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Token de rafraîchissement requis',
        errors: errors.array()
      });
    }

    const { refreshToken } = req.body;

    // Vérifier le token de rafraîchissement
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.secret);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Token de rafraîchissement invalide',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Trouver l'utilisateur et vérifier que le token existe
    const user = await User.findById(decoded.id);
    
    if (!user || !user.refreshTokens.some(rt => rt.token === refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Token de rafraîchissement invalide',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Générer un nouveau token d'accès
    const newToken = generateToken(user);

    res.json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: {
        token: newToken
      }
    });

  } catch (error) {
    console.error('Erreur lors du rafraîchissement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du rafraîchissement',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion utilisateur
 * @access  Private
 */
router.post('/logout', auth, [
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('Token de rafraîchissement invalide')
], async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    // Supprimer le refresh token spécifique ou tous les tokens
    if (refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    } else {
      user.refreshTokens = [];
    }

    await user.save();

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la déconnexion',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Obtenir les informations de l'utilisateur connecté
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    // Vérifier la connexion à la base de données
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Service temporairement indisponible - Base de données non connectée',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          entreprise: user.entreprise,
          departement: user.departement,
          poste: user.poste,
          preferences: user.preferences,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du profil',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Mettre à jour le profil utilisateur
 * @access  Private
 */
router.put('/profile', auth, [
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('prenom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('departement')
    .optional()
    .trim(),
  body('poste')
    .optional()
    .trim(),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Thème invalide'),
  body('preferences.language')
    .optional()
    .isIn(['fr', 'en'])
    .withMessage('Langue invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    // Mettre à jour les champs autorisés
    const { nom, prenom, departement, poste, preferences } = req.body;
    
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (departement) user.departement = departement;
    if (poste) user.poste = poste;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        user: {
          id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          entreprise: user.entreprise,
          departement: user.departement,
          poste: user.poste,
          preferences: user.preferences
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du profil',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Changer le mot de passe
 * @access  Private
 */
router.put('/change-password', auth, [
  body('currentPassword')
    .exists()
    .withMessage('Mot de passe actuel requis'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    // Révoquer tous les refresh tokens pour forcer une nouvelle connexion
    user.refreshTokens = [];
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du changement de mot de passe',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
