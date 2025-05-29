const Sala = require('../models/salaModel'); 


exports.createSala = async (req, res, next) => {
  console.log('CREATESALA CONTROLLER: Tentando criar nova sala...');
  console.log('Dados recebidos no corpo da requisição:', req.body);
  try {
    const { nome, descricao, capacidade, categoria_id, status } = req.body;

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
      categoria_id, 
      status, 
    });

    console.log('CREATESALA CONTROLLER: Nova sala criada com sucesso:', novaSala._id);
    res.status(201).json({
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
        message: messages.join(' '), 
      });
    }
    
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
    const salas = await Sala.find(); 

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

exports.updateSala = async (req, res, next) => {
  const salaIdToUpdate = req.params.id;
  console.log(`UPDATESALA CONTROLLER: Tentando atualizar sala com ID: ${salaIdToUpdate}`);
  console.log('Dados recebidos para atualização:', req.body);

  try {
    const updatedSala = await Sala.findByIdAndUpdate(salaIdToUpdate, req.body, {
      new: true,
      runValidators: true, 
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

    res.status(200).json({
      status: 'success',
      message: 'Sala deletada com sucesso.',
      data: null, 
    });

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