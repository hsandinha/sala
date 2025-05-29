// src/models/salaModel.js
const mongoose = require('mongoose');

const salaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'O nome da sala é obrigatório.'],
      trim: true, // Remove espaços em branco no início e fim
      maxlength: [100, 'O nome da sala não pode exceder 100 caracteres.'],
    },
    descricao: {
      type: String,
      required: [true, 'A descrição da sala é obrigatória.'],
      trim: true,
      maxlength: [1000, 'A descrição da sala não pode exceder 1000 caracteres.'],
    },
    capacidade: {
      type: Number,
      required: [true, 'A capacidade da sala é obrigatória.'],
      min: [1, 'A capacidade da sala deve ser de pelo menos 1.'],
    },
    // O diagrama indica 'categoria_id: long'.
    // No Mongoose, se isso se refere a outra coleção (ex: 'CategoriasSalas'), usamos ObjectId.
    // Se for apenas um identificador simples, poderia ser String ou Number.
    // Vamos assumir que pode ser uma referência a uma futura coleção de categorias.
    categoria_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CategoriaSala', // Referencia um model 'CategoriaSala' (que precisaríamos criar se quisermos popular isso)
      // required: [true, 'A categoria da sala é obrigatória.'] // Tornar obrigatório se sempre houver uma categoria
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['disponivel', 'ocupada', 'manutencao', 'indisponivel'],
        message: 'O status da sala deve ser: disponivel, ocupada, manutencao ou indisponivel.',
      },
      default: 'disponivel',
    },
    // Outros campos que podem ser úteis (não estritamente no diagrama, mas comuns):
    // precoPorHora: Number, // Se a precificação for simples e por sala
    // fotos: [String], // Array de URLs de fotos
    // comodidades: [String], // Ex: ['projetor', 'wifi', 'quadro']
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt
    toJSON: { virtuals: true }, // Para incluir virtuais quando convertido para JSON
    toObject: { virtuals: true }, // Para incluir virtuais quando convertido para objeto
  }
);

// Índices (podem ser adicionados depois para otimizar buscas)
// salaSchema.index({ nome: 1 });
// salaSchema.index({ status: 1 });

const Sala = mongoose.model('Sala', salaSchema);

module.exports = Sala;