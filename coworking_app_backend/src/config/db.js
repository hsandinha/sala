const mongoose = require('mongoose'); 

const connectDB = async () => {
  try {
    console.log('Tentando conectar com MONGO_URI:', process.env.MONGO_URI ? 'Definida' : 'NÃO DEFINIDA NO .ENV');

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI não está definida no arquivo .env');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    // Para depuração, vamos imprimir o objeto de erro completo também
    console.error('--- DETALHES COMPLETOS DO ERRO DE CONEXÃO ---');
    console.error(error); // Isso mostrará mais detalhes sobre o erro
    console.error('--- FIM DETALHES COMPLETOS DO ERRO ---');

    process.exit(1); 
  }
};

module.exports = connectDB;