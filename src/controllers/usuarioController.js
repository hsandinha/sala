const User = require('../models/usuarioModel'); 

exports.getMe = async (req, res, next) => {
  try {

    const user = req.user;

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Usuário não encontrado (inesperado após middleware protect).',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("ERRO EM GETME CONTROLLER:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar dados do usuário.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.updateMe = async (req, res, next) => {
  console.log('UPDATEME CONTROLLER: Iniciando atualização de perfil...');
  try {

    const userId = req.user.id;

    
    const allowedUpdates = {};
    if (req.body.name) allowedUpdates.name = req.body.name;
    if (req.body.phone) allowedUpdates.phone = req.body.phone;
    if (req.body.cpf_cnpj) allowedUpdates.cpf_cnpj = req.body.cpf_cnpj;
    

    console.log('UPDATEME CONTROLLER: Campos para atualizar:', allowedUpdates);

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Nenhum dado fornecido para atualização.',
      });
    }


    const updatedUser = await User.findByIdAndUpdate(userId, allowedUpdates, {
      new: true,
      runValidators: true,
    }).select('-senha'); 

    if (!updatedUser) {
      
      console.log('UPDATEME CONTROLLER: Usuário não encontrado para atualização (inesperado).');
      return res.status(404).json({
        status: 'fail',
        message: 'Usuário não encontrado.',
      });
    }

    console.log('UPDATEME CONTROLLER: Perfil atualizado com sucesso.');
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      console.error("UPDATEME CONTROLLER: Erro de validação:", messages.join('. '));
      return res.status(400).json({
        status: 'fail',
        message: messages.join('. '),
      });
    }
    console.error("ERRO EM UPDATEME CONTROLLER:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar dados do usuário.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

exports.getAllUsers = async (req, res, next) => {
  console.log('GETALLUSERS CONTROLLER: Buscando todos os usuários...');
  try {

    const users = await User.find().select('-senha');

    console.log('GETALLUSERS CONTROLLER: Usuários encontrados:', users.length);
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    console.error("ERRO EM GETALLUSERS CONTROLLER:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar usuários.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getUserById = async (req, res, next) => {
  console.log(`GETUSERBYID CONTROLLER: Buscando usuário com ID: ${req.params.id}`);
  try {
    const user = await User.findById(req.params.id).select('-senha'); // Exclui a senha da resposta

    if (!user) {
      console.log(`GETUSERBYID CONTROLLER: Usuário com ID ${req.params.id} não encontrado.`);
      return res.status(404).json({
        status: 'fail',
        message: 'Usuário não encontrado com este ID.',
      });
    }

    console.log(`GETUSERBYID CONTROLLER: Usuário ${user.email} encontrado.`);
    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("ERRO EM GETUSERBYID CONTROLLER:", error);
    // Se o ID não for um ObjectId válido, o Mongoose pode lançar um CastError
    if (error.name === 'CastError') {
        return res.status(400).json({
            status: 'fail',
            message: 'ID de usuário inválido.',
        });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar usuário.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.updateUserByAdmin = async (req, res, next) => {
  const userIdToUpdate = req.params.id;
  console.log(`UPDATEUSERBYADMIN CONTROLLER: Tentando atualizar usuário com ID: ${userIdToUpdate}`);
  console.log('Dados recebidos para atualização:', req.body);

  try {
    const { name, email, role, phone, cpf_cnpj } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) {
      if (['user', 'admin'].includes(role)) { 
        updateData.role = role;
      } else {
        return res.status(400).json({
          status: 'fail',
          message: 'Valor de "role" inválido. Deve ser "user" ou "admin".',
        });
      }
    }
    if (phone) updateData.phone = phone;
    if (cpf_cnpj) updateData.cpf_cnpj = cpf_cnpj;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Nenhum dado válido fornecido para atualização.',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(userIdToUpdate, updateData, {
      new: true,          
      runValidators: true,  
    }).select('-senha'); 
    if (!updatedUser) {
      console.log(`UPDATEUSERBYADMIN CONTROLLER: Usuário com ID ${userIdToUpdate} não encontrado para atualização.`);
      return res.status(404).json({
        status: 'fail',
        message: 'Usuário não encontrado com este ID.',
      });
    }

    console.log(`UPDATEUSERBYADMIN CONTROLLER: Usuário ${updatedUser.email} atualizado com sucesso.`);
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("ERRO EM UPDATEUSERBYADMIN CONTROLLER:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'fail',
        message: messages.join('. '),
      });
    }
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({
            status: 'fail',
            message: 'ID de usuário inválido.',
        });
    }
    // Erro de chave duplicada (ex: email)
    if (error.code === 11000) {
        return res.status(400).json({
            status: 'fail',
            message: `O campo ${Object.keys(error.keyValue)[0]} já está em uso. Escolha outro valor.`
        });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar usuário.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.deleteUserByAdmin = async (req, res, next) => {
  const userIdToDelete = req.params.id;
  console.log(`DELETEUSERBYADMIN CONTROLLER: Tentando deletar usuário com ID: ${userIdToDelete}`);

  try {
    const user = await User.findByIdAndDelete(userIdToDelete);

    if (!user) {
      console.log(`DELETEUSERBYADMIN CONTROLLER: Usuário com ID ${userIdToDelete} não encontrado para deleção.`);
      return res.status(404).json({
        status: 'fail',
        message: 'Usuário não encontrado com este ID.',
      });
    }

    console.log(`DELETEUSERBYADMIN CONTROLLER: Usuário ${user.email} deletado com sucesso.`);
    res.status(200).json({
        status: 'success',
        message: 'Usuário deletado com sucesso.',
        data: null 
    });


  } catch (error) {
    console.error("ERRO EM DELETEUSERBYADMIN CONTROLLER:", error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({
            status: 'fail',
            message: 'ID de usuário inválido.',
        });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao deletar usuário.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

