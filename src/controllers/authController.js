// src/controllers/authController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Função para gerar o token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// NÃO TEM MAIS A PRIMEIRA DEFINIÇÃO AQUI

// @desc    Registrar um novo usuário final
// @route   POST /api/auth/signup
// @access  Public
exports.signupUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, cpf_cnpj } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Por favor, forneça nome, email e senha.',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'Este email já está cadastrado.',
      });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      phone,
      cpf_cnpj,
    });

    const token = generateToken(newUser._id);
    newUser.password = undefined;

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'fail',
        message: messages.join('. '),
      });
    }
    console.error("ERRO NO SIGNUP CONTROLLER:", error);
    res.status(500).json({
      status: 'error',
      message: 'Algo deu errado no servidor ao tentar registrar o usuário.',
      // errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined, // Você pode manter ou remover essas linhas de depuração na resposta
      // errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Outras funções virão aqui, como a exports.loginUser que fizemos antes
exports.loginUser = async (req, res, next) => {
  console.log('LOGIN CONTROLLER: Iniciando processo de login...'); // Log 1
  try {
    const { email, password } = req.body;
    console.log('LOGIN CONTROLLER: Email recebido:', email); // Log 2

    // 1. Verificar se email e senha foram fornecidos
    if (!email || !password) {
      console.log('LOGIN CONTROLLER: Email ou senha não fornecidos.'); // Log 3
      return res.status(400).json({
        status: 'fail',
        message: 'Por favor, forneça email e senha.',
      });
    }

    // 2. Verificar se o usuário existe E buscar a senha
    console.log('LOGIN CONTROLLER: Buscando usuário...'); // Log 4
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('LOGIN CONTROLLER: Usuário não encontrado com o email:', email); // Log 5
      return res.status(401).json({ // 401 Unauthorized
        status: 'fail',
        message: 'Email ou senha incorretos.',
      });
    }
    console.log('LOGIN CONTROLLER: Usuário encontrado:', user.email); // Log 6

    // 3. Se encontrou usuário, comparar senha
    console.log('LOGIN CONTROLLER: Comparando senhas...'); // Log 7
    const isMatch = await user.comparePassword(password, user.password);

    if (!isMatch) {
      console.log('LOGIN CONTROLLER: Senha não confere para o usuário:', user.email); // Log 8
      return res.status(401).json({ // 401 Unauthorized
        status: 'fail',
        message: 'Email ou senha incorretos.',
      });
    }
    console.log('LOGIN CONTROLLER: Senha correta!'); // Log 9

    // 4. Se tudo estiver ok, gerar e enviar o token para o cliente
    console.log('LOGIN CONTROLLER: Gerando token...'); // Log 10
    const token = generateToken(user._id);

    user.password = undefined; // Remover a senha do output

    console.log('LOGIN CONTROLLER: Enviando resposta de sucesso.'); // Log 11
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("ERRO NO LOGIN CONTROLLER DETALHADO:", error); // Log 12
    res.status(500).json({
      status: 'error',
      message: 'Algo deu errado no servidor ao tentar fazer login.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

