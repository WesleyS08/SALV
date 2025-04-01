import Ionicons from '@expo/vector-icons/build/Ionicons';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Text, Modal, TouchableOpacity, Image, ActivityIndicator, SafeAreaView, ScrollView, Animated, Easing } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '../DB/firebase';
import supabase from '../DB/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import CustomToast from '../components/CustomToast';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const Cadastro = () => {
  const navigation = useNavigation();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const colorAnim = new Animated.Value(0);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorFields, setErrorFields] = useState({
    nome: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const nomeRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });

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
  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };
  const handleSignUp = async () => {

    const errors = {
      nome: !nome,
      email: !email || !validateEmail(email),
      password: !password,
      confirmPassword: password !== confirmPassword
    };

    setErrorFields(errors);

    if (errors.nome) {
      setToastMessage('Por favor, insira seu nome completo');
      return;
    }
    if (!email) {
      setToastMessage('Por favor, insira seu email');
      return;
    }
    if (email && !validateEmail(email)) {
      setToastMessage('Por favor, insira um email válido');
      return;
    }
    if (!password) {
      setToastMessage('Por favor, insira uma senha');
      return;
    }
    if (password !== confirmPassword) {
      setToastMessage('As senhas não coincidem');
      return;
    }

    setLoading(true);
    let firebaseUser = null;

    try {
      const auth = getAuth(app);


      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        throw {
          code: 'auth/email-already-in-use',
          message: 'Este email já está cadastrado. Por favor, use outro email ou faça login.'
        };
      }

      if (!supabase || typeof supabase.from !== 'function') {
        console.error('Supabase não está inicializado corretamente:', supabase);
        setModalMessage('Erro de configuração do aplicativo. Por favor, reinstale.');
        setErrorModalVisible(true);
        return;
      }


      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = userCredential.user;

      await firebaseUser.getIdToken(true);


      const uid = firebaseUser.uid;
      const { error: supabaseError } = await supabase
        .from('Tb_Usuarios')
        .insert({
          ID_Usuarios: uid,
          Nome: nome,
          Email: email,
          UID: uid,
          Data_Criacao: new Date().toISOString(),
        });

      if (supabaseError) {
        console.error('Erro no Supabase:', supabaseError);
        await deleteUser(firebaseUser);
        throw {
          code: 'supabase/create-failed',
          message: 'Cadastro criado, mas houve um erro ao configurar seu perfil. Por favor, tente novamente mais tarde.'
        };
      }

      navigation.navigate('Home', { user: { id: uid, nome, email } });

    } catch (error) {
      let errorMessage = 'Erro desconhecido ao criar conta';
      let technicalDetails = '';

      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = error.message || 'Este email já está cadastrado';
            technicalDetails = 'EMAIL_EXISTS';
            break;

          case 'auth/weak-password':
            errorMessage = 'Sua senha deve ter pelo menos 6 caracteres';
            technicalDetails = 'WEAK_PASSWORD';
            break;

          case 'auth/invalid-email':
            errorMessage = 'O formato do email é inválido';
            technicalDetails = 'INVALID_EMAIL';
            break;

          case 'auth/network-request-failed':
            errorMessage = 'Problema de conexão. Verifique sua internet e tente novamente';
            technicalDetails = 'NETWORK_ERROR';
            break;

          case 'supabase/create-failed':
            errorMessage = error.message || 'Erro ao configurar perfil do usuário';
            technicalDetails = 'SUPABASE_ERROR';
            break;

          default:
            errorMessage = `Erro técnico (${error.code || 'desconhecido'}): ${error.message || 'Tente novamente'}`;
            technicalDetails = error.code || 'UNKNOWN_ERROR';
        }
      } else {
        errorMessage = error.message || 'Erro inesperado ao processar seu cadastro';
        technicalDetails = 'UNHANDLED_ERROR';
      }

      if (__DEV__) {
        console.error('Erro no cadastro:', {
          message: error.message,
          code: error.code,
          stack: error.stack,
          technicalDetails,
          timestamp: new Date().toISOString()
        });
      }

      setModalMessage(errorMessage);
      setErrorModalVisible(true);

      // Limpeza de usuário inconsistente
      if (firebaseUser && !['auth/email-already-in-use', 'auth/invalid-email'].includes(error.code)) {
        try {
          await deleteUser(firebaseUser);
        } catch (deleteError) {
          console.error('Falha ao limpar usuário inconsistente:', {
            userId: firebaseUser.uid,
            error: deleteError
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };


  const handleDownload = async (text: string, fileName: string) => {
    try {
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, text);
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: `Baixar ${fileName}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const termsText = `Termos e Condições do SALV...`;
  const privacyText = `Política de Privacidade do SALV...`;

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

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
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
        <ScrollView contentContainerStyle={styles.contentContainer}>

          <Image source={require('../images/logo.png')} style={styles.logo} />
          <Text style={styles.welcomeText}>Criar Conta</Text>
          <Text style={styles.subtitle}>
            Preencha os campos abaixo para criar sua conta
          </Text>

          <TextInput
            ref={nomeRef}
            style={[styles.input, !nome && errorFields.nome && styles.inputError]}
            placeholder="Nome Completo"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={nome}
            onChangeText={(text) => {
              setNome(text);
              setErrorFields({ ...errorFields, nome: false });
            }}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current.focus()}
            blurOnSubmit={false}
          />

          <TextInput
            ref={emailRef}
            style={[styles.input, (!email || !validateEmail(email)) && errorFields.email && styles.inputError]}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.7)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrorFields({ ...errorFields, email: false });
            }}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current.focus()}
            blurOnSubmit={false}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              ref={passwordRef}
              style={[styles.input, !password && errorFields.password && styles.inputError]}
              placeholder="Senha"
              placeholderTextColor="rgba(255,255,255,0.7)"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorFields({ ...errorFields, password: false });
              }}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current.focus()}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="rgba(255,255,255,0.7)"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              ref={confirmPasswordRef}
              style={[styles.input, (confirmPassword !== password) && errorFields.confirmPassword && styles.inputError]}
              placeholder="Confirmar Senha"
              placeholderTextColor="rgba(255,255,255,0.7)"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrorFields({ ...errorFields, confirmPassword: false });
              }}
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="rgba(255,255,255,0.7)"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.buttonContainer]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Criar Conta</Text>
            )}
          </TouchableOpacity>
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Já tem uma conta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}> Faça login</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            Ao criar uma conta, você concorda com os {' '}
            <Text style={styles.linkText} onPress={() => setModalVisible(true)}>
              Termos e Condições
            </Text>{' '}
            e a {' '}
            <Text style={styles.linkText} onPress={() => setPrivacyModalVisible(true)}>
              Política de Privacidade
            </Text>
          </Text>
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Termos e Condições</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.modalText}>{termsText}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => handleDownload(termsText, 'termos_condicoes.txt')}
              activeOpacity={0.8}
            >
              <Ionicons name="download" size={20} color="white" />
              <Text style={styles.downloadButtonText}>Baixar Termos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={privacyModalVisible}
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Política de Privacidade</Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.modalText}>{privacyText}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => handleDownload(privacyText, 'politica_privacidade.txt')}
              activeOpacity={0.8}
            >
              <Ionicons name="download" size={20} color="white" />
              <Text style={styles.downloadButtonText}>Baixar Política</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Erro no Cadastro</Text>
              <TouchableOpacity onPress={() => setErrorModalVisible(false)}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalText}>{modalMessage}</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>

  );
};
interface ParticleProps {
  size: number;
  left: number;
  top: number;
  duration: number;
  delay: number;
}

const Particle: React.FC<ParticleProps> = ({ size, left, top, duration, delay }) => {
  const animValue = new Animated.Value(0);

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

const styles = StyleSheet.create({

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
    flex: 1,
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
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    width: '100%',
    height: 54,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  buttonContainer: {
    width: '100%',
    height: 54,
    backgroundColor: '#04C6AE',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  loginLink: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
    marginBottom: 24,
  },
  downloadButton: {
    paddingVertical: 12,
    backgroundColor: '#04C6AE',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 50,
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },


});

export default Cadastro;