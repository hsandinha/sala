// src/routes/pagamentoRoutes.js
const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');
const { protect, restrictToAdmin } = require('../middlewares/authMiddleware');

// Rotas de Admin para Pagamentos
// @route   GET /api/pagamentos/admin
// @desc    (Admin) Listar todos os pagamentos
// @access  Private/Admin
router.get('/admin', protect, restrictToAdmin, pagamentoController.getAllPagamentosAdmin);

// @route   GET /api/pagamentos/admin/:id
// @desc    (Admin) Obter detalhes de um pagamento específico
// @access  Private/Admin
router.get('/admin/:id', protect, restrictToAdmin, pagamentoController.getPagamentoByIdAdmin);

// A rota POST para cliente criar pagamento para uma reserva já está em reservaRoutes.js
// Se quisermos outras rotas de pagamento (ex: admin registrar pagamento manual), adicionaremos aqui.

router.put('/admin/:id/status', protect, restrictToAdmin, pagamentoController.updatePagamentoStatusAdmin); // <<< NOVA ROTA

module.exports = router;