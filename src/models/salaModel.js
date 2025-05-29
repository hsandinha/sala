const mongoose = require('mongoose');

const salaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'O nome da sala é obrigatório.'],
      trim: true,
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
    categoria_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CategoriaSala', 
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
    // apos entrega implementar fotos, recursos da sala( como projetor, wifi), preço por hora
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }, 
  }
);


const Sala = mongoose.model('Sala', salaSchema);

module.exports = Sala;