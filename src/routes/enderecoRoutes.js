const express = require('express');
const router = express.Router();
const enderecoController = require('../controllers/enderecoController');
const { protect, restrictToAdmin } = require('../middlewares/authMiddleware');

router.put('/me', protect, enderecoController.upsertMyEndereco);
router.get('/me', protect, enderecoController.getMyEndereco); 
router.delete('/me', protect, enderecoController.deleteMyEndereco);
router.get('/admin', protect, restrictToAdmin, enderecoController.getAllEnderecosAdmin);
router.get('/admin/:id', protect, restrictToAdmin, enderecoController.getEnderecoByIdAdmin);
router.put('/admin/:id', protect, restrictToAdmin, enderecoController.updateEnderecoAdmin);
router.delete('/admin/:id', protect, restrictToAdmin, enderecoController.deleteEnderecoAdmin); // <<< NOVA ROTA


module.exports = router;