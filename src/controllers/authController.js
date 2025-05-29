const User = require('../models/usuarioModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Função para gerar o token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

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
    });
  }
};

exports.loginUser = async (req, res, next) => {
  console.log('LOGIN CONTROLLER: Iniciando processo de login...'); 
  try {
    const { email, password } = req.body;
    console.log('LOGIN CONTROLLER: Email recebido:', email)


    // Verifica se email e senha foram fornecidos
    if (!email || !password) {
      console.log('LOGIN CONTROLLER: Email ou senha não fornecidos.'); 
      return res.status(400).json({
        status: 'fail',
        message: 'Por favor, forneça email e senha.',
      });
    }

    // Verifica se o usuário existe E buscar a senha
    console.log('LOGIN CONTROLLER: Buscando usuário...'); 
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('LOGIN CONTROLLER: Usuário não encontrado com o email:', email);
      return res.status(401).json({ 
        status: 'fail',
        message: 'Email ou senha incorretos.',
      });
    }
    console.log('LOGIN CONTROLLER: Usuário encontrado:', user.email);


    // 3. Se encontrou usuário, comparar senha
    console.log('LOGIN CONTROLLER: Comparando senhas...');
    const isMatch = await user.comparePassword(password, user.password);


    if (!isMatch) {
      console.log('LOGIN CONTROLLER: Senha não confere para o usuário:', user.email); 
      return res.status(401).json({ 
        status: 'fail',
        message: 'Email ou senha incorretos.',
      });
    }
    console.log('LOGIN CONTROLLER: Senha correta!');


    // Se tudo estiver ok, gerar e enviar o token para o cliente
    console.log('LOGIN CONTROLLER: Gerando token...'); 
    const token = generateToken(user._id);

    user.password = undefined;

    console.log('LOGIN CONTROLLER: Enviando resposta de sucesso.');
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("ERRO NO LOGIN CONTROLLER DETALHADO:", error); 
    res.status(500).json({
      status: 'error',
      message: 'Algo deu errado no servidor ao tentar fazer login.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.signupAdmin = async (req, res, next) => {
  console.log('SIGNUP ADMIN CONTROLLER: Tentando registrar novo admin...');
  try {


    const { name, email, password, phone, cpf_cnpj } = req.body;

    // Verifica se todos os campos obrigatórios foram enviados
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Por favor, forneça nome, email e senha para o novo administrador.',
      });
    }

    // Verifica se o usuário já existe pelo email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'Este email já está cadastrado.',
      });
    }

    const newAdmin = await User.create({
      name,
      email,
      password,
      phone,  
      cpf_cnpj, 
      role: 'admin',
    });

    // Remover a senha do output
    newAdmin.password = undefined;

    console.log('SIGNUP ADMIN CONTROLLER: Novo admin registrado:', newAdmin.email);
    res.status(201).json({ 
      status: 'success',
      message: 'Novo administrador registrado com sucesso.',
      data: {
        user: newAdmin,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      console.error("SIGNUP ADMIN CONTROLLER: Erro de validação:", messages.join('. '));
      return res.status(400).json({
        status: 'fail',
        message: messages.join('. '),
      });
    }
    console.error("ERRO NO SIGNUP ADMIN CONTROLLER:", error);
    res.status(500).json({
      status: 'error',
      message: 'Algo deu errado no servidor ao tentar registrar o novo administrador.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.forgotPassword = async (req, res, next) => {
  console.log('FORGOT PASSWORD CONTROLLER: Iniciando processo...');
  try {
    //  Obter o usuário com base no email enviado
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      console.log('FORGOT PASSWORD CONTROLLER: Email não encontrado, mas enviando resposta genérica.');
      return res.status(200).json({
        status: 'success',
        message: 'Se o email estiver em nosso sistema, um link para redefinição de senha foi enviado.',
      });
    }

    //  Gerar o novo token de reset aleatório
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // "Enviar" o token para o email do usuário (aqui vamos apenas logar)
    const resetURLFrontend = `http://localhost:3000/reset-password/${resetToken}`;

    console.log('--------------------------------------------------------------------');
    console.log('FORGOT PASSWORD CONTROLLER: SIMULAÇÃO DE ENVIO DE EMAIL');
    console.log(`Token de reset (não hasheado, para usar no teste): ${resetToken}`);
    console.log(`URL de reset (para um frontend hipotético): ${resetURLFrontend}`);
    console.log('Token hasheado salvo no DB:', user.passwordResetToken);
    console.log('Expiração do token salvo no DB:', user.passwordResetExpires);
    console.log('--------------------------------------------------------------------');
    // Aqui você integraria um serviço de email para enviar resetURLFrontend ao user.email

    res.status(200).json({
      status: 'success',
      message: 'Token de reset (simulado) gerado. Verifique o console do servidor.',
    });

  } catch (error) {

    console.error("ERRO EM FORGOT PASSWORD CONTROLLER:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao processar a solicitação de esqueci a senha.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  console.log('RESET PASSWORD CONTROLLER: Iniciando processo...');
  try {
    // Obter o usuário com base no token
    const unhashedTokenFromURL = req.params.token;
    const hashedTokenForDB = crypto
      .createHash('sha256')
      .update(unhashedTokenFromURL)
      .digest('hex');

    console.log('RESET PASSWORD CONTROLLER: Token da URL (original):', unhashedTokenFromURL);
    console.log('RESET PASSWORD CONTROLLER: Token hasheado para busca no DB:', hashedTokenForDB);

    // Encontrar o usuário que tem este token hasheado E o token ainda não expirou
    const user = await User.findOne({
      passwordResetToken: hashedTokenForDB,
      passwordResetExpires: { $gt: Date.now() }, // Verifica se a data de expiração é MAIOR que a data/hora atual
    });

    // Se o token não for válido ou tiver expirado, ou usuário não encontrado
    if (!user) {
      console.log('RESET PASSWORD CONTROLLER: Token inválido ou expirado.');
      return res.status(400).json({ // 400 Bad Request
        status: 'fail',
        message: 'Token inválido ou expirado. Por favor, solicite um novo reset de senha.',
      });
    }

    // Se o token é válido, definir a nova senha
    if (!req.body.password || !req.body.passwordConfirm) {
        return res.status(400).json({
            status: 'fail',
            message: 'Por favor, forneça a nova senha e a confirmação da senha.'
        });
    }
    if (req.body.password !== req.body.passwordConfirm) {
        return res.status(400).json({
            status: 'fail',
            message: 'As senhas não coincidem.'
        });
    }

    // O userModel tem validação de minlength para senha
    user.password = req.body.password;
    // Limpar os campos de reset de senha do documento do usuário
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save(); // O hook pre-save no userModel vai hashear a nova senha automaticamente


    console.log('RESET PASSWORD CONTROLLER: Senha resetada com sucesso para:', user.email);
    res.status(200).json({
      status: 'success',
      message: 'Senha resetada com sucesso! Você já pode fazer login com sua nova senha.',
    });

  } catch (error) {
    console.error("ERRO EM RESET PASSWORD CONTROLLER:", error);
    if (error.name === 'ValidationError') { // Erro de validação da senha (ex: minlength)
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({
            status: 'fail',
            message: messages.join('. ')
        });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao resetar a senha.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};