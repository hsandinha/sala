const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { protect, restrictToAdmin } = require('../middlewares/authMiddleware');


router.get('/me', protect, usuarioController.getMe); 
router.put('/me', protect, usuarioController.updateMe);
router.get('/', protect, restrictToAdmin, usuarioController.getAllUsers);
router.get('/:id', protect, restrictToAdmin, usuarioController.getUserById);
router.put('/:id', protect, restrictToAdmin, usuarioController.updateUserByAdmin);
router.delete('/:id', protect, restrictToAdmin, usuarioController.deleteUserByAdmin); 


module.exports = router;