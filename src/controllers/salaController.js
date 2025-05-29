// src/controllers/salaController.js
const Sala = require('../models/salaModel'); // Importa o nosso Sala model

// @desc    (Admin) Criar uma nova sala
// @route   POST /api/salas
// @access  Private/Admin
exports.createSala = async (req, res, next) => {
  console.log('CREATESALA CONTROLLER: Tentando criar nova sala...');
  console.log('Dados recebidos no corpo da requisição:', req.body);
  try {
    // Os dados da sala virão do corpo da requisição
    // O model Sala já tem as validações para os campos obrigatórios (nome, descricao, capacidade, status)
    const { nome, descricao, capacidade, categoria_id, status } = req.body;

    // Validação básica (embora o Mongoose também valide)
    if (!nome || !descricao || !capacidade) {
      return res.status(400).json({
        status: 'fail',
        message: 'Por favor, forneça nome, descrição e capacidade para a sala.',
      });
    }

    const novaSala = await Sala.create({
      nome,
      descricao,
      capacidade,
      categoria_id, // Será undefined se não enviado, e o model permite (não é obrigatório por enquanto)
      status,       // Usará o default 'disponivel' do schema se não enviado e se for válido
    });

    console.log('CREATESALA CONTROLLER: Nova sala criada com sucesso:', novaSala._id);
    res.status(201).json({ // 201 Created
      status: 'success',
      data: {
        sala: novaSala,
      },
    });
  } catch (error) {
    console.error("ERRO EM CREATESALA CONTROLLER:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'fail',
        message: messages.join(' '), // Usar espaço para juntar mensagens de validação
      });
    }
    // Tratar outros erros, como duplicidade se houver campos unique (ex: nome da sala, se definido como unique)
    if (error.code === 11000) {
        return res.status(400).json({
            status: 'fail',
            message: `O campo ${Object.keys(error.keyValue)[0]} já está em uso. Escolha outro valor.`
        });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao criar a sala.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getAllSalas = async (req, res, next) => {
  console.log('GETALLSALAS CONTROLLER: Buscando todas as salas...');
  try {
    // Em uma aplicação real, você adicionaria filtros (query params) e paginação aqui.
    // Ex: filtrar por status 'disponivel', por capacidade, etc.
    const salas = await Sala.find(); // Por enquanto, busca todas as salas

    console.log('GETALLSALAS CONTROLLER: Salas encontradas:', salas.length);
    res.status(200).json({
      status: 'success',
      results: salas.length,
      data: {
        salas,
      },
    });
  } catch (error) {
    console.error("ERRO EM GETALLSALAS CONTROLLER:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar salas.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getSalaById = async (req, res, next) => {
  const salaId = req.params.id;
  console.log(`GETSALABYID CONTROLLER: Buscando sala com ID: ${salaId}`);
  try {
    const sala = await Sala.findById(salaId);
    // Se você tivesse uma coleção 'CategoriaSala' e quisesse popular:
    // const sala = await Sala.findById(salaId).populate('categoria_id', 'nomeDaCategoria');

    if (!sala) {
      console.log(`GETSALABYID CONTROLLER: Sala com ID ${salaId} não encontrada.`);
      return res.status(404).json({
        status: 'fail',
        message: 'Sala não encontrada com este ID.',
      });
    }

    console.log(`GETSALABYID CONTROLLER: Sala ${sala.nome} encontrada.`);
    res.status(200).json({
      status: 'success',
      data: {
        sala,
      },
    });
  } catch (error) {
    console.error("ERRO EM GETSALABYID CONTROLLER:", error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        status: 'fail',
        message: 'ID de sala inválido.',
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar detalhes da sala.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    (Admin) Atualizar uma sala existente pelo ID
// @route   PUT /api/salas/:id
// @access  Private/Admin
exports.updateSala = async (req, res, next) => {
  const salaIdToUpdate = req.params.id;
  console.log(`UPDATESALA CONTROLLER: Tentando atualizar sala com ID: ${salaIdToUpdate}`);
  console.log('Dados recebidos para atualização:', req.body);

  try {
    // Os dados para atualização virão do corpo da requisição.
    // O Mongoose só atualizará os campos presentes em req.body.
    // As validações do schema serão aplicadas devido ao { runValidators: true }.
    const updatedSala = await Sala.findByIdAndUpdate(salaIdToUpdate, req.body, {
      new: true,          // Retorna o documento modificado
      runValidators: true,  // Roda as validações do schema (ex: required, min, enum)
    });

    if (!updatedSala) {
      console.log(`UPDATESALA CONTROLLER: Sala com ID ${salaIdToUpdate} não encontrada para atualização.`);
      return res.status(404).json({
        status: 'fail',
        message: 'Sala não encontrada com este ID.',
      });
    }

    console.log(`UPDATESALA CONTROLLER: Sala ${updatedSala.nome} atualizada com sucesso.`);
    res.status(200).json({
      status: 'success',
      data: {
        sala: updatedSala,
      },
    });
  } catch (error) {
    console.error("ERRO EM UPDATESALA CONTROLLER:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'fail',
        message: messages.join(' '),
      });
    }
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        status: 'fail',
        message: 'ID de sala inválido.',
      });
    }
    // Tratar outros erros, como duplicidade se houver campos unique (ex: nome da sala)
    if (error.code === 11000) {
        return res.status(400).json({
            status: 'fail',
            message: `O campo ${Object.keys(error.keyValue)[0]} já está em uso. Escolha outro valor.`
        });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar a sala.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.deleteSala = async (req, res, next) => {
  const salaIdToDelete = req.params.id;
  console.log(`DELETESALA CONTROLLER: Tentando deletar sala com ID: ${salaIdToDelete}`);

  try {
    const sala = await Sala.findByIdAndDelete(salaIdToDelete);

    if (!sala) {
      console.log(`DELETESALA CONTROLLER: Sala com ID ${salaIdToDelete} não encontrada para deleção.`);
      return res.status(404).json({
        status: 'fail',
        message: 'Sala não encontrada com este ID.',
      });
    }

    console.log(`DELETESALA CONTROLLER: Sala ${sala.nome} deletada com sucesso.`);
    // Para DELETE bem-sucedido, status 204 (No Content) é comum e não envia corpo.
    // Ou um 200 com uma mensagem. Vamos usar 200 com mensagem para consistência.
    res.status(200).json({
      status: 'success',
      message: 'Sala deletada com sucesso.',
      data: null, // Ou pode omitir data
    });
    // Alternativa para 204:
    // res.status(204).send();

  } catch (error) {
    console.error("ERRO EM DELETESALA CONTROLLER:", error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        status: 'fail',
        message: 'ID de sala inválido.',
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao deletar a sala.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};