const express = require('express');
const router = express.Router();

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

// Stockage en mémoire des notifications (à remplacer par une base de données)
let notifications = [];
let notificationIdCounter = 1;

// Récupérer toutes les notifications
router.get('/', authenticateToken, (req, res) => {
  try {
    const { module, type, read } = req.query;
    
    let filteredNotifications = [...notifications];
    
    // Filtrer par module
    if (module) {
      filteredNotifications = filteredNotifications.filter(n => n.module === module);
    }
    
    // Filtrer par type
    if (type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }
    
    // Filtrer par statut de lecture
    if (read !== undefined) {
      const isRead = read === 'true';
      filteredNotifications = filteredNotifications.filter(n => n.read === isRead);
    }
    
    res.json({
      notifications: filteredNotifications,
      total: filteredNotifications.length,
      unread: filteredNotifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer une notification par ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const notification = notifications.find(n => n.id === id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Erreur lors de la récupération de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Marquer une notification comme lue
router.post('/:id/read', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const notificationIndex = notifications.findIndex(n => n.id === id);
    
    if (notificationIndex === -1) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    notifications[notificationIndex].read = true;
    notifications[notificationIndex].readAt = new Date().toISOString();
    
    res.json({ 
      message: 'Notification marquée comme lue',
      notification: notifications[notificationIndex]
    });
  } catch (error) {
    console.error('Erreur lors du marquage de la notification comme lue:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Marquer toutes les notifications comme lues
router.post('/read-all', authenticateToken, (req, res) => {
  try {
    const updatedCount = notifications.filter(n => !n.read).length;
    
    notifications = notifications.map(n => ({
      ...n,
      read: true,
      readAt: new Date().toISOString()
    }));
    
    res.json({ 
      message: `${updatedCount} notifications marquées comme lues`,
      updatedCount
    });
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer une notification
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const notificationIndex = notifications.findIndex(n => n.id === id);
    
    if (notificationIndex === -1) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    const deletedNotification = notifications.splice(notificationIndex, 1)[0];
    
    res.json({ 
      message: 'Notification supprimée',
      notification: deletedNotification
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer toutes les notifications lues
router.delete('/read', authenticateToken, (req, res) => {
  try {
    const initialCount = notifications.length;
    notifications = notifications.filter(n => !n.read);
    const deletedCount = initialCount - notifications.length;
    
    res.json({ 
      message: `${deletedCount} notifications supprimées`,
      deletedCount
    });
  } catch (error) {
    console.error('Erreur lors de la suppression des notifications lues:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer une nouvelle notification (pour les tests)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { type, title, message, module, priority = 'medium', action, link } = req.body;
    
    if (!type || !title || !message) {
      return res.status(400).json({ message: 'Type, titre et message requis' });
    }
    
    const notification = {
      id: `notif_${notificationIdCounter++}`,
      type,
      title,
      message,
      module: module || 'general',
      priority,
      action,
      link,
      timestamp: new Date().toISOString(),
      read: false,
      createdAt: new Date().toISOString()
    };
    
    notifications.push(notification);
    
    res.status(201).json({
      message: 'Notification créée',
      notification
    });
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Générer des notifications de test basées sur les données du dashboard
router.post('/generate-test', authenticateToken, async (req, res) => {
  try {
    // Simuler la récupération des données du dashboard
    const dashboardData = {
      laboratoire: {
        echantillons: {
          total: 156,
          enAttente: 15,
          enCours: 45,
          termines: 96,
          conformes: 78,
          nonConformes: 18
        },
        analyses: {
          total: 89,
          planifiees: 12,
          enCours: 34,
          terminees: 43
        }
      },
      qualite: {
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
        conformite: {
          score: 82,
          evolution: -2.1
        }
      },
      hse: {
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
        epi: {
          total: 120,
          enStock: 95,
          seuilAlerte: 15,
          manquants: 10
        }
      }
    };

    // Générer des notifications basées sur les données
    const testNotifications = [];
    
    // Notification pour échantillons en attente
    if (dashboardData.laboratoire.echantillons.enAttente > 10) {
      testNotifications.push({
        id: `test_${Date.now()}_1`,
        type: 'warning',
        title: 'Échantillons en attente',
        message: `${dashboardData.laboratoire.echantillons.enAttente} échantillons en attente de traitement`,
        module: 'laboratoire',
        priority: 'medium',
        action: 'Voir les échantillons',
        link: 'laboratoire-echantillons',
        timestamp: new Date().toISOString(),
        read: false
      });
    }
    
    // Notification pour non-conformités critiques
    if (dashboardData.qualite.nonConformites.critiques > 0) {
      testNotifications.push({
        id: `test_${Date.now()}_2`,
        type: 'error',
        title: 'Non-conformités critiques',
        message: `${dashboardData.qualite.nonConformites.critiques} non-conformité(s) critique(s) détectée(s)`,
        module: 'qualite',
        priority: 'critical',
        action: 'Voir les NC',
        link: 'qualite-non-conformites',
        timestamp: new Date().toISOString(),
        read: false
      });
    }
    
    // Notification pour incidents critiques
    if (dashboardData.hse.incidents.critiques > 0) {
      testNotifications.push({
        id: `test_${Date.now()}_3`,
        type: 'error',
        title: 'Incident critique',
        message: `${dashboardData.hse.incidents.critiques} incident(s) critique(s) signalé(s)`,
        module: 'hse',
        priority: 'critical',
        action: 'Voir les incidents',
        link: 'hse-incidents',
        timestamp: new Date().toISOString(),
        read: false
      });
    }
    
    // Ajouter les notifications de test
    notifications.push(...testNotifications);
    
    res.json({
      message: `${testNotifications.length} notifications de test générées`,
      notifications: testNotifications
    });
  } catch (error) {
    console.error('Erreur lors de la génération des notifications de test:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
