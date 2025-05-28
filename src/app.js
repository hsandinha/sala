const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Importar as rotas de autenticação
const authRoutes = require('./routes/authRoutes');


const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rota de Teste
app.get('/', (req, res) => {
  res.send('API do Sistema de Coworking está rodando!');
});

app.use('/api/auth', authRoutes); 


module.exports = app;