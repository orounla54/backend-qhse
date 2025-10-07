const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const qhseRoutes = require('./routes/qhse');

// Import des modèles
const Audit = require('./models/Audit');
const Incident = require('./models/Incident');
const Risque = require('./models/Risque');
const Formation = require('./models/Formation');
const Conformite = require('./models/Conformite');

// Protection des routes par authentification
router.use(auth);

// Routes QHSE
router.use('/', qhseRoutes);

module.exports = router; 