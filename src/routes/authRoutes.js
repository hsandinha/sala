// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Vamos criar este arquivo em seguida
const { protect } = require('../middlewares/authMiddleware');


// @route   POST /api/auth/signup
// @desc    Registrar um novo usuário final
// @access  Public
router.post('/signup', authController.signupUser);

// @route   POST /api/auth/login
// @desc    Autenticar usuário e obter token
// @access  Public
 router.post('/login', authController.loginUser); // Descomentaremos e implementaremos depois

// @route   POST /api/auth/admin/signup
// @desc    Registrar um novo administrador (rota protegida ou para setup inicial)
// @access  Private/Admin (ou para setup)
// router.post('/admin/signup', authController.signupAdmin); // Descomentaremos e implementaremos depois

// @route   POST /api/auth/forgot-password
// @desc    Solicitar reset de senha
// @access  Public
// router.post('/forgot-password', authController.forgotPassword); // Descomentaremos e implementaremos depois

// @route   POST /api/auth/reset-password/:token
// @desc    Resetar a senha com o token
// @access  Public
// router.post('/reset-password/:token', authController.resetPassword); // Descomentaremos e implementaremos depois




///////////////////////////////////////////

// NOVA ROTA PROTEGIDA PARA TESTE
// @route   GET /api/auth/test-protected
// @desc    Rota de teste para verificar o middleware de proteção
// @access  Private (requer token)
router.get('/test-protected', protect, (req, res) => {
  // Se chegou aqui, o middleware 'protect' validou o token
  // e req.user está disponível
  res.status(200).json({
    status: 'success',
    message: 'Você acessou uma rota protegida!',
    user: req.user, // Mostra os dados do usuário que foi autenticado
  });
});

module.exports = router;