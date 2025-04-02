import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View, Image, TouchableOpacity, SafeAreaView, ScrollView, Animated, Easing, Modal } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import CustomToast from '../components/CustomToast';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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
    paddingBottom: 30,
    flex: 1,
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 40,
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
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Rubik',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sectionText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Rubik',
    textShadowColor: 'rgba(0,0,0,0.1)',
    lineHeight: 20,
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
    marginBottom: 16,
  },
  secondaryButtonContainer: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
});

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

export default function Principal() {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const colorAnim = new Animated.Value(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const handleBiometricLogin = async () => {
    try {
        // 1. Verificação mais robusta de hardware e biometria
        const [hasHardware, isEnrolled] = await Promise.all([
            LocalAuthentication.hasHardwareAsync(),
            LocalAuthentication.isEnrolledAsync()
        ]);

        if (!hasHardware) {
            setToastMessage('Dispositivo não suporta autenticação biométrica');
            return;
        }

        if (!isEnrolled) {
            setToastMessage('Nenhuma biometria/configuração de bloqueio cadastrada');
            return;
        }

        // 2. Autenticação com mais opções de fallback
        const authResult = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Autentique-se para entrar',
            fallbackLabel: 'Usar senha',
            disableDeviceFallback: true, 
            cancelLabel: 'Cancelar'
        });

        if (!authResult.success) {
            if (authResult.error === 'user_cancel') {
                setToastMessage('Autenticação cancelada pelo usuário');
            } else {
                setToastMessage('Falha na autenticação: ' + authResult.error);
            }
            return;
        }

        // 3. Busca segura das credenciais
        const credentialsString = await SecureStore.getItemAsync('user_credentials');
        if (!credentialsString) {
            setToastMessage('Nenhum login salvo encontrado');
            await SecureStore.deleteItemAsync('user_credentials'); 
            return;
        }

        // 4. Decriptografia e validação
        const credentials = JSON.parse(credentialsString);
        
        // 5. Login no Firebase
        const auth = getAuth();
        const userCredential = await signInWithEmailAndPassword(
            auth, 
            credentials.email, 
            credentials.password
        );

        // Verificação adicional
        if (!userCredential?.user) {
            throw new Error('Autenticação falhou após credenciais válidas');
        }

        // Sucesso
        navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
        });

    } catch (error) {
        console.error('Erro no login biométrico:', error);
        
        // Tratamento específico para erros conhecidos
        if (error.code === 'auth/invalid-credential' || 
            error.code === 'auth/user-not-found' || 
            error.code === 'auth/wrong-password') {
            await SecureStore.deleteItemAsync('user_credentials');
            setToastMessage('Credenciais inválidas - faça login novamente');
            navigation.navigate('Login');
        } else {
            setToastMessage('Erro na autenticação: ' + 
                (error.message || 'Tente novamente mais tarde'));
        }
    }
};

  const particles = Array.from({ length: 15 }).map((_, i) => (
    <Particle
      key={i}
      size={Math.random() * 5 + 3}
      left={Math.random() * 500}
      top={Math.random() * 900}
      duration={Math.random() * 3000 + 2000}
      delay={Math.random() * 2000}
    />
  ));

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
  const privacyText = `Lorem ipsum...`;

  return (
    <View style={styles.container}>
      <AnimatedLinearGradient
        colors={[color1, color2]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {particles}

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {toastMessage && (
            <CustomToast
              message={toastMessage}
              duration={5000}
              onClose={() => setToastMessage(null)}
            />
          )}

          <Image source={require('../images/logo.png')} style={styles.logo} />
          <Text style={styles.welcomeText}>SALV</Text>
          <Text style={styles.subtitle}>
            Segurança inteligente para laboratórios
          </Text>

          <Text style={styles.sectionTitle}>Sistema de Alerta Laboratorial com Visão</Text>
          <Text style={styles.sectionText}>Login ou Cadastro</Text>
          <Text style={styles.sectionText}>
            Selecione sua maneira para se cadastrar ou logar no aplicativo
          </Text>

          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continuar com Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButtonContainer}
            onPress={handleBiometricLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Continuar com Biometria</Text>
          </TouchableOpacity>

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
    </View>
  );
}