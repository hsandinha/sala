const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Importar as rotas de autenticação
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const salaRoutes = require('./routes/salaRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const enderecoRoutes = require('./routes/enderecoRoutes'); 
const pagamentoRoutes = require('./routes/pagamentoRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Middleware de log (se você ainda o tem, pode manter ou remover)
app.use((req, res, next) => {
  console.log('----- Nova Requisição (app.js) -----');
  console.log('Método:', req.method);
  console.log('Caminho Original:', req.originalUrl);
  console.log('Corpo (req.body):', req.body);
  next();
});


// Rota de Teste
app.get('/', (req, res) => {
  res.send('API do Sistema de Coworking está rodando!');
});

app.use('/api/auth', authRoutes); 
app.use('/api/usuario', usuarioRoutes);
app.use('/api/salas', salaRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/enderecos', enderecoRoutes); 
app.use('/api/pagamentos', pagamentoRoutes);

module.exports = app;