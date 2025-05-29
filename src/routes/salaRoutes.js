// src/routes/salaRoutes.js
const express = require('express');
const router = express.Router();
const salaController = require('../controllers/salaController');
const { protect, restrictToAdmin } = require('../middlewares/authMiddleware');

// @route   POST /api/salas
// @desc    (Admin) Criar uma nova sala
// @access  Private/Admin
router.post('/', protect, restrictToAdmin, salaController.createSala);

// @route   GET /api/salas
// @desc    Listar todas as salas (público)
// @access  Public
router.get('/', salaController.getAllSalas);

router.get('/:id', salaController.getSalaById);

router.put('/:id', protect, restrictToAdmin, salaController.updateSala);

router.delete('/:id', protect, restrictToAdmin, salaController.deleteSala);
module.exports = router;