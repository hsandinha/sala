const Pagamento = require('../models/pagamentoModel');
const Reserva = require('../models/reservaModel');
const User = require('../models/usuarioModel');

exports.createPagamentoParaReserva = async (req, res, next) => {
  const { reservaId } = req.params; // ID da reserva vindo da URL
  const clienteId = req.user.id;    
  const { valor, metodo_pagamento, id_transacao_gateway, gateway_response } = req.body; 

  console.log(`CREATEPAGAMENTOPARARESERVA: Usuário ${clienteId} tentando pagar reserva ${reservaId}`);
  console.log('Dados do pagamento recebidos:', req.body);

  try {
    // 1. Buscar a reserva
    const reserva = await Reserva.findById(reservaId);

    // 2. Verificar se a reserva existe
    if (!reserva) {
      return res.status(404).json({
        status: 'fail',
        message: 'Reserva não encontrada com o ID fornecido.',
      });
    }

    // 3. Verificar se a reserva pertence ao usuário logado
    if (reserva.cliente_id.toString() !== clienteId) {
      return res.status(403).json({ // Forbidden
        status: 'fail',
        message: 'Você não tem permissão para pagar por esta reserva.',
      });
    }

    // 4. Verificar o status da reserva (só pode pagar se estiver, por exemplo, 'pendente_pagamento')
    if (reserva.status !== 'pendente_pagamento') {
      let message = `Esta reserva não pode ser paga. Status atual: ${reserva.status}.`;
      if (reserva.status === 'confirmada') {
        message = 'Esta reserva já foi confirmada/paga.';
      } else if (reserva.status === 'cancelada_pelo_usuario' || reserva.status === 'cancelada_pelo_admin') {
        message = 'Esta reserva está cancelada e não pode ser paga.';
      }
      return res.status(400).json({
        status: 'fail',
        message: message,
      });
    }

    // 5. Validar dados do pagamento (valor e metodo_pagamento são obrigatórios no model)
    if (!valor || !metodo_pagamento) {
        return res.status(400).json({
            status: 'fail',
            message: 'Valor e método de pagamento são obrigatórios.'
        });
    }

    // 6. Criar o documento de Pagamento
    const novoPagamento = await Pagamento.create({
      reserva_id: reservaId,
      cliente_id: clienteId,
      valor, 
      metodo_pagamento, 
      status: 'pago', 
      id_transacao_gateway: id_transacao_gateway || `sim_${Date.now()}`,
      gateway_response: gateway_response || { simulation: 'success', timestamp: new Date() }, 
    });
    console.log(`CREATEPAGAMENTOPARARESERVA: Pagamento ${novoPagamento._id} criado para reserva ${reservaId}.`);

    // Atualiza a reserva: vincular o pagamento_id e mudar status para 'confirmada'
    reserva.pagamento_id = novoPagamento._id;
    reserva.status = 'confirmada';
    await reserva.save();
    console.log(`CREATEPAGAMENTOPARARESERVA: Reserva ${reservaId} atualizada com pagamento_id e status 'confirmada'.`);

    // 8. Enviar resposta de sucesso
    res.status(201).json({ 
      status: 'success',
      message: 'Pagamento registrado e reserva confirmada com sucesso.',
      data: {
        pagamento: novoPagamento,
        reserva: reserva, 
      },
    });

  } catch (error) {
    console.error("ERRO EM CREATEPAGAMENTOPARARESERVA:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'fail',
        message: messages.join(' '),
      });
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
      .populate('cliente_id', 'name email')
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
      .populate('cliente_id', 'name email')
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
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
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
    .populate('cliente_id', 'name email')
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
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ status: 'fail', message: 'ID de pagamento inválido.'});
    }
    if (error.name === 'ValidationError') {
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