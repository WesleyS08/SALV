import React, { useState, useRef, useEffect } from 'react';
import {   View,   TextInput,   Text,   Modal,   TouchableOpacity,   StyleSheet,  SafeAreaView,  ScrollView,  Animated,  Easing,  ActivityIndicator} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '../DB/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import CustomToast from '../components/CustomToast';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const EsqueciSenha = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
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

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setToastMessage('Por favor, insira um e-mail válido');
      return;
    }

    setLoading(true);
    const auth = getAuth(app);

    try {
      await sendPasswordResetEmail(auth, email);
      setModalMessage(`Instruções para redefinição foram enviadas para:\n${email}`);
      setModalVisible(true);
    } catch (error) {
      let errorMessage = 'Erro ao enviar e-mail de redefinição';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Nenhuma conta encontrada com este e-mail';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Formato de e-mail inválido';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
          break;
        default:
          errorMessage = `Erro: ${error.message}`;
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
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <Ionicons name="lock-closed" size={80} color="rgba(255,255,255,0.8)" />
            
            <Text style={styles.title}>Redefinir Senha</Text>
            
            <Text style={styles.subtitle}>
              Digite o e-mail associado à sua conta para receber as instruções de redefinição
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Seu e-mail"
              placeholderTextColor="rgba(255,255,255,0.7)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Enviar Instruções</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginLink}
              onPress={() => navigation.navigate('Autenticacao')}
            >
              <Text style={styles.loginText}>
                Lembrou sua senha? <Text style={styles.linkText}>Faça login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modal de Sucesso */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Ionicons name="checkmark-circle" size={50} color="#04C6AE" />
            <Text style={styles.modalTitle}>E-mail Enviado!</Text>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('Autenticacao');
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Erro */}
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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  input: {
    width: '100%',
    height: 54,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 14,
    marginBottom: 20,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
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
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9BE8D8',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 20,
  },
  loginText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  linkText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 15,
    color: '#FFFFFF',
  },
  modalText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    width: '100%',
    padding: 12,
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

export default EsqueciSenha;