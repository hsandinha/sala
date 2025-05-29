// src/models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
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
userSchema.pre('save', async function (next) {
  // Só executa esta função se a senha foi modificada (ou é nova)
  if (!this.isModified('password')) return next();

  // Gera o "salt" e cria o hash da senha
  const salt = await bcrypt.genSalt(10); // O 10 é o "custo" do salt, um bom valor padrão
  this.password = await bcrypt.hash(this.password, salt);
  
  next();
});

// Método de instância para comparar a senha candidata com a senha no banco
userSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword // userPassword é o hash que está no banco
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  // 1. Gerar o token original (que seria enviado ao usuário)
  const resetToken = crypto.randomBytes(32).toString('hex');

  // 2. Hashear o token e salvar no documento do usuário
  // Este token hasheado é o que compararemos com o token que o usuário enviar
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 3. Definir o tempo de expiração do token (ex: 10 minutos a partir de agora)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutos em milissegundos

  console.log({ resetTokenOriginal: resetToken, passwordResetTokenHasheado: this.passwordResetToken }); // Para depuração

  // Retorna o token original (não hasheado), pois é este que o usuário usará
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;