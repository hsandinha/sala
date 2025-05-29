const Reserva = require('../models/reservaModel');
const Sala = require('../models/salaModel');

// Helper para converter HH:MM para minutos totais desde o início do dia
const timeToMinutes = (timeStr) => {
  if (!timeStr || !timeStr.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper para obter o dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado) de forma consistente em UTC
const getUTCDayOfWeek = (date) => {
    // JavaScript getUTCDay() retorna 0 para Domingo, 1 para Segunda, etc.
    // Vamos mapear para: 0=Domingo, 1=Segunda, ... , 6=Sábado (já é o padrão do JS)
    return date.getUTCDay();
};
const diasDaSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

exports.createReserva = async (req, res, next) => {
  console.log('CREATERESERVA CONTROLLER: Tentando criar nova reserva com lógica avançada...');
  try {
    const { sala_id, data_reserva, hora_inicio, hora_fim } = req.body;
    const cliente_id = req.user.id;

    if (!sala_id || !data_reserva || !hora_inicio || !hora_fim) {
      return res.status(400).json({
        status: 'fail',
        message: 'Por favor, forneça ID da sala, data da reserva, hora de início e hora de fim.',
      });
    }

    const sala = await Sala.findById(sala_id);
    if (!sala) {
      return res.status(404).json({
        status: 'fail',
        message: 'Sala não encontrada com o ID fornecido.',
      });
    }

    if (sala.status !== 'disponivel') {
        return res.status(400).json({
            status: 'fail',
            message: `A sala '${sala.nome}' não está disponível para reserva (status atual: ${sala.status}).`
        });
    }

    // --- Construção e Validação de Datas/Horas da Requisição ---
    let parsedDataReserva = new Date(data_reserva); // Ex: "2025-12-20" -> Date object
    if (isNaN(parsedDataReserva.getTime())) {
        return res.status(400).json({ status: 'fail', message: 'Formato de data_reserva inválido.' });
    }
    // Normalizar para meia-noite UTC para evitar problemas de fuso horário ao adicionar horas/minutos
    parsedDataReserva = new Date(Date.UTC(parsedDataReserva.getUTCFullYear(), parsedDataReserva.getUTCMonth(), parsedDataReserva.getUTCDate()));

    const [startHours, startMinutes] = hora_inicio.split(':').map(Number);
    const [endHours, endMinutes] = hora_fim.split(':').map(Number);

    const requestStartDateTime = new Date(parsedDataReserva);
    requestStartDateTime.setUTCHours(startHours, startMinutes, 0, 0);

    const requestEndDateTime = new Date(parsedDataReserva);
    requestEndDateTime.setUTCHours(endHours, endMinutes, 0, 0);

    if (requestEndDateTime <= requestStartDateTime) {
      return res.status(400).json({
        status: 'fail',
        message: 'A hora de fim deve ser posterior à hora de início no mesmo dia.',
      });
    }
    
    // Verificar se a data da reserva não é no passado
    const hojeMeiaNoiteUTC = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
    if (parsedDataReserva < hojeMeiaNoiteUTC) {
        return res.status(400).json({
            status: 'fail',
            message: 'Não é possível fazer reservas para datas passadas.'
        });
    }

    // --- 1. VERIFICAR HORÁRIO DE FUNCIONAMENTO DA SALA ---
    if (sala.horarioFuncionamento) {
      const diaDaSemanaISO = getUTCDayOfWeek(requestStartDateTime); // 0 (Dom) - 6 (Sab)
      const nomeDiaSemana = diasDaSemana[diaDaSemanaISO];
      const horarioDia = sala.horarioFuncionamento[nomeDiaSemana];

      console.log(`Dia da reserva: ${nomeDiaSemana}, Horário de funcionamento do dia:`, horarioDia);

      if (!horarioDia || !horarioDia.aberto) {
        return res.status(400).json({
          status: 'fail',
          message: `A sala não está aberta para reservas neste dia da semana (${nomeDiaSemana}).`,
        });
      }

      const salaAbreMinutos = timeToMinutes(horarioDia.inicio);
      const salaFechaMinutos = timeToMinutes(horarioDia.fim);
      const reservaInicioMinutos = timeToMinutes(hora_inicio);
      const reservaFimMinutos = timeToMinutes(hora_fim);

      if (salaAbreMinutos === null || salaFechaMinutos === null || reservaInicioMinutos === null || reservaFimMinutos === null) {
          return res.status(500).json({ status: 'fail', message: 'Erro ao processar horários de funcionamento da sala.' });
      }

      if (reservaInicioMinutos < salaAbreMinutos || reservaFimMinutos > salaFechaMinutos) {
        return res.status(400).json({
          status: 'fail',
          message: `O horário solicitado (${hora_inicio} - ${hora_fim}) está fora do horário de funcionamento da sala para ${nomeDiaSemana} (${horarioDia.inicio} - ${horarioDia.fim}).`,
        });
      }
    } else {
        console.warn(`Sala ${sala.nome} não possui horário de funcionamento definido. Pulando esta checagem.`);
    }

    // --- 2. VERIFICAR PERÍODOS INDISPONÍVEIS (MANUTENÇÃO/BLOQUEIOS) ---
    if (sala.periodosIndisponiveis && sala.periodosIndisponiveis.length > 0) {
      for (const periodo of sala.periodosIndisponiveis) {
        // Checar sobreposição: (StartA < EndB) and (EndA > StartB)
        if (requestStartDateTime < periodo.endDateTime && requestEndDateTime > periodo.startDateTime) {
          return res.status(409).json({ // 409 Conflict
            status: 'fail',
            message: `A sala está indisponível no período solicitado devido a: ${periodo.motivo} (de ${periodo.startDateTime.toISOString()} a ${periodo.endDateTime.toISOString()}).`,
          });
        }
      }
    }

    // --- 3. VERIFICAR CONFLITOS COM OUTRAS RESERVAS (Lógica já existente) ---
    const conflictingReservation = await Reserva.findOne({
      sala_id: sala_id,
      status: { $nin: ['cancelada_pelo_usuario', 'cancelada_pelo_admin'] },
      $or: [
        { startDateTime: { $lt: requestEndDateTime }, endDateTime: { $gt: requestStartDateTime } },
      ],
    });

    if (conflictingReservation) {
      return res.status(409).json({
        status: 'fail',
        message: 'A sala não está disponível no horário solicitado. Já existe uma reserva.',
        conflictingReservationId: conflictingReservation._id
      });
    }
    console.log('CREATERESERVA CONTROLLER: Sala disponível. Calculando preço...');

    // --- 4. CALCULAR PREÇO ---
    if (typeof sala.precoPorHora !== 'number' || sala.precoPorHora < 0) {
        return res.status(500).json({ // Erro de configuração da sala
            status: 'error',
            message: 'Erro na configuração de preço da sala. Contate o administrador.'
        });
    }
    const duracaoMs = requestEndDateTime.getTime() - requestStartDateTime.getTime();
    const duracaoHoras = duracaoMs / (1000 * 60 * 60);
    // Política de arredondamento: Arredondar para cima para a próxima meia hora ou hora cheia?
    // Por simplicidade, vamos usar frações de hora. Ou arredondar para cima para o próximo bloco (ex: 1.2h vira 1.5h ou 2h)
    // Exemplo: arredondar para o próximo múltiplo de 0.5 horas (meia hora)
    const duracaoHorasArredondada = Math.ceil(duracaoHoras * 2) / 2;
    const valorTotalCalculado = duracaoHorasArredondada * sala.precoPorHora;

    console.log(`CREATERESERVA CONTROLLER: Duração: ${duracaoHoras}h, Arredondada: ${duracaoHorasArredondada}h, Preço/h: ${sala.precoPorHora}, Total: ${valorTotalCalculado}`);

    // --- 5. CRIAR A NOVA RESERVA ---
    const novaReserva = await Reserva.create({
      cliente_id,
      sala_id,
      data_reserva: parsedDataReserva,
      hora_inicio,
      hora_fim,
      total_valor: valorTotalCalculado, // Salva o valor calculado
      // startDateTime e endDateTime serão preenchidos pelo hook pre-save no model
      // protocolo será gerado pelo hook
      // status usará o default 'pendente_pagamento'
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
    if (error.nome === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ status: 'fail', message: messages.join(' ') });
    }
    if (error.nome === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ status: 'fail', message: 'ID de sala inválido.' });
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
    if (error.nome === 'CastError' && error.kind === 'ObjectId') {
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
      .populate('cliente_id', 'nome email')
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
    .populate('cliente_id', 'nome email')
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
    if (error.nome === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ status: 'fail', message: 'ID de reserva inválido.'});
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar o status da reserva.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};