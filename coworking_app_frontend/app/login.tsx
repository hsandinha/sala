// app/login.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert, // Importar Alert
} from 'react-native';
import { useRouter } from 'expo-router';

const logoImage = require('../assets/images/logo.png');

// COLOQUE A URL CORRETA DO SEU BACKEND AQUI!
// Se estiver testando no celular, use o IP local do seu computador na rede Wi-Fi.
// Ex: const BACKEND_URL = 'http://192.168.1.10:5001';
const BACKEND_URL = 'http://192.168.1.125:5001'; // <<< SUBSTITUA AQUI

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Para feedback visual
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Campos Vazios', 'Por favor, preencha o email e a senha.');
      return;
    }

    setIsLoading(true); // Inicia o feedback de carregamento
    console.log('Tentando login com:', email, senha);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Lembre-se que seu backend espera 'email' e 'senha'
        body: JSON.stringify({ email: email, senha: senha }),
      });

      const data = await response.json();
      setIsLoading(false); // Termina o feedback de carregamento

      if (response.ok && data.status === 'success' && data.token) {
        console.log('Login bem-sucedido! Token:', data.token);
        Alert.alert('Login Bem-Sucedido!', `Token: ${data.token.substring(0, 30)}...`);

        // Próximos passos (a serem implementados depois):
        // 1. Salvar o token de forma segura (ex: usando expo-secure-store)
        // await SecureStore.setItemAsync('userToken', data.token);

        // 2. Atualizar o estado global de autenticação (ex: usando Context API)
        // authContext.signIn(data.token, data.data.user);

        // 3. Navegar para a tela principal apropriada
        if (data.data.usuario.tipo_usuario === 'admin') { // Assumindo que o backend retorna 'usuario' e 'tipo_usuario'
          console.log('Usuário é admin, navegando para dashboard admin...');
          // router.replace('/(admin)/dashboard'); // Exemplo de rota para admin (ajuste conforme sua estrutura de rotas)
        } else {
          console.log('Usuário é comum, navegando para home...');
          // router.replace('/(tabs)/'); // Exemplo de rota para usuário comum (ajuste)
        }
      } else {
        console.log('Falha no login:', data.message);
        Alert.alert('Erro no Login', data.message || 'Credenciais inválidas ou erro no servidor.');
      }
    } catch (error) {
      setIsLoading(false); // Termina o feedback de carregamento
      console.error('Erro de conexão ou na API:', error);
      Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique a URL do backend e sua conexão.');
    }
  };

  const handleForgotPassword = () => {
    console.log('Navegar para Esqueceu Senha');
    // router.push('/forgot-password');
  };

  const handleSignUp = () => {
    console.log('Navegar para Criar Conta');
    // router.push('/signup');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ... (resto do seu JSX para a UI da tela de login, que já estava bom) ... */}
      {/* Apenas certifique-se de que o botão "ENTRAR" chame onPress={handleLogin} */}
      {/* E adicione um feedback de loading se desejar */}
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} 
      >
        <View style={styles.innerContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={logoImage}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Shared Spaces</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>
              Forneça suas credenciais para acessar sua conta
            </Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Informe o seu e-mail"
                placeholderTextColor="#A0AEC0"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                textContentType="emailAddress"
                editable={!isLoading} // Desabilita input durante o loading
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Informe a sua senha"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
                textContentType="password"
                editable={!isLoading} // Desabilita input durante o loading
              />
            </View>

            <TouchableOpacity 
              onPress={handleLogin} 
              style={[styles.button, isLoading && styles.buttonDisabled]} // Estilo para botão desabilitado
              disabled={isLoading} // Desabilita botão durante o loading
            >
              <Text style={styles.buttonText}>{isLoading ? 'ENTRANDO...' : 'ENTRAR'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading} style={styles.linkButton}>
              <Text style={styles.linkText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignUp} disabled={isLoading} style={styles.linkButton}>
              <Text style={styles.linkText}>Criar conta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (seus estilos existentes) ...
  // Adicione este estilo se quiser um feedback visual para o botão desabilitado:
  buttonDisabled: {
    backgroundColor: '#A0AEC0', // Cor mais clara ou cinza para indicar desabilitado
  },
  // Cole aqui os estilos que você já tinha e que estavam funcionando bem para o layout.
  // Eu os incluí na minha resposta anterior.
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { flex: 1 },
  innerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 70, height: 70, marginBottom: 8 },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#E2E8F0' },
  formContainer: { backgroundColor: '#1E293B', paddingHorizontal: 25, paddingVertical: 30, borderRadius: 12, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#CBD5E1', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#94A3B8', textAlign: 'center', marginBottom: 25 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', borderRadius: 8, marginBottom: 18, paddingHorizontal: 15, borderWidth: 1, borderColor: '#475569' },
  input: { flex: 1, height: 50, color: '#F1F5F9', fontSize: 16 },
  button: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginBottom: 15, marginTop: 15 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  linkButton: { paddingVertical: 8 },
  linkText: { color: '#60A5FA', textAlign: 'center', fontSize: 14, marginTop: 8 },
});