// src/models/pagamentoModel.js
const mongoose = require('mongoose');

const pagamentoSchema = new mongoose.Schema(
  {
    data_pagamento: {
      type: Date,
      required: [true, 'A data do pagamento é obrigatória.'],
      default: Date.now, 
    },
    status: {
      type: String,
      required: [true, 'O status do pagamento é obrigatório.'],
      enum: {
        values: ['pendente', 'pago', 'falhou', 'reembolsado', 'cancelado'],
        message: 'Status de pagamento inválido.',
      },
      default: 'pendente', 
    },
    valor: {
      type: Number,
      required: [true, 'O valor do pagamento é obrigatório.'],
      min: [0.01, 'O valor do pagamento deve ser positivo.'], 
    },
    metodo_pagamento: {
      type: String,
      required: [true, 'O método de pagamento é obrigatório.'],
      enum: {
        values: ['cartao_credito', 'cartao_debito', 'pix', 'boleto', 'transferencia', 'dinheiro_local'],
        message: 'Método de pagamento inválido.',
      },
    },
    id_transacao_gateway: { 
      type: String,
      trim: true,
    },
    reserva_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reserva',
      required: [true, 'A reserva associada ao pagamento é obrigatória.'],
    },
    cliente_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',  
      required: [true, 'O cliente associado ao pagamento é obrigatório.'],
    },
    gateway_response: {
      type: mongoose.Schema.Types.Mixed, 
    }
  },
  {
    timestamps: true,
  }
);

// Índices
pagamentoSchema.index({ reserva_id: 1 });
pagamentoSchema.index({ cliente_id: 1 });
pagamentoSchema.index({ status: 1 });

const Pagamento = mongoose.model('Pagamento', pagamentoSchema);

module.exports = Pagamento;