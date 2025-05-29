// src/routes/reservaRoutes.js
const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const pagamentoController = require('../controllers/pagamentoController');
const { protect, restrictToAdmin } = require('../middlewares/authMiddleware');


router.post('/', protect, reservaController.createReserva);
router.get('/minhas-reservas', protect, reservaController.getMyReservas);
router.put('/minhas-reservas/:id/cancelar', protect, reservaController.cancelMyReserva);
router.post('/:reservaId/pagamentos', protect , pagamentoController.createPagamentoParaReserva);   


router.get('/admin', protect, restrictToAdmin, reservaController.getAllReservasAdmin);
router.put('/admin/:id/status', protect, restrictToAdmin, reservaController.updateReservaStatusAdmin); 


module.exports = router;
