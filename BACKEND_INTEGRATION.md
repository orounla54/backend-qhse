# Guide d'Intégration Backend-Frontend QHSE

## 📋 Résumé des Modifications

Ce document décrit les modifications apportées au backend pour assurer la compatibilité avec le frontend React TypeScript.

## 🔧 Routes API Mises à Jour

### 1. Routes d'Authentification (/api/auth)
- ✅ `POST /api/auth/register` - Inscription
- ✅ `POST /api/auth/login` - Connexion
- ✅ `POST /api/auth/logout` - Déconnexion
- ✅ `POST /api/auth/refresh` - Rafraîchir le token
- ✅ `GET /api/auth/me` - Profil utilisateur
- ✅ `PUT /api/auth/profile` - Mise à jour du profil
- ✅ `PUT /api/auth/change-password` - Changement de mot de passe

### 2. Routes des Audits (/api/qhse/audits)
- ✅ `GET /api/qhse/audits` - Liste des audits (avec pagination)
- ✅ `GET /api/qhse/audits/:id` - Détails d'un audit
- ✅ `POST /api/qhse/audits` - Créer un audit (génération auto du numéro)
- ✅ `PUT /api/qhse/audits/:id` - Mettre à jour un audit
- ✅ `DELETE /api/qhse/audits/:id` - Supprimer un audit (archivage)
- ✅ `GET /api/qhse/audits/statut/:statut` - Audits par statut
- ✅ `GET /api/qhse/audits/type/:type` - Audits par type

### 3. Routes des Incidents (/api/qhse/incidents)
- ✅ `GET /api/qhse/incidents` - Liste des incidents
- ✅ `GET /api/qhse/incidents/:id` - Détails d'un incident
- ✅ `POST /api/qhse/incidents` - Créer un incident (génération auto du numéro)
- ✅ `PUT /api/qhse/incidents/:id` - Mettre à jour un incident
- ✅ `DELETE /api/qhse/incidents/:id` - Supprimer un incident
- ✅ `GET /api/qhse/incidents/gravite/:gravite` - Incidents par gravité
- ✅ `GET /api/qhse/incidents/type/:type` - Incidents par type

### 4. Routes des Risques (/api/qhse/risques)
- ✅ `GET /api/qhse/risques` - Liste des risques
- ✅ `GET /api/qhse/risques/:id` - Détails d'un risque
- ✅ `POST /api/qhse/risques` - Créer un risque
- ✅ `PUT /api/qhse/risques/:id` - Mettre à jour un risque
- ✅ `DELETE /api/qhse/risques/:id` - Supprimer un risque
- ✅ `GET /api/qhse/risques/niveau/:niveau` - Risques par niveau
- ✅ `GET /api/qhse/risques/categorie/:categorie` - Risques par catégorie
- ✅ `GET /api/qhse/risques/matrice` - Matrice des risques

### 5. Routes des Formations (/api/qhse/formations)
- ✅ `GET /api/qhse/formations` - Liste des formations
- ✅ `GET /api/qhse/formations/:id` - Détails d'une formation
- ✅ `POST /api/qhse/formations` - Créer une formation
- ✅ `PUT /api/qhse/formations/:id` - Mettre à jour une formation
- ✅ `DELETE /api/qhse/formations/:id` - Supprimer une formation
- ✅ `GET /api/qhse/formations/expirantes` - Formations expirantes
- ✅ `GET /api/qhse/formations/type/:type` - Formations par type
- ✅ `GET /api/qhse/formations/categorie/:categorie` - Formations par catégorie

### 6. Routes de Conformité (/api/qhse/conformites)
- ✅ `GET /api/qhse/conformites` - Liste des conformités
- ✅ `GET /api/qhse/conformites/:id` - Détails d'une conformité
- ✅ `POST /api/qhse/conformites` - Créer une conformité
- ✅ `PUT /api/qhse/conformites/:id` - Mettre à jour une conformité
- ✅ `DELETE /api/qhse/conformites/:id` - Supprimer une conformité
- ✅ `GET /api/qhse/conformites/expirantes` - Conformités expirantes
- ✅ `GET /api/qhse/conformites/non-conformes` - Non-conformités
- ✅ `GET /api/qhse/conformites/type/:type` - Conformités par type
- ✅ `GET /api/qhse/conformites/domaine/:domaine` - Conformités par domaine

### 7. Routes de Statistiques (/api/qhse/stats)
- ✅ `GET /api/qhse/stats` - Statistiques générales (compatible avec le dashboard)
- ✅ `GET /api/qhse/stats/etendues` - Statistiques étendues
- ✅ `GET /api/qhse/stats/periode` - Statistiques par période

### 8. Routes des Actions Correctives (/api/qhse/actions-correctives)
- ✅ `GET /api/qhse/actions-correctives` - Liste des actions correctives
- ✅ `GET /api/qhse/actions-correctives/statut/:statut` - Actions par statut
- ✅ `GET /api/qhse/actions-correctives/retard` - Actions en retard
- ✅ `PUT /api/qhse/actions-correctives/:incidentId/:actionId` - Mettre à jour une action
- ✅ `PUT /api/qhse/actions-correctives/:id` - Mettre à jour une action (route simplifiée)

