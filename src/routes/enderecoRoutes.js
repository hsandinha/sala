// src/routes/enderecoRoutes.js
const express = require('express');
const router = express.Router();
const enderecoController = require('../controllers/enderecoController');
const { protect } = require('../middlewares/authMiddleware'); // Apenas 'protect' é necessário

// @route   PUT /api/enderecos/me
// @desc    Cliente cria ou atualiza seu próprio endereço
// @access  Private (usuário logado)
router.put('/me', protect, enderecoController.upsertMyEndereco);
router.get('/me', protect, enderecoController.getMyEndereco); // <<< NOVA ROTA
router.delete('/me', protect, enderecoController.deleteMyEndereco);

// Outras rotas para endereços virão aqui (GET /me, DELETE /me)

module.exports = router;