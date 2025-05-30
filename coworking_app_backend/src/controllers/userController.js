const User = require('../models/userModel'); 

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
    if (req.body.nome) allowedUpdates.nome = req.body.nome;
    if (req.body.telefone) allowedUpdates.telefone = req.body.telefone;
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
    if (error.nome === 'ValidationError') {
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
    if (error.nome === 'CastError') {
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
    // Campos que um admin pode atualizar.
    // Excluímos a senha daqui, pois a atualização de senha deve ter um fluxo dedicado e mais seguro.
    // O admin pode, por exemplo, alterar nome, email, tipo_usuario, telefone, cpf_cnpj.
    const { nome, email, tipo_usuario, telefone, cpf_cnpj } = req.body;
    const updateData = {};

    if (nome) updateData.nome = nome;
    if (email) updateData.email = email; // Cuidado com a unicidade do email se for alterado
    if (tipo_usuario) {
      if (['user', 'admin'].includes(tipo_usuario)) { // Validar se o tipo_usuario é um dos permitidos
        updateData.tipo_usuario = tipo_usuario;
      } else {
        return res.status(400).json({
          status: 'fail',
          message: 'Valor de "tipo_usuario" inválido. Deve ser "user" ou "admin".',
        });
      }
    }
    if (telefone) updateData.telefone = telefone;
    if (cpf_cnpj) updateData.cpf_cnpj = cpf_cnpj;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Nenhum dado válido fornecido para atualização.',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(userIdToUpdate, updateData, {
      new: true,          // Retorna o documento modificado
      runValidators: true,  // Roda as validações do schema
    }).select('-password'); // Garante que a senha não seja retornada

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
    if (error.nome === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'fail',
        message: messages.join('. '),
      });
    }
    if (error.nome === 'CastError' && error.kind === 'ObjectId') {
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
    // Para operações DELETE bem-sucedidas, é comum retornar um status 204 No Content, sem corpo na resposta.
    // Ou você pode retornar um 200 OK com uma mensagem de sucesso.
    res.status(200).json({
        status: 'success',
        message: 'Usuário deletado com sucesso.',
        data: null // Ou pode omitir 'data' ou retornar o usuário deletado se preferir
    });
    // Alternativa para 204:
    // res.status(204).send();

  } catch (error) {
    console.error("ERRO EM DELETEUSERBYADMIN CONTROLLER:", error);
    if (error.nome === 'CastError' && error.kind === 'ObjectId') {
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