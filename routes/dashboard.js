const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  // Ici vous pouvez ajouter la logique de vérification du token JWT
  // Pour l'instant, on accepte tous les tokens
  next();
};

// Middleware pour vérifier la connexion à la base de données
const checkDatabaseConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Service temporairement indisponible - Base de données non connectée',
      code: 'DATABASE_UNAVAILABLE'
    });
  }
  next();
};

// Endpoint pour récupérer les données du dashboard principal
router.get('/dashboard', authenticateToken, checkDatabaseConnection, async (req, res) => {
  try {
    // Récupérer les données depuis les différents modules
    const [laboratoireData, qualiteData, hseData] = await Promise.all([
      getLaboratoireStats(),
      getQualiteStats(),
      getHSEData()
    ]);

    res.json({
      laboratoire: laboratoireData,
      qualite: qualiteData,
      hse: hseData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données du dashboard:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Endpoint pour récupérer les données du dashboard laboratoire
router.get('/dashboard/laboratoire', authenticateToken, async (req, res) => {
  try {
    const laboratoireData = await getLaboratoireStats();
    res.json(laboratoireData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données du laboratoire:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Endpoint pour récupérer les données du dashboard qualité
router.get('/dashboard/qualite', authenticateToken, async (req, res) => {
  try {
    const qualiteData = await getQualiteStats();
    res.json(qualiteData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données de qualité:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Endpoint pour récupérer les données du dashboard HSE
router.get('/dashboard/hse', authenticateToken, async (req, res) => {
  try {
    const hseData = await getHSEData();
    res.json(hseData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données HSE:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Fonction pour récupérer les statistiques du laboratoire
async function getLaboratoireStats() {
  // Ici vous pouvez récupérer les données depuis votre base de données
  // Pour l'instant, on retourne des données simulées basées sur des calculs
  return {
    echantillons: {
      total: 156,
      enAttente: 23,
      enCours: 45,
      termines: 88,
      conformes: 78,
      nonConformes: 10
    },
    analyses: {
      total: 89,
      planifiees: 12,
      enCours: 34,
      terminees: 43
    },
    plansControle: {
      total: 15,
      actifs: 12,
      enAttente: 3
    }
  };
}

// Fonction pour récupérer les statistiques de qualité
async function getQualiteStats() {
  return {
    matieresPremieres: {
      total: 234,
      conformes: 198,
      nonConformes: 12,
      enAttente: 24
    },
    controlesQualite: {
      total: 67,
      planifies: 8,
      enCours: 23,
      termines: 36
    },
    nonConformites: {
      total: 15,
      critiques: 2,
      elevees: 4,
      moderees: 6,
      faibles: 3
    },
    decisionsQualite: {
      total: 45,
      enAttente: 8,
      validees: 32,
      rejetees: 5
    },
    audits: {
      total: 12,
      planifies: 3,
      enCours: 2,
      termines: 7
    },
    conformite: {
      score: 87,
      evolution: 5.2
    }
  };
}

// Fonction pour récupérer les données HSE
async function getHSEData() {
  return {
    hygiene: {
      total: 45,
      conformes: 38,
      nonConformes: 4,
      enAttente: 3
    },
    epi: {
      total: 120,
      enStock: 95,
      seuilAlerte: 15,
      manquants: 10
    },
    produitsChimiques: {
      total: 85,
      enStock: 72,
      seuilAlerte: 8,
      manquants: 5
    },
    incidents: {
      total: 8,
      critiques: 1,
      eleves: 2,
      moderes: 3,
      faibles: 2
    },
    risques: {
      total: 25,
      tresEleves: 3,
      eleves: 5,
      moderes: 10,
      faibles: 7
    },
    formations: {
      total: 28,
      planifiees: 5,
      enCours: 8,
      terminees: 15
    }
  };
}

// Endpoint pour récupérer les activités récentes
router.get('/activities/recent', authenticateToken, async (req, res) => {
  try {
    const activities = await getRecentActivities();
    res.json({ activities });
  } catch (error) {
    console.error('Erreur lors de la récupération des activités récentes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Fonction pour récupérer les activités récentes
async function getRecentActivities() {
  // Ici vous pouvez récupérer les activités depuis votre base de données
  // Pour l'instant, on retourne des données simulées
  return [
    {
      id: '1',
      type: 'laboratoire',
      module: 'Échantillons',
      action: 'Nouvel échantillon reçu',
      description: 'Échantillon #ECH-2024-001 - Tomate',
      date: new Date().toISOString(),
      statut: 'En attente',
      priorite: 'haute'
    },
    {
      id: '2',
      type: 'qualite',
      module: 'Non-Conformités',
      action: 'Non-conformité détectée',
      description: 'NC-2024-003 - Contrôle qualité échoué',
      date: new Date(Date.now() - 3600000).toISOString(), // 1 heure ago
      statut: 'En investigation',
      priorite: 'haute'
    },
    {
      id: '3',
      type: 'hse',
      module: 'Incidents',
      action: 'Incident signalé',
      description: 'INC-2024-005 - Chute mineure',
      date: new Date(Date.now() - 7200000).toISOString(), // 2 heures ago
      statut: 'En cours',
      priorite: 'moyenne'
    },
    {
      id: '4',
      type: 'qualite',
      module: 'Audits',
      action: 'Audit planifié',
      description: 'AUD-2024-002 - Audit qualité mensuel',
      date: new Date(Date.now() - 86400000).toISOString(), // 1 jour ago
      statut: 'Planifié',
      priorite: 'moyenne'
    },
    {
      id: '5',
      type: 'hse',
      module: 'Formations',
      action: 'Formation terminée',
      description: 'Formation sécurité - 15 participants',
      date: new Date(Date.now() - 172800000).toISOString(), // 2 jours ago
      statut: 'Terminée',
      priorite: 'basse'
    }
  ];
}

module.exports = router;
