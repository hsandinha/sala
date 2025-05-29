const mongoose = require('mongoose');

const enderecoSchema = new mongoose.Schema(
  {
    cep: {
      type: String,
      required: [true, 'O CEP é obrigatório.'],
      trim: true,
    },
    bairro: {
      type: String,
      required: [true, 'O bairro é obrigatório.'],
      trim: true,
    },
    cidade: {
      type: String,
      required: [true, 'A cidade é obrigatória.'],
      trim: true,
    },
    estado: {
      type: String,
      required: [true, 'O estado é obrigatório.'],
      trim: true,
      uppercase: true,
    },
    pais: {
      type: String,
      required: [true, 'O país é obrigatório.'],
      trim: true,
      default: 'Brasil',
    },
    rua: {
      type: String,
      required: [true, 'A rua é obrigatória.'],
      trim: true,
    },
    numero: {
      type: String,
      required: [true, 'O número é obrigatório.'],
      trim: true,
    },
    complemento: {
      type: String,
      trim: true,
    },

    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      unique: true, 
    },
  },
  {
    timestamps: true, 
  }
);


const Endereco = mongoose.model('Endereco', enderecoSchema);

module.exports = Endereco;