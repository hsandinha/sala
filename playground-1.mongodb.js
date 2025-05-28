use('sistemaCoworkingDB');

print("Iniciando a criação da modelagem e inserção de dados de exemplo (modelo atualizado)...");


// 1. Coleção: enderecos
print("\n--- Inserindo endereços (enderecos) ---");
const enderecoCliente1Result = db.getCollection('enderecos').insertOne({
  cep: "30130-000",
  bairro: "Centro",
  cidade: "Belo Horizonte",
  estado: "MG",
  pais: "Brasil",
  createdAt: new Date(),
  updatedAt: new Date()
});
const enderecoCliente1Id = enderecoCliente1Result.insertedId;
print(`Endereço 1 inserido com _id: ${enderecoCliente1Id}`);


// 2.usuarios (Clientes e Administradores)
print("\n--- Inserindo usuários (usuarios) ---");

const adminUserResult = db.getCollection('usuarios').insertOne({
  nome: "Alice Administradora Global",
  email: "alice.admin.global@example.com",
  cpf: "00000000000", // String para CPF
  senha: "senhaAdmin123", // Em uma aplicação real, isso seria um hash gerado pela app
  tipo_usuario: "admin", // 'cliente' ou 'admin'
  // endereco_id: null, // Administradores podem não ter endereço no contexto de cliente
  createdAt: new Date(),
  updatedAt: new Date()
});
const adminUserId = adminUserResult.insertedId;
print(`Usuário Administrador 'Alice' inserido com _id: ${adminUserId}`);

const clienteUserResult = db.getCollection('usuarios').insertOne({
  nome: "Carlos Cliente Fiel",
  email: "carlos.cliente@example.com",
  cpf: "11122233344",
  senha: "senhaCliente456",
  tipo_usuario: "cliente",
  endereco_id: enderecoCliente1Id, // Referência ao endereço criado acima
  createdAt: new Date(),
  updatedAt: new Date()
});
const clienteUserId = clienteUserResult.insertedId;
print(`Usuário Cliente 'Carlos' inserido com _id: ${clienteUserId}`);

// Verificar usuários inseridos
db.getCollection('usuarios').find().forEach(user => printjson(user));



// 3.salas
print("\n--- Inserindo salas (salas) ---");

const salaReuniaoResult = db.getCollection('salas').insertOne({
  nome: "Sala de Conferência 'Órion'",
  descricao: "Sala ampla para reuniões e apresentações, equipada com projetor e lousa.",
  capacidade: 10,
  categoria_id: "reuniao_media", // Exemplo de ID/tipo de categoria como string
  status: "disponivel", // ex: "disponivel", "ocupada", "manutencao"
  createdAt: new Date(),
  updatedAt: new Date()
});
const salaReuniaoId = salaReuniaoResult.insertedId;
print(`Sala 'Órion' inserida com _id: ${salaReuniaoId}`);

const salaPrivativaResult = db.getCollection('salas').insertOne({
  nome: "Escritório Privativo 'Sirius'",
  descricao: "Espaço de trabalho individual ou para pequenas equipes, com privacidade e conforto.",
  capacidade: 4,
  categoria_id: "escritorio_privativo",
  status: "disponivel",
  createdAt: new Date(),
  updatedAt: new Date()
});
const salaPrivativaId = salaPrivativaResult.insertedId;
print(`Sala 'Sirius' inserida com _id: ${salaPrivativaId}`);

// Verificar salas inseridas
db.getCollection('salas').find().forEach(sala => printjson(sala));


// 4. reservas
print("\n--- Inserindo reservas (reservas) ---");

const reserva1Result = db.getCollection('reservas').insertOne({
  data_reserva: new Date("2025-07-10T00:00:00Z"), // Apenas a data, a hora é separada
  hora_inicio: "14:00",
  hora_fim: "16:00",
  protocolo: parseInt(Date.now().toString().slice(-8) + Math.floor(Math.random()*100)), // Exemplo de protocolo numérico
  status: "pendente_pagamento", // ex: "confirmada", "pendente_pagamento", "cancelada"
  cliente_id: clienteUserId, // Referência ao cliente Carlos
  sala_id: salaReuniaoId,    // Referência à sala Órion
  pagamento_id: null,        // Pagamento será criado e vinculado depois
  createdAt: new Date(),
  updatedAt: new Date()
});
const reserva1Id = reserva1Result.insertedId;
print(`Reserva 1 (Sala Órion) inserida com _id: ${reserva1Id}`);

// Verificar reservas inseridas
db.getCollection('reservas').find().forEach(reserva => printjson(reserva));



// 5.pagamentos
print("\n--- Inserindo pagamentos (pagamentos) ---");

const pagamento1Result = db.getCollection('pagamentos').insertOne({
  data_pagamento: new Date(),
  status: "pago", // ex: "pago", "pendente", "falhou", "reembolsado"
  valor: 150.00, // Valor de exemplo para a reserva da sala Órion
  metodo_pagamento: "cartao_credito", // ex: "cartao_credito", "pix", "boleto"
  id_transacao_gateway: "txn_" + Date.now(), // Exemplo de ID de transação
  reserva_id: reserva1Id,    // Vincula ao _id da reserva1
  cliente_id: clienteUserId, // Vincula ao _id do cliente Carlos
  createdAt: new Date(),
  updatedAt: new Date()
});
const pagamento1Id = pagamento1Result.insertedId;
print(`Pagamento 1 (para Reserva 1) inserido com _id: ${pagamento1Id}`);

// Atualizar a reserva1 com o pagamento_id
db.getCollection('reservas').updateOne(
  { _id: reserva1Id },
  { $set: { pagamento_id: pagamento1Id, status: "confirmada" } }
);
print(`Reserva 1 atualizada com pagamento_id: ${pagamento1Id} e status 'confirmada'.`);


// Verificar pagamentos inseridos
db.getCollection('pagamentos').find().forEach(pagamento => printjson(pagamento));
print("\n--- Modelagem e inserção de dados de exemplo (modelo atualizado) concluídas! ---");
print(`\nBanco de dados selecionado: ${db.getName()}`);
print("Coleções existentes neste banco de dados:");
db.getCollectionNames().forEach(name => print(`- ${name}`));
