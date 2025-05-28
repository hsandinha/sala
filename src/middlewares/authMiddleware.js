const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Precisamos do User model para buscar o usuário

const protect = async (req, res, next) => {
  let token;

  // 1. Verificar se o token existe no cabeçalho Authorization e se começa com "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Obter o token (tirar o "Bearer " da frente)
      token = req.headers.authorization.split(' ')[1];

      // 3. Verificar e decodificar o token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Encontrar o usuário pelo ID do token e adicionar o usuário à requisição (req.user)
      // Removemos a senha do objeto usuário que será anexado
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        // Se o usuário associado ao token não existir mais
        return res.status(401).json({
          status: 'fail',
          message: 'O usuário pertencente a este token não existe mais.',
        });
      }

      next(); // Prossegue para o próximo middleware ou controller da rota
    } catch (error) {
      console.error('Erro na autenticação do token:', error);
      return res.status(401).json({
        status: 'fail',
        message: 'Token inválido ou expirado. Não autorizado.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({ // 401 Unauthorized
      status: 'fail',
      message: 'Não autorizado. Token não fornecido.',
    });
  }
};

module.exports = { protect };