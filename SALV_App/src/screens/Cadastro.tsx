import Ionicons from '@expo/vector-icons/build/Ionicons';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Text, Modal, TouchableOpacity, Image, ActivityIndicator, SafeAreaView, ScrollView, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, deleteUser } from 'firebase/auth';
import { app } from '../DB/firebase';
import supabase from '../DB/supabase';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import CustomToast from '../components/CustomToast';
import { RootStackParamList } from '../navigation/types';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const Cadastro = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [instituicao, setInstituicao] = useState('');
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
    confirmPassword: false,
    instituicao: false,
    uid: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [cartao, setCartao] = React.useState('');

  const nomeRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const instituicaoRef = useRef<TextInput>(null);
  const cartaoRef = useRef(null);

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
      instituicao: !instituicao,
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
    if (!instituicao) {
      setToastMessage('Por favor, insira o nome da instituição');
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
          Instituicao: instituicao,
          UID: cartao,
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

      if ((error as { code?: string }).code) {
        switch ((error as { code?: string }).code) {
          case 'auth/email-already-in-use':
            errorMessage = (error as { message?: string }).message || 'Este email já está cadastrado';
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
            errorMessage = (error as { message?: string }).message || 'Erro ao configurar perfil do usuário';
            technicalDetails = 'SUPABASE_ERROR';
            break;

          default:
            if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
              errorMessage = `Erro técnico (${(error as { code?: string }).code || 'desconhecido'}): ${(error as { message?: string }).message || 'Tente novamente'}`;
            } else {
              errorMessage = 'Erro técnico desconhecido. Tente novamente.';
            }
            technicalDetails = (error as { code?: string }).code || 'UNKNOWN_ERROR';
        }
      } else {
        errorMessage = (error as { message?: string }).message || 'Erro inesperado ao processar seu cadastro';
        technicalDetails = 'UNHANDLED_ERROR';
      }

      if (__DEV__) {
        console.error('Erro no cadastro:', {
          message: (error as { message?: string }).message || 'Erro desconhecido',
          code: (error as { code?: string }).code,
          stack: (error as Error).stack,
          technicalDetails,
          timestamp: new Date().toISOString()
        });
      }

      setModalMessage(errorMessage);
      setErrorModalVisible(true);

      // Limpeza de usuário inconsistente
      if (firebaseUser && typeof error === 'object' && error !== null && 'code' in error && !['auth/email-already-in-use', 'auth/invalid-email'].includes((error as { code: string }).code)) {
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

  const particles = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => (
        <Particle
          key={i}
          size={Math.random() * 5 + 3}
          left={Math.random() * 500}
          top={Math.random() * 900}
          duration={Math.random() * 3000 + 2000}
          delay={Math.random() * 2000}
        />
      )),
    []
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AnimatedLinearGradient
        colors={[color1, color2]}
        style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {particles}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.contentContainer, { paddingBottom: 50 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image source={require('../images/logo.png')} style={styles.logo} />
          <Text style={styles.welcomeText}>Criar Conta</Text>
          <Text style={styles.subtitle}>Preencha os campos abaixo para criar sua conta</Text>

          <TextInput
            ref={nomeRef}
            style={[styles.input, !nome && errorFields.nome && styles.inputError]}
            placeholder="Nome Completo"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={nome}
            onChangeText={setNome}
            returnKeyType="next"
            onSubmitEditing={() => instituicaoRef.current?.focus()}
            blurOnSubmit={false}
          />

          <Text style={[styles.subtitle, { marginBottom: 16 }]}>
            Seja criativo com o nome fornecido, pois caso outra pessoa use o mesmo, vocês farão parte da mesma equipe.
          </Text>


          <TextInput
            ref={instituicaoRef}
            style={[styles.input, !instituicao && errorFields.instituicao && styles.inputError]}
            placeholder="Nome da Instituição"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={instituicao}
            onChangeText={setInstituicao}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            blurOnSubmit={false}
          />
         <TextInput
  ref={cartaoRef}
  style={[styles.input, !cartao && errorFields.uid && styles.inputError]}
  placeholder="UID do Cartão RFID"
  placeholderTextColor="rgba(255,255,255,0.7)"
  value={cartao}
  onChangeText={setCartao}   
  editable={true}
  returnKeyType="next"
  onSubmitEditing={() => emailRef.current?.focus()}
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
            onChangeText={setEmail}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
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
              onChangeText={setPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="rgba(255,255,255,0.7)" />
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
              onChangeText={setConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.buttonContainer}
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
            Ao criar uma conta, você concorda com os{' '}
            <Text style={styles.linkText} onPress={() => setModalVisible(true)}>
              Termos e Condições
            </Text>{' '}
            e a{' '}
            <Text style={styles.linkText} onPress={() => setPrivacyModalVisible(true)}>
              Política de Privacidade
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {toastMessage && (
        <CustomToast
          message={toastMessage}
          duration={5000}
          onClose={() => setToastMessage(null)}
        />
      )}

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
            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionTitle}>1. Aceitação dos Termos</Text>
              <Text style={styles.listItem}>• Ao usar o SALV, você concorda com estes Termos</Text>
              <Text style={styles.listItem}>• Versão atualizada em: 01/01/2024</Text>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>2. Funcionalidades</Text>
              <Text style={styles.listItem}>- Monitoramento via sensores/câmeras</Text>
              <Text style={styles.listItem}>- Autenticação RFID/biometria</Text>
              <Text style={styles.listItem}>- Gravação automática de eventos</Text>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>3. Responsabilidades</Text>
              <Text style={styles.listItem}>• Manter hardware funcional (ESP32, câmeras)</Text>
              <Text style={styles.listItem}>• Configurar corretamente MQTT/APIs</Text>
              <Text style={styles.listItem}>• Não usar para atividades ilegais</Text>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>4. Limitações</Text>
              <Text style={styles.listItem}>- Não cobrimos falhas de hardware</Text>
              <Text style={styles.listItem}>- Isenção por uso indevido</Text>
              <Text style={styles.listItem}>- Sujeito a disponibilidade de serviços em nuvem</Text>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>5. Contato</Text>
              <Text style={styles.contactInfo}>suporte.salv@dominio.com</Text>
              <Text style={styles.contactInfo}>+55 (11) 98888-8888 | São Paulo/SP</Text>
            </ScrollView>
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
            <ScrollView style={styles.scrollArea}>
              <Text style={styles.sectionTitle}>1. Dados Coletados</Text>
              <Text style={styles.listItem}>• Biometria facial (processamento local)</Text>
              <Text style={styles.listItem}>• Registros de acesso RFID</Text>
              <Text style={styles.listItem}>• Metadados técnicos (IP, horários)</Text>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>2. Compartilhamento</Text>
              <Text style={styles.listItem}>- Supabase: armazenamento de vídeos</Text>
              <Text style={styles.listItem}>- Firebase: notificações push</Text>
              <Text style={styles.listItem}>- APIs REST: integração de sistemas</Text>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>3. Segurança</Text>
              <Text style={styles.listItem}>• Criptografia AES-256</Text>
              <Text style={styles.listItem}>• Autenticação em duas etapas</Text>
              <Text style={styles.listItem}>• Auditorias trimestrais</Text>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>4. Direitos</Text>
              <Text style={styles.listItem}>- Solicitar exclusão de dados</Text>
              <Text style={styles.listItem}>- Acessar histórico completo</Text>
              <Text style={styles.listItem}>- Revogar permissões</Text>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>5. Atualizações</Text>
              <Text style={styles.contactInfo}>Versão vigente: 1.0.0 (Maio/2025)</Text>
            </ScrollView>
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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



  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalBody: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#04C6AE',
    marginTop: 15,
    marginBottom: 8,
    textDecorationLine: 'underline',
  },
  listItem: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginLeft: 12,
    marginBottom: 5,
    lineHeight: 20,
  },
  contactInfo: {
    fontSize: 14,
    color: '#2B5876',
    marginTop: 8,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(4,198,174,0.3)',
    marginVertical: 15,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

});



export default Cadastro;