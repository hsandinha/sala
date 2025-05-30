const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');


router.post('/signup', authController.signupUser);
router.post('/login', authController.loginUser);
router.post('/admin/signup', authController.signupAdmin); 
router.post('/forgot-password', authController.forgotPassword); 
router.post('/reset-password/:token', authController.resetPassword); 
router.get('/test-protected', protect, (req, res) => {

res.status(200).json({
    status: 'success',
    message: 'Você acessou uma rota protegida!',
    user: req.user, // Mostra os dados do usuário que foi autenticado
  });
});

module.exports = router;