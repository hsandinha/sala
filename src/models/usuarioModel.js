// src/models/userModel.js
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
      // Poderíamos adicionar uma validação de formato de email aqui se desejado
    },
    senha: {
      type: String,
      required: [true, 'Por favor, informe sua senha.'],
      minlength: [6, 'A senha deve ter pelo menos 6 caracteres.'],
      select: false, // Para não retornar a senha em queries por padrão
    },
    tipo_usuario: {
      type: String,
      enum: ['user', 'admin'], // Define os papéis possíveis
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
      ref: 'Endereco', // Referencia o model 'Endereco' que você criou
      // Não é 'required' porque um usuário pode não ter um endereço cadastrado inicialmente
    },
     passwordResetToken: String,
     passwordResetExpires: Date,
  },
  {
    timestamps: true, 
  }
);

// Middleware (hook) do Mongoose: Executa ANTES de salvar o documento ('save')
usuarioSchema.pre('save', async function (next) {
  // Só executa esta função se a senha foi modificada (ou é nova)
  if (!this.isModified('password')) return next();

  // Gera o "salt" e cria o hash da senha
  const salt = await bcrypt.genSalt(10); // O 10 é o "custo" do salt, um bom valor padrão
  this.password = await bcrypt.hash(this.password, salt);
  
  next();
});

// Middleware (hook) do Mongoose: Executa ANTES de salvar o documento ('save')
usuarioSchema.pre('save', async function (next) {
  // Só executa esta função se a senha foi modificada (ou é nova)
  if (!this.isModified('senha')) return next(); // ATUALIZADO para 'senha'

  // Gera o "salt" e cria o hash da senha
  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt); // ATUALIZADO para 'this.senha'

  next();
});

// Método de instância para comparar a senha candidata com a senha no banco
// O nome do método pode continuar 'comparePassword' ou mudar para 'compararSenha'
usuarioSchema.methods.comparePassword = async function (candidatePassword) {
  // 'this.senha' aqui se refere ao campo 'senha' (hasheado) do documento atual
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

// Definindo o model como 'Usuario' e especificando a coleção como 'usuarios'
const Usuario = mongoose.model('Usuario', usuarioSchema, 'usuarios');

module.exports = Usuario;