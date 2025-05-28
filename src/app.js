// src/app.js
const express = require('express');
const dotenv = require('dotenv'); // Se server.js já carrega, pode não ser necessário aqui.
const cors = require('cors');
// const connectDB = require('./config/db'); // connectDB é chamado em server.js

// Importar as rotas de autenticação
const authRoutes = require('./routes/authRoutes'); // <<< NOVA LINHA

// dotenv.config(); // Se server.js não fizer, descomente aqui

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rota de Teste
app.get('/', (req, res) => {
  res.send('API do Sistema de Coworking está rodando!');
});

// Usar as rotas de autenticação
// Todas as rotas definidas em authRoutes serão prefixadas com /api/auth
app.use('/api/auth', authRoutes); // <<< NOVA LINHA

// Futuramente, aqui virão as suas outras rotas:
// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/spaces', require('./routes/spaceRoutes'));
// etc.

module.exports = app;