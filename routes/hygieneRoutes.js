const express = require('express');
const router = express.Router();
const {
  createHygiene,
  getAllHygiene,
  getHygieneById,
  updateHygiene,
  deleteHygiene
} = require('../controllers/hygieneController');

// Routes pour les contrôles d'hygiène
router.post('/', createHygiene);
router.get('/', getAllHygiene);
router.get('/:id', getHygieneById);
router.put('/:id', updateHygiene);
router.delete('/:id', deleteHygiene);

module.exports = router;
