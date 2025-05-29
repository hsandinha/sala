const Reserva = require('../models/reservaModel');
const Sala = require('../models/salaModel');

exports.createReserva = async (req, res, next) => {
  console.log('CREATERESERVA CONTROLLER: Tentando criar nova reserva...');
  try {
    const { sala_id, data_reserva, hora_inicio, hora_fim } = req.body;
    const cliente_id = req.user.id;

    // 1. Valida entradas básicas
    if (!sala_id || !data_reserva || !hora_inicio || !hora_fim) {
      return res.status(400).json({
        status: 'fail',
        message: 'Por favor, forneça ID da sala, data da reserva, hora de início e hora de fim.',
      });
    }

    // 2. Verifica se a sala existe
    const salaExistente = await Sala.findById(sala_id);
    if (!salaExistente) {
      return res.status(404).json({
        status: 'fail',
        message: 'Sala não encontrada com o ID fornecido.',
      });
    }
    // Adicionar a verificacao se salaExistente.status é 'disponivel'

    const [startHours, startMinutes] = hora_inicio.split(':').map(Number);
    const [endHours, endMinutes] = hora_fim.split(':').map(Number);


    let parsedDataReserva = new Date(data_reserva);
    if (isNaN(parsedDataReserva.getTime())) {
        return res.status(400).json({ status: 'fail', message: 'Formato de data_reserva inválido.' });
    }
    parsedDataReserva = new Date(Date.UTC(parsedDataReserva.getUTCFullYear(), parsedDataReserva.getUTCMonth(), parsedDataReserva.getUTCDate()));


    const requestStartDateTime = new Date(parsedDataReserva);
    requestStartDateTime.setUTCHours(startHours, startMinutes, 0, 0);

    const requestEndDateTime = new Date(parsedDataReserva);
    requestEndDateTime.setUTCHours(endHours, endMinutes, 0, 0);

    // Validação simples de horário
    if (requestEndDateTime <= requestStartDateTime) {
      return res.status(400).json({
        status: 'fail',
        message: 'A hora de fim deve ser posterior à hora de início.',
      });
    }

    // 4. Verificar disponibilidade da sala (CHECAGEM DE CONFLITO)
    const conflictingReservation = await Reserva.findOne({
      sala_id: sala_id,
      status: { $nin: ['cancelada_pelo_usuario', 'cancelada_pelo_admin'] }, // Não considerar canceladas
      $or: [
        { startDateTime: { $lt: requestEndDateTime }, endDateTime: { $gt: requestStartDateTime } },
      ],
    });

    if (conflictingReservation) {
      console.log('CREATERESERVA CONTROLLER: Conflito de horário encontrado para a sala.');
      return res.status(409).json({
        status: 'fail',
        message: 'A sala não está disponível no horário solicitado. Já existe uma reserva.',
        conflictingReservationId: conflictingReservation._id
      });
    }
    console.log('CREATERESERVA CONTROLLER: Sala disponível. Criando reserva...');

    // 5. Criar a nova reserva
    const novaReserva = await Reserva.create({
      cliente_id,
      sala_id,
      data_reserva: parsedDataReserva,
      hora_inicio,
      hora_fim,
    });

    console.log('CREATERESERVA CONTROLLER: Nova reserva criada com sucesso:', novaReserva.protocolo);
    res.status(201).json({
      status: 'success',
      data: {
        reserva: novaReserva,
      },
    });

  } catch (error) {
    console.error("ERRO EM CREATERESERVA CONTROLLER:", error);
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
            message: 'ID de sala ou usuário inválido.',
        });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao criar a reserva.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getMyReservas = async (req, res, next) => {
  console.log('GETMYRESERVAS CONTROLLER: Buscando reservas do usuário:', req.user.id);
  try {
    const reservas = await Reserva.find({ cliente_id: req.user.id })
      .populate('sala_id', 'nome descricao capacidade status')
      .sort({ data_reserva: -1, hora_inicio: -1 }); 
    console.log('GETMYRESERVAS CONTROLLER: Reservas encontradas:', reservas.length);
    res.status(200).json({
      status: 'success',
      results: reservas.length,
      data: {
        reservas,
      },
    });
  } catch (error) {
    console.error("ERRO EM GETMYRESERVAS CONTROLLER:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar suas reservas.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.cancelMyReserva = async (req, res, next) => {
  const reservaId = req.params.id;
  const clienteId = req.user.id;
  console.log(`CANCELMYRESERVA CONTROLLER: Usuário ${clienteId} tentando cancelar reserva ${reservaId}`);

  try {
    const reserva = await Reserva.findById(reservaId);

    if (!reserva) {
      return res.status(404).json({ status: 'fail', message: 'Reserva não encontrada.' });
    }

    // Verificar se a reserva pertence ao usuário logado
    if (reserva.cliente_id.toString() !== clienteId) {
      return res.status(403).json({ status: 'fail', message: 'Você não tem permissão para cancelar esta reserva.' });
    }

    // Regras de negócio para cancelamento (exemplos)
    if (['cancelada_pelo_usuario', 'cancelada_pelo_admin', 'concluida', 'nao_compareceu'].includes(reserva.status)) {
      return res.status(400).json({ status: 'fail', message: `Esta reserva já está no status "${reserva.status}" e não pode ser cancelada.` });
    }

    reserva.status = 'cancelada_pelo_usuario';
    await reserva.save();

    console.log(`CANCELMYRESERVA CONTROLLER: Reserva ${reservaId} cancelada pelo usuário.`);
    res.status(200).json({
      status: 'success',
      message: 'Reserva cancelada com sucesso.',
      data: {
        reserva,
      },
    });

  } catch (error) {
    console.error("ERRO EM CANCELMYRESERVA CONTROLLER:", error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ status: 'fail', message: 'ID de reserva inválido.'});
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao cancelar a reserva.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getAllReservasAdmin = async (req, res, next) => {
  console.log('GETALLRESERVASADMIN CONTROLLER: Buscando todas as reservas...');
  try {
    const reservas = await Reserva.find()
      .populate('cliente_id', 'name email')
      .populate('sala_id', 'nome capacidade status')
      .sort({ createdAt: -1 });

    console.log('GETALLRESERVASADMIN CONTROLLER: Total de reservas encontradas:', reservas.length);
    res.status(200).json({
      status: 'success',
      results: reservas.length,
      data: {
        reservas,
      },
    });
  } catch (error) {
    console.error("ERRO EM GETALLRESERVASADMIN CONTROLLER:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar todas as reservas.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.updateReservaStatusAdmin = async (req, res, next) => {
  const reservaId = req.params.id;
  const newStatus = req.body ? req.body.status : undefined;

  console.log(` Iniciando. Reserva ID: ${reservaId}, Novo Status: ${newStatus}`); // LOG 1

  try {
    // 1. Verificar se o novo status foi fornecido e é válido
    if (!newStatus) {
      console.log(' Novo status não fornecido no corpo da requisição.'); // LOG 2A
      return res.status(400).json({
        status: 'fail',
        message: 'Novo status não fornecido no corpo da requisição.',
      });
    }

    console.log(' Validando novo status...'); // LOG 2B
    if (!Reserva.schema.path('status').enumValues.includes(newStatus)) {
      console.log(` Status "${newStatus}" é inválido.`); // LOG 3
      return res.status(400).json({
        status: 'fail',
        message: `Status "${newStatus}" inválido. Valores permitidos: ${Reserva.schema.path('status').enumValues.join(', ')}`,
      });
    }
    console.log(' Status validado. Tentando encontrar e atualizar a reserva...'); // LOG 4

    // 2. Encontrar e atualizar a reserva
    const reserva = await Reserva.findByIdAndUpdate(
      reservaId,
      { status: newStatus },
      { new: true, runValidators: true }
    )
    .populate('cliente_id', 'name email')
    .populate('sala_id', 'nome'); 

    console.log(' Operação findByIdAndUpdate concluída.'); // LOG 5

    // 3. Verificar se a reserva foi encontrada e atualizada
    if (!reserva) {
      console.log(` Reserva com ID ${reservaId} não encontrada.`); // LOG 6
      return res.status(404).json({ status: 'fail', message: 'Reserva não encontrada.' });
    }

    console.log(` Status da reserva ${reservaId} atualizado para "${newStatus}". Enviando resposta.`); // LOG 7
    res.status(200).json({
      status: 'success',
      message: 'Status da reserva atualizado com sucesso.',
      data: {
        reserva,
      },
    });
    console.log(' Resposta enviada.'); // LOG 8

  } catch (error) {
    console.error("ERRO DETALHADO EM ", error); // LOG 9
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ status: 'fail', message: 'ID de reserva inválido.'});
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar o status da reserva.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};