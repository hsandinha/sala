// src/models/reservaModel.js
const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema(
  {
    data_reserva: { // Data que o usuário seleciona
      type: Date,
      required: [true, 'A data da reserva é obrigatória.'],
    },
    hora_inicio: { // Hora que o usuário seleciona (ex: "14:00")
      type: String,
      required: [true, 'A hora de início da reserva é obrigatória.'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido. Use HH:MM.'],
    },
    hora_fim: { // Hora que o usuário seleciona (ex: "16:00")
      type: String,
      required: [true, 'A hora de fim da reserva é obrigatória.'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido. Use HH:MM.'],
    },
    // NOVOS CAMPOS PARA ARMAZENAR DATA/HORA COMBINADAS
    startDateTime: {
      type: Date,
      // Será populado pelo hook pre-save
    },
    endDateTime: {
      type: Date,
      // Será populado pelo hook pre-save
    },
    protocolo: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['pendente_pagamento', 'confirmada', 'cancelada_pelo_usuario', 'cancelada_pelo_admin', 'concluida', 'nao_compareceu'],
        message: 'Status inválido para a reserva.',
      },
      default: 'pendente_pagamento',
    },
    cliente_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O cliente da reserva é obrigatório.'],
    },
    sala_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sala',
      required: [true, 'A sala da reserva é obrigatória.'],
    },
    pagamento_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pagamento',
    },
  },
  {
    timestamps: true,
  }
);

// Hook pre-save para gerar protocolo e construir startDateTime/endDateTime
reservaSchema.pre('save', function(next) {
  // Gerar protocolo se não existir
  if (!this.protocolo) {
    const timestamp = Date.now().toString().slice(-6);
    const randomDigits = Math.floor(100 + Math.random() * 900).toString();
    this.protocolo = `RES-${timestamp}-${randomDigits}`;
  }

  // Construir startDateTime e endDateTime a partir de data_reserva, hora_inicio, hora_fim
  // Isso assume que data_reserva já é um objeto Date do JS com a data correta (sem considerar fuso horário de forma complexa aqui)
  // e hora_inicio/hora_fim são strings "HH:MM"
  if (this.data_reserva && this.hora_inicio && this.hora_fim) {
    const [startHours, startMinutes] = this.hora_inicio.split(':').map(Number);
    const [endHours, endMinutes] = this.hora_fim.split(':').map(Number);

    // Cria uma cópia da data da reserva para não modificar a original
    const startDate = new Date(this.data_reserva.getTime());
    startDate.setUTCHours(startHours, startMinutes, 0, 0); // Usar UTC para consistência
    this.startDateTime = startDate;

    const endDate = new Date(this.data_reserva.getTime());
    endDate.setUTCHours(endHours, endMinutes, 0, 0);
    // Se o horário final passar da meia-noite (ex: reserva das 23:00 às 01:00)
    // Isso precisaria de uma lógica mais complexa para adicionar um dia à data final.
    // Por simplicidade, vamos assumir que a reserva termina no mesmo dia.
    // Uma validação no controller pode impedir que hora_fim seja menor que hora_inicio se no mesmo dia.
    if (endDate <= startDate) {
        // Se for o caso de terminar no dia seguinte ou horário inválido, tratar no controller ou aqui.
        // Por ora, se terminar antes ou no mesmo horário, pode ser um problema, mas a query de conflito pegaria.
        // Para uma reserva que cruza a meia-noite, endDate.setDate(endDate.getDate() + 1) seria necessário.
        // Vamos manter simples por enquanto e validar no controller que hora_fim > hora_inicio.
    }
    this.endDateTime = endDate;
  }
  next();
});

// Índices
reservaSchema.index({ cliente_id: 1, data_reserva: -1 });
reservaSchema.index({ sala_id: 1, startDateTime: 1, endDateTime: 1 });

const Reserva = mongoose.model('Reserva', reservaSchema);

module.exports = Reserva;