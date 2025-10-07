# 👤 Gestion des Utilisateurs - Module QHSE

## 🔑 Comptes de Test Disponibles

### 🔴 Administrateur
- **Email**: `admin@trafrule.com`
- **Mot de passe**: `Admin2024!`
- **Rôle**: Administrateur système
- **Permissions**: Accès complet à toutes les fonctionnalités

### 🔵 Responsable QHSE
- **Email**: `arsene.orounla@trafrule.com`
- **Mot de passe**: `QHSE2024!`
- **Rôle**: Responsable QHSE
- **Permissions**: Création/édition des audits, incidents, formations, conformité

### 🟢 Manager
- **Email**: `manager@trafrule.com`
- **Mot de passe**: `Manager2024!`
- **Rôle**: Directeur Opérationnel
- **Permissions**: Consultation des rapports et données

### 🟡 Employé
- **Email**: `employe@trafrule.com`
- **Mot de passe**: `Employe2024!`
- **Rôle**: Technicienne de production
- **Permissions**: Déclaration d'incidents, consultation des formations

## 🚀 Scripts de Gestion

### Réinitialiser les utilisateurs de test
```bash
cd backend
npm run reset-users
```

### Réinitialiser toute la base de données
```bash
cd backend
npm run seed
```

## 📝 Inscription de Nouveaux Utilisateurs

### Via l'Interface Web
1. Accédez à la page de connexion
2. Cliquez sur l'onglet "Inscription"
3. Remplissez le formulaire avec :
   - **Informations personnelles** : Nom, prénom, email
   - **Mot de passe** : Minimum 8 caractères avec majuscule, minuscule, chiffre et caractère spécial
   - **Informations professionnelles** : Entreprise, département, poste

### Validation des Mots de Passe
Les nouveaux mots de passe doivent respecter :
- ✅ Au moins 8 caractères
- ✅ Au moins 1 lettre minuscule (a-z)
- ✅ Au moins 1 lettre majuscule (A-Z)
- ✅ Au moins 1 chiffre (0-9)
- ✅ Au moins 1 caractère spécial (!@#$%^&*)

## 🔐 Sécurité

- Les mots de passe sont hachés avec bcrypt
- Les tokens JWT expirent automatiquement
- Limitation du taux de requêtes pour éviter les attaques par force brute
- Validation côté serveur de toutes les données d'entrée

## 🎯 Rôles et Permissions

### Admin
- Accès complet au système
- Gestion des utilisateurs
- Configuration avancée

### Responsable QHSE
- Gestion des audits
- Gestion des incidents
- Planification des formations
- Suivi de la conformité

### Manager
- Consultation des tableaux de bord
- Accès aux rapports
- Vue d'ensemble des KPI

### Employé
- Déclaration d'incidents
- Consultation des formations
- Accès limité aux données

## 🔧 Configuration

Les paramètres d'authentification sont définis dans :
- `backend/models/User.js` - Modèle utilisateur
- `backend/middlewares/auth.js` - Middleware d'authentification
- `backend/controllers/auth.js` - Logique d'authentification
- `frontend/src/contexts/AuthContext.tsx` - Contexte d'authentification côté client
