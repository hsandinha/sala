const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictToAdmin } = require('../middlewares/authMiddleware');


router.get('/me', protect, userController.getMe); 
router.put('/me', protect, userController.updateMe);
router.get('/', protect, restrictToAdmin, userController.getAllUsers);
router.get('/:id', protect, restrictToAdmin, userController.getUserById);
router.put('/:id', protect, restrictToAdmin, userController.updateUserByAdmin);
router.delete('/:id', protect, restrictToAdmin, userController.deleteUserByAdmin); 


module.exports = router;