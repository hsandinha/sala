const Endereco = require('../models/enderecoModel');
const User = require('../models/usuarioModel'); 

exports.upsertMyEndereco = async (req, res, next) => {
  const clienteId = req.user.id; 
  console.log(`UPSERTMYENDERECO: Usuário ${clienteId} tentando criar/atualizar endereço.`);
  console.log('Dados recebidos:', req.body);

  try {
    const { rua, numero, complemento, bairro, cidade, estado, cep, pais } = req.body;

    // Validação básica dos campos obrigatórios do endereço
    if (!rua || !numero || !bairro || !cidade || !estado || !cep || !pais) {
      return res.status(400).json({
        status: 'fail',
        message: 'Todos os campos do endereço (rua, numero, bairro, cidade, estado, cep, pais) são obrigatórios.',
      });
    }

    const enderecoData = {
      rua,
      numero,
      complemento, 
      bairro,
      cidade,
      estado,
      cep,
      pais,
      usuario_id: clienteId,
    };

    const user = await User.findById(clienteId);
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'Usuário não encontrado.' });
    }

    let endereco;
    if (user.endereco_id) {

      console.log(`UPSERTMYENDERECO: Usuário já tem endereço_id ${user.endereco_id}. Atualizando...`);
      endereco = await Endereco.findByIdAndUpdate(user.endereco_id, enderecoData, {
        new: true, 
        runValidators: true, 
      });

      if (!endereco) {
        console.log(`UPSERTMYENDERECO: Endereço com ID ${user.endereco_id} não encontrado para atualização. Criando um novo.`);
        endereco = await Endereco.create(enderecoData);
        user.endereco_id = endereco._id;
        await user.save({ validateBeforeSave: false })
      }
    } else {
      // Usuário não tem um endereço_id, então vamos criar um novo endereço
      console.log('UPSERTMYENDERECO: Usuário não tem endereço_id. Criando novo endereço...');
      endereco = await Endereco.create(enderecoData);
      // Atualizar o usuário com o ID do novo endereço
      user.endereco_id = endereco._id;
      await user.save({ validateBeforeSave: false }); // Salva o usuário apenas com o novo endereco_id
      console.log(`UPSERTMYENDERECO: Novo endereço criado e ID ${endereco._id} salvo no usuário.`);
    }

    res.status(200).json({ 
      status: 'success',
      data: {
        endereco,
      },
    });

  } catch (error) {
    console.error("ERRO EM UPSERTMYENDERECO:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'fail',
        message: messages.join(' '),
      });
    }
    // Erro de chave duplicada (ex: se usuario_id em Endereco for unique e tentar criar de novo)
    if (error.code === 11000 && error.keyValue && error.keyValue.usuario_id) {
        return res.status(400).json({
            status: 'fail',
            message: 'Erro de integridade: este usuário já parece ter um endereço associado de outra forma.'
        });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao salvar o endereço.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getMyEndereco = async (req, res, next) => {
  // req.user é populado pelo middleware 'protect'
  const usuarioLogado = req.user;
  console.log('----------------------------------------------------');
  console.log('GETMYENDERECO: Iniciando busca de endereço para usuário.');
  console.log('GETMYENDERECO: Objeto req.user completo:', JSON.stringify(usuarioLogado, null, 2)); // Log completo do req.user

  if (!usuarioLogado) {
    console.error('GETMYENDERECO: ERRO CRÍTICO - req.user não está definido após middleware protect.');
    return res.status(500).json({ status: 'error', message: 'Erro interno ao identificar usuário.' });
  }

  const enderecoIdDoUsuario = usuarioLogado.endereco_id;
  console.log(`GETMYENDERECO: ID do usuário logado: ${usuarioLogado._id}`);
  console.log(`GETMYENDERECO: endereco_id encontrado no req.user: ${enderecoIdDoUsuario}`);

  try {
    if (!enderecoIdDoUsuario) {
      console.log(`GETMYENDERECO: Usuário ${usuarioLogado._id} não possui endereco_id em req.user.`);
      return res.status(404).json({
        status: 'fail',
        message: 'Nenhum endereço cadastrado para este usuário (referência não encontrada no perfil).',
      });
    }

    console.log(`GETMYENDERECO: Buscando documento de endereço com _id: ${enderecoIdDoUsuario}`);
    const endereco = await Endereco.findById(enderecoIdDoUsuario);

    if (!endereco) {
      console.warn(`GETMYENDERECO: Inconsistência de dados! Usuário ${usuarioLogado._id} tem endereco_id (${enderecoIdDoUsuario}), mas o documento de endereço não foi encontrado na coleção 'enderecos'.`);
       return res.status(404).json({
        status: 'fail',
        message: 'Endereço referenciado não encontrado. Pode ser necessário cadastrar o endereço novamente.',
      });
    }

    console.log('GETMYENDERECO: Endereço encontrado:', JSON.stringify(endereco, null, 2));
    res.status(200).json({
      status: 'success',
      data: {
        endereco,
      },
    });

  } catch (error) {                   
    console.error("ERRO DETALHADO EM GETMYENDERECO:", error);
    if (error.name === 'CastError' && error.kind === 'ObjectId' && error.path === '_id') {
      console.error(`GETMYENDERECO: O endereco_id "${enderecoIdDoUsuario}" parece ser um ObjectId inválido.`);
       return res.status(400).json({ status: 'fail', message: 'Formato de ID de endereço inválido no perfil do usuário.' });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar o endereço.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.deleteMyEndereco = async (req, res, next) => {
  const usuarioLogado = req.user; 
  console.log(`DELETEMYENDERECO: Usuário ${usuarioLogado._id} tentando deletar seu endereço.`);

  try {
    if (!usuarioLogado.endereco_id) {
      console.log(`DELETEMYENDERECO: Usuário ${usuarioLogado._id} não possui endereço para deletar.`);
      return res.status(404).json({
        status: 'fail',
        message: 'Nenhum endereço cadastrado para este usuário para ser deletado.',
      });
    }

    const enderecoIdParaDeletar = usuarioLogado.endereco_id;
    console.log(`DELETEMYENDERECO: Tentando deletar endereço com ID: ${enderecoIdParaDeletar}`);

    const enderecoDeletado = await Endereco.findByIdAndDelete(enderecoIdParaDeletar);

    if (!enderecoDeletado) {
      console.warn(`DELETEMYENDERECO: Endereço com ID ${enderecoIdParaDeletar} não foi encontrado para deleção, mas tentaremos limpar a referência do usuário.`);
    } else {
      console.log(`DELETEMYENDERECO: Endereço ${enderecoIdParaDeletar} deletado da coleção 'enderecos'.`);
    }

    await User.findByIdAndUpdate(usuarioLogado._id, { $unset: { endereco_id: "" } });
    console.log(`DELETEMYENDERECO: Referência endereco_id removida do perfil do usuário ${usuarioLogado._id}.`);

    res.status(200).json({
        status: 'success',
        message: 'Endereço deletado com sucesso.',
        data: null
    });

  } catch (error) {
    console.error("ERRO EM DELETEMYENDERECO:", error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ status: 'fail', message: 'ID de endereço no perfil do usuário é inválido.'});
    }
    res.status(500).json({
      status: 'error',
      message: 'Erro ao deletar o endereço.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};