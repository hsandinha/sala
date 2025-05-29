// src/routes/salaRoutes.js
const express = require('express');
const router = express.Router();
const salaController = require('../controllers/salaController');
const { protect, restrictToAdmin } = require('../middlewares/authMiddleware');

router.post('/', protect, restrictToAdmin, salaController.createSala);

router.get('/', salaController.getAllSalas);

router.get('/:id', salaController.getSalaById);

router.put('/:id', protect, restrictToAdmin, salaController.updateSala);

router.delete('/:id', protect, restrictToAdmin, salaController.deleteSala);

module.exports = router;