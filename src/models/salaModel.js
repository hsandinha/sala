const mongoose = require('mongoose');

const diaHorarioSchema = new mongoose.Schema({
  aberto: { type: Boolean, default: true }, // Sala está aberta neste dia?
  inicio: { type: String, match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:MM'] }, // ex: "08:00"
  fim: { type: String, match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:MM'] }     // ex: "18:00"
}, { _id: false });

const periodoIndisponivelSchema = new mongoose.Schema({
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  motivo: { type: String, required: true, trim: true },

}, { _id: true }); 


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
        precoPorHora: {
      type: Number,
      required: [true, 'O preço por hora da sala é obrigatório.'],
      min: [0, 'O preço por hora não pode ser negativo.']
    },
    horarioFuncionamento: { // Horários padrão da sala
      segunda: diaHorarioSchema,
      terca: diaHorarioSchema,
      quarta: diaHorarioSchema,
      quinta: diaHorarioSchema,
      sexta: diaHorarioSchema,
      sabado: diaHorarioSchema,
      domingo: diaHorarioSchema,
    },
    periodosIndisponiveis: [periodoIndisponivelSchema],
    fotos: {
      type: [String], // Um array de URLs para as imagens da sala
      default: [],
    },
    comodidades: { // Recursos/Amenidades da sala
      type: [String], // Um array de strings, ex: ["Projetor", "Wi-Fi", "Quadro Branco", "Ar Condicionado"]
      default: [],
    }
  },
  
  {
    timestamps: true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }, 
  }
);


const Sala = mongoose.model('Sala', salaSchema);

module.exports = Sala;