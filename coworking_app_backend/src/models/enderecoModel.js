const mongoose = require('mongoose');

const enderecoSchema = new mongoose.Schema(
  {
    // Campos do seu diagrama
    cep: {
      type: String,
      required: [true, 'O CEP é obrigatório.'],
      trim: true,
      // match: [/^\d{5}-?\d{3}$/, 'Formato de CEP inválido. Use XXXXX ou XXXXX-XXX'] // Validação de formato opcional
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
      // minlength: [2, 'O estado deve ter 2 caracteres.'], // Se quiser forçar UF
      // maxlength: [2, 'O estado deve ter 2 caracteres.'],
    },
    pais: {
      type: String,
      required: [true, 'O país é obrigatório.'],
      trim: true,
      default: 'Brasil',
    },
    // Campos essenciais adicionais não presentes explicitamente no seu diagrama de Endereco:
    rua: {
      type: String,
      required: [true, 'A rua é obrigatória.'],
      trim: true,
    },
    numero: {
      type: String, // String para permitir "S/N", "123 A", etc.
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