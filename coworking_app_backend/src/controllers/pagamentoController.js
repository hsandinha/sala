const Pagamento = require('../models/pagamentoModel');
const Reserva = require('../models/reservaModel');
const User = require('../models/userModel');

exports.createPagamentoParaReserva = async (req, res, next) => {
  const { reservaId } = req.params;
  const clienteId = req.user.id;
  // NÃO PEGAMOS MAIS 'valor' do req.body. Apenas metodo_pagamento e detalhes do gateway.
  const { metodo_pagamento, id_transacao_gateway, gateway_response } = req.body;

  console.log(`CREATEPAGAMENTOPARARESERVA: Usuário ${clienteId} tentando pagar reserva ${reservaId}`);
  console.log('Dados do pagamento (parcial) recebidos:', req.body);

  try {
    const reserva = await Reserva.findById(reservaId);

    if (!reserva) {
      return res.status(404).json({ status: 'fail', message: 'Reserva não encontrada.' });
    }
    if (reserva.cliente_id.toString() !== clienteId) {
      return res.status(403).json({ status: 'fail', message: 'Você não tem permissão para pagar por esta reserva.' });
    }
    if (reserva.status !== 'pendente_pagamento') {
      // ... (lógica de status da reserva existente)
      let message = `Esta reserva não pode ser paga. Status atual: ${reserva.status}.`;
      if (reserva.status === 'confirmada') message = 'Esta reserva já foi confirmada/paga.';
      else if (['cancelada_pelo_usuario', 'cancelada_pelo_admin'].includes(reserva.status)) message = 'Esta reserva está cancelada e não pode ser paga.';
      return res.status(400).json({ status: 'fail', message });
    }

    // Validar se metodo_pagamento foi fornecido
    if (!metodo_pagamento) {
        return res.status(400).json({ status: 'fail', message: 'Método de pagamento é obrigatório.' });
    }

    // Usar o valor total calculado e salvo na reserva
    const valorAPagar = reserva.total_valor;
    if (typeof valorAPagar !== 'number' || valorAPagar <= 0) {
        // Isso indica um problema na criação da reserva ou na configuração de preço da sala
        console.error(`CREATEPAGAMENTOPARARESERVA: Reserva ${reservaId} com total_valor inválido: ${valorAPagar}`);
        return res.status(500).json({ status: 'error', message: 'Erro no valor da reserva. Contate o suporte.' });
    }

    const novoPagamento = await Pagamento.create({
      reserva_id: reservaId,
      cliente_id: clienteId,
      valor: valorAPagar,
      metodo_pagamento,
      status: 'pago',
      id_transacao_gateway: id_transacao_gateway || `sim_${Date.now()}`,
      gateway_response: gateway_response || { simulation: 'success', timestamp: new Date() },
    });
    console.log(`CREATEPAGAMENTOPARARESERVA: Pagamento ${novoPagamento._id} criado para reserva ${reservaId}.`);

    reserva.pagamento_id = novoPagamento._id;
    reserva.status = 'confirmada';
    await reserva.save({validateBeforeSave: false});
    console.log(`CREATEPAGAMENTOPARARESERVA: Reserva ${reservaId} atualizada com pagamento_id e status 'confirmada'.`);

    res.status(201).json({
      status: 'success',
      message: 'Pagamento registrado e reserva confirmada com sucesso.',
      data: {
        pagamento: novoPagamento,
        reserva: reserva,
      },
    });

  } catch (error) {
    // ... (tratamento de erro existente)
    console.error("ERRO EM CREATEPAGAMENTOPARARESERVA:", error);
    if (error.nome === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ status: 'fail', message: messages.join(' ') });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao processar o pagamento da reserva.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getAllPagamentosAdmin = async (req, res, next) => {
  console.log('GETALLPAGAMENTOSADMIN: Admin buscando todos os pagamentos...');
  try {
    const pagamentos = await Pagamento.find()
      .populate('cliente_id', 'nome email')
      .populate('reserva_id', 'protocolo data_reserva status')
      .sort({ createdAt: -1 });

    console.log('GETALLPAGAMENTOSADMIN: Total de pagamentos encontrados:', pagamentos.length);
    res.status(200).json({
      status: 'success',
      results: pagamentos.length,
      data: {
        pagamentos,
      },
    });
  } catch (error) {
    console.error("ERRO EM GETALLPAGAMENTOSADMIN:", error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar todos os pagamentos.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getPagamentoByIdAdmin = async (req, res, next) => {
  const pagamentoId = req.params.id;
  console.log(`GETPAGAMENTOBYIDADMIN: Admin buscando pagamento com ID: ${pagamentoId}`);
  try {
    const pagamento = await Pagamento.findById(pagamentoId)
      .populate('cliente_id', 'nome email')
      .populate('reserva_id', 'protocolo data_reserva status sala_id');

    if (!pagamento) {
      console.log(`GETPAGAMENTOBYIDADMIN: Pagamento com ID ${pagamentoId} não encontrado.`);
      return res.status(404).json({
        status: 'fail',
        message: 'Pagamento não encontrado com este ID.',
      });
    }


    console.log(`GETPAGAMENTOBYIDADMIN: Pagamento ${pagamento._id} encontrado.`);
    res.status(200).json({
      status: 'success',
      data: {
        pagamento,
      },
    });
  } catch (error) {
    console.error("ERRO EM GETPAGAMENTOBYIDADMIN:", error);
    if (error.nome === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        status: 'fail',
        message: 'ID de pagamento inválido.',
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar detalhes do pagamento.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.updatePagamentoStatusAdmin = async (req, res, next) => {
  const pagamentoId = req.params.id;
  const { status: newStatus } = req.body; 
  console.log(`UPDATEPAGAMENTOSTATUSADMIN: Admin tentando atualizar status do pagamento ${pagamentoId} para "${newStatus}"`);

  try {
    // 1. Verificar se o novo status foi fornecido
    if (!newStatus) {
      return res.status(400).json({
        status: 'fail',
        message: 'Novo status não fornecido no corpo da requisição.',
      });
    }

    // 2. Verificar se o novo status é um valor válido do enum definido no Pagamento model
    if (!Pagamento.schema.path('status').enumValues.includes(newStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: `Status "${newStatus}" inválido. Valores permitidos: ${Pagamento.schema.path('status').enumValues.join(', ')}`,
      });
    }
    console.log(`UPDATEPAGAMENTOSTATUSADMIN: Status "${newStatus}" validado. Tentando encontrar e atualizar o pagamento...`);

    // 3. Encontrar e atualizar o pagamento
    const pagamentoAtualizado = await Pagamento.findByIdAndUpdate(
      pagamentoId,
      { status: newStatus }, 
      { new: true, runValidators: true }
    )
    .populate('cliente_id', 'nome email')
    .populate('reserva_id', 'protocolo data_reserva status');

    // 4. Verificar se o pagamento foi encontrado e atualizado
    if (!pagamentoAtualizado) {
      console.log(`UPDATEPAGAMENTOSTATUSADMIN: Pagamento com ID ${pagamentoId} não encontrado.`);
      return res.status(404).json({ status: 'fail', message: 'Pagamento não encontrado com este ID.' });
    }

    console.log(`UPDATEPAGAMENTOSTATUSADMIN: Status do pagamento ${pagamentoId} atualizado para "${newStatus}".`);
    res.status(200).json({
      status: 'success',
      message: 'Status do pagamento atualizado com sucesso.',
      data: {
        pagamento: pagamentoAtualizado,
      },
    });

  } catch (error) {
    console.error("ERRO EM UPDATEPAGAMENTOSTATUSADMIN:", error);
    if (error.nome === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ status: 'fail', message: 'ID de pagamento inválido.'});
    }
    if (error.nome === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({
            status: 'fail',
            message: messages.join(' ')
        });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar o status do pagamento.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.registrarPagamentoManualAdmin = async (req, res, next) => {
  // Dados esperados no corpo: reserva_id, valor, metodo_pagamento, (opcional: data_pagamento, observacoes_admin)
  const { reserva_id, valor, metodo_pagamento, data_pagamento, observacoes_admin } = req.body;
  const adminId = req.user.id; // ID do admin que está registrando

  console.log(`REGISTRARPAGAMENTOMANUAL: Admin ${adminId} tentando registrar pagamento manual.`);
  console.log('Dados recebidos:', req.body);

  try {
    // 1. Validar entradas básicas
    if (!reserva_id || !valor || !metodo_pagamento) {
      return res.status(400).json({
        status: 'fail',
        message: 'Por favor, forneça ID da reserva, valor e método de pagamento.',
      });
    }

    // 2. Buscar a reserva para obter o cliente_id e verificar o status
    const reserva = await Reserva.findById(reserva_id);
    if (!reserva) {
      return res.status(404).json({
        status: 'fail',
        message: 'Reserva não encontrada com o ID fornecido.',
      });
    }

    // Opcional: Verificar se a reserva já tem um pagamento ou se o status permite novo pagamento
    if (reserva.status === 'confirmada' && reserva.pagamento_id) {
        console.warn(`REGISTRARPAGAMENTOMANUAL: Reserva ${reserva_id} já está confirmada e possui um pagamento. Verifique se um novo pagamento é realmente necessário.`);
        // Poderia impedir ou permitir múltiplos pagamentos dependendo da regra de negócio
    }
    if (reserva.status === 'cancelada_pelo_usuario' || reserva.status === 'cancelada_pelo_admin') {
        return res.status(400).json({
            status: 'fail',
            message: `A reserva ${reserva_id} está cancelada e não pode receber pagamentos.`
        });
    }


    // 3. Criar o documento de Pagamento
    const novoPagamento = await Pagamento.create({
      reserva_id,
      cliente_id: reserva.cliente_id, // Pega o cliente_id da reserva
      valor,
      metodo_pagamento,
      status: 'pago', // Pagamento manual geralmente é registrado como 'pago'
      data_pagamento: data_pagamento || Date.now(), // Usa a data fornecida ou a data atual
      id_transacao_gateway: `manual_${adminId}_${Date.now()}`, // Identificador para pagamento manual
      gateway_response: { 
        registered_by: adminId,
        notes: observacoes_admin || 'Pagamento registrado manualmente pelo administrador.',
        timestamp: new Date()
      },
    });
    console.log(`REGISTRARPAGAMENTOMANUAL: Pagamento manual ${novoPagamento._id} criado para reserva ${reserva_id}.`);

    // 4. Atualizar a reserva: vincular o pagamento_id e mudar status para 'confirmada'
    reserva.pagamento_id = novoPagamento._id;
    reserva.status = 'confirmada'; // Assume que o pagamento manual confirma a reserva
    await reserva.save({ validateBeforeSave: false }); // Evita revalidar campos não alterados na reserva
    console.log(`REGISTRARPAGAMENTOMANUAL: Reserva ${reserva_id} atualizada com pagamento_id e status 'confirmada'.`);

    // 5. Enviar resposta de sucesso
    res.status(201).json({ // 201 Created para o recurso de pagamento
      status: 'success',
      message: 'Pagamento manual registrado e reserva confirmada com sucesso.',
      data: {
        pagamento: novoPagamento,
        reserva: reserva, // Retorna a reserva atualizada
      },
    });

  } catch (error) {
    console.error("ERRO EM REGISTRARPAGAMENTOMANUAL:", error);
    if (error.nome === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'fail',
        message: messages.join(' '),
      });
    }
    if (error.nome === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ status: 'fail', message: 'ID de reserva inválido.'});
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao registrar o pagamento manual.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};