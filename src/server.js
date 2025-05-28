const app = require('./app');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config({ path: './.env' }); // Especifica o caminho se .env não estiver na raiz onde node é chamado

// Conecta ao Banco de Dados MongoDB
connectDB();

const PORT = process.env.PORT || 5000; // Usa a porta do .env ou 5000 como padrão

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando em ambiente ${process.env.NODE_ENV} na porta ${PORT}`);
});

// Lidar com rejeições de promise não tratadas (opcional, mas bom para robustez)
process.on('unhandledRejection', (err, promise) => {
  console.error(`Erro: ${err.message}`);
  // Fecha o servidor e sai
  server.close(() => process.exit(1));
});