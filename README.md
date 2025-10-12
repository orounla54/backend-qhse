# QHSE Backend API

Backend API pour le module QHSE (Qualité, Hygiène, Sécurité, Environnement) de Trafrule.

## 🚀 Technologies

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM pour MongoDB
- **JWT** - Authentification
- **Bcrypt** - Hachage des mots de passe

## 📋 Fonctionnalités

### Modules QHSE
- **Qualité** : Audits, Conformité, Contrôles qualité, Non-conformités
- **Hygiène** : Gestion de l'hygiène, EPI, Formations
- **Sécurité** : Incidents, Risques, Analyses
- **Environnement** : Suivi environnemental

### API Endpoints
- `/api/auth` - Authentification
- `/api/dashboard` - Tableau de bord
- `/api/qualite` - Gestion qualité
- `/api/hse` - Gestion HSE
- `/api/laboratoire` - Gestion laboratoire
- `/api/notifications` - Notifications

## 🛠️ Installation

1. **Cloner le repository**
```bash
git clone https://github.com/orounla54/backend-qhse.git
cd backend-qhse
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**
```bash
# Créer un fichier .env
cp .env.example .env
```

4. **Variables d'environnement requises**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/qhse
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

5. **Démarrer le serveur**
```bash
# Développement
npm run dev

# Production
npm start
```

## 📁 Structure du projet

```
backend/
├── config/           # Configuration
├── controllers/      # Contrôleurs API
├── middlewares/      # Middlewares
├── models/          # Modèles Mongoose
├── routes/          # Routes API
├── utils/           # Utilitaires
└── app.js           # Point d'entrée
```

## 🔧 Scripts disponibles

- `npm start` - Démarrer en production
- `npm run dev` - Démarrer en développement avec nodemon
- `npm run seed` - Peupler la base de données
- `npm run reset-users` - Réinitialiser les utilisateurs

## 📊 Base de données

### Modèles principaux
- **User** - Utilisateurs
- **Audit** - Audits qualité
- **Incident** - Incidents sécurité
- **Risque** - Gestion des risques
- **Formation** - Formations
- **Hygiene** - Gestion hygiène

## 🔐 Authentification

L'API utilise JWT pour l'authentification. Incluez le token dans l'en-tête :
```
Authorization: Bearer <token>
```

## 📝 Documentation API

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/logout` - Déconnexion

### Dashboard
- `GET /api/dashboard/stats` - Statistiques générales
- `GET /api/dashboard/notifications` - Notifications

## 🚀 Déploiement

### Variables d'environnement de production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/qhse
JWT_SECRET=your_production_jwt_secret
```

### Déploiement sur Heroku
```bash
# Ajouter le remote Heroku
heroku git:remote -a your-app-name

# Déployer
git push heroku master
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence ISC - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Trafrule Team** - Développement et maintenance

## 📞 Support

Pour toute question ou support, contactez l'équipe Trafrule.

