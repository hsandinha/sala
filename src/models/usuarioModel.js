const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const usuarioSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'Por favor, informe seu nome.'],
    },
    email: {
      type: String,
      required: [true, 'Por favor, informe seu email.'],
      unique: true,
      lowercase: true,
    },
    senha: {
      type: String,
      required: [true, 'Por favor, informe sua senha.'],
      minlength: [6, 'A senha deve ter pelo menos 6 caracteres.'],
      select: false,
    },
    tipo_usuario: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    telefone: {
      type: String,
    },
    cpf_cnpj: {
      type: String,
    },
    endereco_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Endereco',
    },
     passwordResetToken: String,
     passwordResetExpires: Date,
  },
  {
    timestamps: true, 
  }
);


usuarioSchema.pre('save', async function (next) {
  // Só executa esta função se a senha foi modificada (ou é nova)
  if (!this.isModified('password')) return next();
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      next();
  });

usuarioSchema.pre('save', async function (next) {
  // Só executa esta função se a senha foi modificada (ou é nova)
  if (!this.isModified('senha')) return next();
      const salt = await bcrypt.genSalt(10);
      this.senha = await bcrypt.hash(this.senha, salt);
    next();
  });

// Método para comparar a senha candidata com a senha no banco
usuarioSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.senha);
};

usuarioSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutos
  return resetToken;
};


const Usuario = mongoose.model('Usuario', usuarioSchema, 'usuarios');

module.exports = Usuario;