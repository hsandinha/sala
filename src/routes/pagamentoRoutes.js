const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');
const { protect, restrictToAdmin } = require('../middlewares/authMiddleware');

router.get('/admin', protect, restrictToAdmin, pagamentoController.getAllPagamentosAdmin);
router.get('/admin/:id', protect, restrictToAdmin, pagamentoController.getPagamentoByIdAdmin);
router.put('/admin/:id/status', protect, restrictToAdmin, pagamentoController.updatePagamentoStatusAdmin);
router.post('/admin/manual', protect, restrictToAdmin, pagamentoController.registrarPagamentoManualAdmin);

module.exports = router;