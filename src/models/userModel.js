// src/models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
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
    password: {
      type: String,
      required: [true, 'Por favor, informe sua senha.'],
      minlength: [6, 'A senha deve ter pelo menos 6 caracteres.'],
      select: false, // Para não retornar a senha em queries por padrão
    },
    role: {
      type: String,
      enum: ['user', 'admin'], // Define os papéis possíveis
      default: 'user',
    },
    phone: {
      type: String,
      // required: false // Depende da sua regra de negócio
    },
    cpf_cnpj: {
      type: String,
      // required: false,
      // unique: true, // Se for único, precisa de tratamento para valores nulos/vazios
      // sparse: true, // Permite unique com valores nulos
    },
    // Campos para reset de senha (adicionaremos depois, se necessário para forgot-password)
    // passwordResetToken: String,
    // passwordResetExpires: Date,
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
  }
);

// Middleware (hook) do Mongoose: Executa ANTES de salvar o documento ('save')
userSchema.pre('save', async function (next) {
  // Só executa esta função se a senha foi modificada (ou é nova)
  if (!this.isModified('password')) return next();

  // Gera o "salt" e cria o hash da senha
  const salt = await bcrypt.genSalt(10); // O 10 é o "custo" do salt, um bom valor padrão
  this.password = await bcrypt.hash(this.password, salt);

  // Não vamos persistir o passwordConfirm no banco, se tivéssemos um campo assim.
  // this.passwordConfirm = undefined;
  next();
});

// Método de instância para comparar a senha candidata com a senha no banco
userSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword // userPassword é o hash que está no banco
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;