// src/models/pagamentoModel.js
const mongoose = require('mongoose');

const pagamentoSchema = new mongoose.Schema(
  {
    data_pagamento: {
      type: Date,
      required: [true, 'A data do pagamento é obrigatória.'],
      default: Date.now, // Preenche com a data atual por padrão
    },
    status: {
      type: String,
      required: [true, 'O status do pagamento é obrigatório.'],
      enum: {
        values: ['pendente', 'pago', 'falhou', 'reembolsado', 'cancelado'],
        message: 'Status de pagamento inválido.',
      },
      default: 'pendente', // Um pagamento pode começar como pendente
    },
    valor: {
      type: Number,
      required: [true, 'O valor do pagamento é obrigatório.'],
      min: [0.01, 'O valor do pagamento deve ser positivo.'], // Exemplo de valor mínimo
    },
    metodo_pagamento: {
      type: String,
      required: [true, 'O método de pagamento é obrigatório.'],
      enum: {
        values: ['cartao_credito', 'cartao_debito', 'pix', 'boleto', 'transferencia', 'dinheiro_local'],
        message: 'Método de pagamento inválido.',
      },
    },
    id_transacao_gateway: { // ID da transação no provedor de pagamento externo (Stripe, PayPal, etc.)
      type: String,
      trim: true,
    },
    reserva_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reserva', // Referencia o model Reserva
      required: [true, 'A reserva associada ao pagamento é obrigatória.'],
    },
    cliente_id: { // Para saber quem fez o pagamento
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',  // Referencia o model User
      required: [true, 'O cliente associado ao pagamento é obrigatório.'],
    },
    gateway_response: {
      type: mongoose.Schema.Types.Mixed, 
    }
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt
  }
);

// Índices
pagamentoSchema.index({ reserva_id: 1 });
pagamentoSchema.index({ cliente_id: 1 });
pagamentoSchema.index({ status: 1 });

const Pagamento = mongoose.model('Pagamento', pagamentoSchema);

module.exports = Pagamento;