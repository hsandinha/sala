const express = require('express');
const router = express.Router();
const enderecoController = require('../controllers/enderecoController');
const { protect } = require('../middlewares/authMiddleware');

router.put('/me', protect, enderecoController.upsertMyEndereco);
router.get('/me', protect, enderecoController.getMyEndereco); 
router.delete('/me', protect, enderecoController.deleteMyEndereco);



module.exports = router;