### 9. Routes d'Export (/api/qhse/exports)
- ✅ `GET /api/qhse/exports/audits` - Exporter les audits (en développement)
- ✅ `GET /api/qhse/exports/incidents` - Exporter les incidents (en développement)
- ✅ `GET /api/qhse/exports/risques` - Exporter les risques (en développement)
- ✅ `GET /api/qhse/exports/formations` - Exporter les formations (en développement)
- ✅ `GET /api/qhse/exports/conformites` - Exporter les conformités (en développement)
- ✅ `GET /api/qhse/exports/rapport-complet` - Exporter le rapport complet (en développement)

### 10. Routes de Notifications (/api/qhse/notifications)
- ✅ `GET /api/qhse/notifications` - Liste des notifications
- ✅ `PUT /api/qhse/notifications/:id/lue` - Marquer comme lue
- ✅ `PUT /api/qhse/notifications/toutes-lues` - Marquer toutes comme lues
- ✅ `POST /api/qhse/notifications/config` - Configurer les alertes

### 11. Routes de Configuration (/api/qhse/config)
- ✅ `GET /api/qhse/config` - Obtenir la configuration
- ✅ `PUT /api/qhse/config` - Mettre à jour la configuration
- ✅ `GET /api/qhse/config/parametres` - Obtenir les paramètres
- ✅ `PUT /api/qhse/config/parametres` - Mettre à jour les paramètres

## 🔄 Modifications des Modèles

### Modèle Audit
```javascript
// Priorité alignée avec le frontend
priorite: ['Faible', 'Moyenne', 'Élevée', 'Critique']
```

### Modèle Incident
```javascript
// Types étendus pour correspondre au frontend
type: ['Accident', 'Incident', 'Presqu\'accident', 'Maladie', ...]

// Gravité alignée avec le frontend
gravite: ['Légère', 'Modérée', 'Grave', 'Critique']

// Statuts étendus
statut: [..., 'Clôturé']
```

## 📊 Format des Réponses

### Statistiques Dashboard
```json
{
  "audits": {
    "total": 24,
    "planifies": 8,
    "enCours": 6,
    "termines": 10
  },
  "incidents": {
    "total": 15,
    "critiques": 3,
    "enCours": 7,
    "resolus": 5
  },
  "securite": {
    "score": 87,
    "evolution": 5.2
  },
  "actions": {
    "enRetard": 4,
    "aTraiter": 12
  }
}
```

### Format Standard des Listes
```json
{
  "items": [...],
  "totalPages": 5,
  "currentPage": 1,
  "total": 45
}
```

## 🔧 Fonctionnalités Automatiques

### Génération Automatique des Numéros
- **Audits**: `AUD-2024-001`, `AUD-2024-002`, etc.
- **Incidents**: `INC-2024-001`, `INC-2024-002`, etc.

### Population Automatique
- Tous les objets avec références sont automatiquement populés
- Relations `User` → `{ nom, prenom }`
- Relations complexes préservées

### Gestion des Erreurs
- Codes d'erreur cohérents
- Messages explicites en français
- Validation des données d'entrée

## 🚀 Tests

### Script de Test
```bash
# Lancer les tests
node backend/test-api.js

# Démarrer en mode développement
node backend/start-dev.js
```

### Tests Inclus
- ✅ Connexion au serveur
- ✅ Authentification complète
- ✅ Toutes les routes QHSE
- ✅ Création d'audit
- ✅ Création d'incident

## 📝 Configuration Requise

### Variables d'Environnement
```env
MONGODB_URI=mongodb://localhost:27017/qhse
JWT_SECRET=your_jwt_secret_key_here
PORT=5001
NODE_ENV=development
```

### Démarrage
```bash
# Installation des dépendances
npm install

# Démarrage du serveur
npm start

# ou en mode développement
npm run dev
```

## 🎯 Compatibilité Frontend

Le backend est maintenant **100% compatible** avec les services API du frontend :

1. **Structure des données** : Alignée avec les interfaces TypeScript
2. **Endpoints** : Tous les endpoints requis sont disponibles
3. **Formats de réponse** : Conformes aux attentes du frontend
4. **Gestion des erreurs** : Compatible avec les intercepteurs Axios
5. **Authentification** : JWT avec refresh token

## 🔄 Points d'Attention

### Fonctionnalités en Développement
- **Exports** : Les routes retournent des réponses simulées
- **Notifications** : Données d'exemple pour le moment
- **Rapports** : Génération à implémenter

### Prochaines Étapes
1. Implémenter la génération réelle des exports
2. Système de notifications en temps réel
3. Calculs avancés des statistiques
4. Interface d'administration

## 📞 Support

Pour toute question sur l'intégration backend-frontend :
1. Vérifier les logs du serveur
2. Utiliser le script de test pour diagnostiquer
3. Consulter la documentation des modèles

---

**Status**: ✅ Backend prêt pour l'intégration frontend
