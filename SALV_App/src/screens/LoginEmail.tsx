import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, Modal, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Animated, Easing, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { app } from '../DB/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import CustomToast from '../components/CustomToast';
import { NavigationProp } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface LoginProps {
  navigation: NavigationProp<any>;
}

const Login: React.FC<LoginProps> = ({ navigation }) => {
  // Estados
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [enableBiometric, setEnableBiometric] = useState(false);
  const colorAnim = useRef(new Animated.Value(0)).current;

  // Animação do gradiente
  useEffect(() => {
    Animated.loop(
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const color1 = colorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#2B5876', '#4E4376', '#2B5876'],
  });

  const color2 = colorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#4E4376', '#2B5876', '#4E4376'],
  });

  // Componente Particle
  interface ParticleProps {
    size: number;
    left: number;
    top: number;
    duration: number;
    delay: number;
  }

  const Particle: React.FC<ParticleProps> = ({ size, left, top, duration, delay }) => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration,
            delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }, []);

    const translateY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -20],
    });

    return (
      <Animated.View
        style={[
          styles.particle,
          {
            width: size,
            height: size,
            left,
            top,
            transform: [{ translateY }],
            opacity: animValue.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.6, 1, 0.6],
            }),
          },
        ]}
      />
    );
  };

  const particles = Array.from({ length: 8 }).map((_, i) => (
    <Particle
      key={i}
      size={Math.random() * 5 + 3}
      left={Math.random() * 500}
      top={Math.random() * 900}
      duration={Math.random() * 3000 + 2000}
      delay={Math.random() * 2000}
    />
  ));

  // Função para criptografar dados
  const encryptData = async (data: string): Promise<string> => {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data + new Date().getTime().toString()
    );
    return digest;
  };

  // Validação de email
  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  // Salvar credenciais para biometria
  const saveCredentialsForBiometric = async (email: string, password: string) => {
    try {
      const credentials = JSON.stringify({
        email,
        password
      });
      await SecureStore.setItemAsync('user_credentials', credentials);
      const saved = await SecureStore.getItemAsync('user_credentials');
      console.log('Credenciais salvas:', saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Email salvo:', parsed.email);
        console.log('Senha :', parsed.password);
      }
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
      throw new Error('Falha ao salvar credenciais para biometria');
    }
  };

  // Função principal de login
  const handleLogin = async () => {
    if (!email || !password) {
      setToastMessage('Email e senha são obrigatórios');
      return;
    }

    if (!validateEmail(email)) {
      setToastMessage('Formato de email inválido');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth(app);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const { uid, email: userEmail } = userCredential.user;

      if (enableBiometric) {
        try {
          await saveCredentialsForBiometric(email, password);
          setToastMessage('Login salvo para biometria!');
        } catch (error) {
          console.warn('Biometria não configurada:', error);
        }
      }

      navigation.reset({
        index: 0,
        routes: [{
          name: 'Home',
          params: { user: { id: uid, email: userEmail } }
        }],
      });

    } catch (error: any) {
      let errorMessage = 'Erro ao fazer login';

      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-credential':
            errorMessage = 'Credenciais inválidas';
            break;
          case 'auth/user-not-found':
            errorMessage = 'Usuário não encontrado';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Senha incorreta';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Muitas tentativas. Tente mais tarde';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Conta desativada';
            break;
          default:
            errorMessage = error.message || 'Erro desconhecido';
        }
      }

      setModalMessage(errorMessage);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {toastMessage && (
        <CustomToast
          message={toastMessage}
          duration={5000}
          onClose={() => setToastMessage(null)}
        />
      )}

      <AnimatedLinearGradient
        colors={[color1, color2]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {particles}

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('Autenticacao')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <Ionicons
              name="mail-open"
              size={80}
              color="rgba(255,255,255,0.9)"
              style={styles.icon}
            />

            <Text style={styles.title}>Bem-vindo de volta</Text>

            <Text style={styles.subtitle}>
              Digite suas credenciais para acessar sua conta
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Seu e-mail"
                placeholderTextColor="rgba(255,255,255,0.7)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                autoCorrect={false}
                spellCheck={false}
              />
              <Ionicons
                name="mail"
                size={20}
                color="rgba(255,255,255,0.7)"
                style={styles.inputIcon}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Sua senha"
                placeholderTextColor="rgba(255,255,255,0.7)"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="rgba(255,255,255,0.7)"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.biometricContainer}>
              <Switch
                value={enableBiometric}
                onValueChange={setEnableBiometric}
                trackColor={{ false: "#767577", true: "#04C6AE" }}
                thumbColor={enableBiometric ? "#fff" : "#f4f3f4"}
              />
              <Text style={styles.biometricText}>Lembrar login com biometria</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('EsqueciSenha')}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Entrar</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Não tem uma conta?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Cadastro')}
              >
                <Text style={styles.registerLink}> Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Ionicons name="close-circle" size={50} color="#FF6B6B" />
            <Text style={styles.modalTitle}>Ops!</Text>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalErrorButton]}
              onPress={() => setErrorModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 14,
    paddingLeft: 50,
    paddingRight: 50,
    color: '#FFFFFF',
    fontSize: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 18,
    padding: 4,
  },
  biometricContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  biometricText: {
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 10,
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#04C6AE',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(4,198,174,0.6)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 30,
    alignItems: 'center',
  },
  registerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  registerLink: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 15,
    color: '#FFFFFF',
  },
  modalText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#04C6AE',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalErrorButton: {
    backgroundColor: '#FF6B6B',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 50,
  },
});

export default Login;