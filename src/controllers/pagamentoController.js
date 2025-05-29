// src/controllers/pagamentoController.js
const Pagamento = require('../models/pagamentoModel');
const Reserva = require('../models/reservaModel'); // Precisamos do Reserva model para buscar e atualizar a reserva
const User = require('../models/usuarioModel'); // Para verificar o cliente

// @desc    Cliente cria um novo pagamento para uma reserva específica
// @route   POST /api/reservas/:reservaId/pagamentos
// @access  Private (usuário logado)
exports.createPagamentoParaReserva = async (req, res, next) => {
  const { reservaId } = req.params; // ID da reserva vindo da URL
  const clienteId = req.user.id;    // ID do cliente logado (do middleware 'protect')
  const { valor, metodo_pagamento, id_transacao_gateway, gateway_response } = req.body; // Dados do pagamento

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
    // Em um cenário real, o 'valor' deveria ser validado contra o preço calculado da reserva.
    // Por simplicidade, estamos aceitando o valor enviado no corpo.

    // 6. Criar o documento de Pagamento
    // Assumimos que o pagamento é bem-sucedido imediatamente (simulação)
    const novoPagamento = await Pagamento.create({
      reserva_id: reservaId,
      cliente_id: clienteId,
      valor, // Valor recebido do req.body
      metodo_pagamento, // Método recebido do req.body
      status: 'pago', // Marcamos como 'pago' diretamente, pois estamos simulando
      id_transacao_gateway: id_transacao_gateway || `sim_${Date.now()}`, // Simulação de ID de transação
      gateway_response: gateway_response || { simulation: 'success', timestamp: new Date() }, // Simulação de resposta
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
      .populate('cliente_id', 'name email') // Popula nome e email do cliente
      .populate('reserva_id', 'protocolo data_reserva status') // Popula alguns dados da reserva
      .sort({ createdAt: -1 }); // Ordena pelos mais recentes

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

// @desc    (Admin) Obter detalhes de um pagamento específico pelo ID
// @route   GET /api/pagamentos/admin/:id
// @access  Private/Admin
exports.getPagamentoByIdAdmin = async (req, res, next) => {
  const pagamentoId = req.params.id;
  console.log(`GETPAGAMENTOBYIDADMIN: Admin buscando pagamento com ID: ${pagamentoId}`);
  try {
    const pagamento = await Pagamento.findById(pagamentoId)
      .populate('cliente_id', 'name email')
      .populate('reserva_id', 'protocolo data_reserva status sala_id'); // Popula mais dados da reserva, incluindo sala_id

    if (!pagamento) {
      console.log(`GETPAGAMENTOBYIDADMIN: Pagamento com ID ${pagamentoId} não encontrado.`);
      return res.status(404).json({
        status: 'fail',
        message: 'Pagamento não encontrado com este ID.',
      });
    }

    // Se quiser popular também os detalhes da sala da reserva:
    // await Pagamento.populate(pagamento, { path: 'reserva_id.sala_id', select: 'nome capacidade' });
    // Ou fazer um populate aninhado diretamente: .populate({ path: 'reserva_id', populate: { path: 'sala_id', select: 'nome' }})

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
  const { status: newStatus } = req.body; // Pega o novo status do corpo da requisição

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
    //    Popula os dados referenciados para retornar o pagamento completo e atualizado.
    const pagamentoAtualizado = await Pagamento.findByIdAndUpdate(
      pagamentoId,
      { status: newStatus }, // Apenas o campo status é atualizado
      { new: true, runValidators: true } // new:true retorna o doc atualizado, runValidators para o enum
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
    // O erro de ValidationError já é tratado pela checagem do enum acima para o status.
    // Outros ValidationErrors (se houver) seriam pegos aqui.
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