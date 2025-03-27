import Ionicons from '@expo/vector-icons/build/Ionicons';
import React, { useLayoutEffect, useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Modal, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '../DB/firebase'; // Importa a instância do Firebase App inicializada
import { useNavigation } from '@react-navigation/native';

const Cadastro = () => {
  const navigation = useNavigation();
  const [nome, setNome] = useState(''); // Novo estado para o nome
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false); // Novo estado para o modal de erro
  const [modalMessage, setModalMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,   // Oculta o cabeçalho
    });
  }, [navigation]);

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleSignUp = async () => {
    if (!nome || !email || !password) {
      setModalMessage('Nome, email e senha são obrigatórios.');
      setErrorModalVisible(true); // Exibe o modal de erro
      return;
    }

    if (!validateEmail(email)) {
      setModalMessage('Formato de email inválido.');
      setErrorModalVisible(true); // Exibe o modal de erro
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth(app); // Usa a instância do Firebase App inicializada
      const db = getFirestore(app); // Obtém a instância do Firestore

      // Verifica se o email já existe
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        setLoading(false);
        setModalMessage('Este email já está em uso. Por favor, use outro email.');
        setErrorModalVisible(true); // Exibe o modal de erro
        return;
      }

      // Tenta criar um novo usuário
      const signUpResponse = await createUserWithEmailAndPassword(auth, email, password);
      const uid = signUpResponse.user.uid;

      const userData = {
        id: uid,
        nome,
        email,
      };

      setLoading(false);
      navigation.navigate('Home', { user: userData });  // Navega para a tela Home após cadastro
    } catch (signUpError) {
      setLoading(false);
      setModalMessage(signUpError.message);
      setErrorModalVisible(true); // Exibe o modal de erro
    }
  };

  const handleDownload = async (text, fileName) => {
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

  const termsText = `
    Termos e Condições:
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  `;

  const privacyText = `
    Política de Privacidade:
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  `;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <ImageBackground
          source={require('../images/seta.png')}
          style={styles.background} 
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.voltar}>Voltar</Text>
      </TouchableOpacity>
      
      <ImageBackground
        source={require('../images/email.png')}
        style={styles.email}
      />
      <Text style={styles.title}  numberOfLines={1}
  ellipsizeMode="tail"> Digite seu E-mail de Criação.</Text>
      <Text style={styles.title1}>Insira o e-mail para criar à sua conta.</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="***********"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Text style={styles.title2}>
        Deseja fazer login?{' '}
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText3}>Login</Text>
        </TouchableOpacity>
      </Text>
      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Criar Conta</Text>
        )}
      </TouchableOpacity>
      <View style={{ alignItems: 'center', marginTop: 20, top: 120, left: -10 }}>
        <Text style={styles.welcomeText6}>
          Se você estiver criando uma nova conta,{' '}
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.linkText}>Termos e Condições</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPrivacyModalVisible(true)}>
            <Text style={styles.linkText1}> {'\n'} Política de Privacidade</Text>
          </TouchableOpacity>
        </Text>
      </View>
      <Text style={styles.welcomeText7}>
        serão aplicados.
      </Text>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalText}>{termsText}</Text>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => handleDownload(termsText, 'termos_condicoes.txt')}
            >
              <Ionicons name="download" size={24} color="white" />
              <Text style={styles.downloadButtonText}>Baixar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={privacyModalVisible}
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPrivacyModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalText}>{privacyText}</Text>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => handleDownload(privacyText, 'politica_privacidade.txt')}
            >
              <Ionicons name="download" size={24} color="white" />
              <Text style={styles.downloadButtonText}>Baixar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={errorModalVisible} // Usa o novo estado para o modal de erro
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalText}>{modalMessage}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  background: {
    width: 24,
    height: 24,
    left: -160,
    top: -70,
  },
  voltar: {
    width: 206,
    height: 23,
    fontFamily: "Roboto",
    fontSize: 17,
    fontWeight: "700",
    fontStyle: "normal",
    lineHeight: 23,
    color: "#000000",
    top: -90,
    marginBottom: 20,
    left: -38,
  },
  email: {
    width: 91,
    height: 91,
    top: -90,
    left: -130,
  },
  title: {
    width: '100%', // Ajusta a largura para 100% do contêiner pai
    height: 23,
    fontFamily: "Regular 400",
    fontSize: 24,
    fontWeight: "700",
    fontStyle: "normal",
    lineHeight: 23,
    color: "#000000",
    top: -75,
    marginBottom: 20,
    left: -40, // Centraliza o texto horizontalmente
    textAlign: 'center', // Centraliza o texto dentro do componente
  },
  title1: {
    width: 336,
    height: 20,
    fontFamily: "Roboto",
    fontSize: 15,
    fontWeight: "400",
    fontStyle: "normal",
    lineHeight: 20,
    color: "#000000",
    left: 4,
    top: -70,
  },
  input: {
    width: 328,
    height: 54,
    borderColor: '#04C6AE',
    borderWidth: 2,
    borderRadius: 13,
    marginBottom: 10,
    paddingLeft: 10,
    top: -40,
  },
  title2: {
    width: 206,
    height: 23,
    fontFamily: "Regular 400",
    fontSize: 15,
    fontWeight: "300",
    fontStyle: "normal",
    lineHeight: 23,
    color: "#797979",
    top: -40,
    marginBottom: 20,
    left: -60,
  },
  linkText: {
    color: 'blue',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  linkText3: {
    color: 'blue',
    fontSize: 14,
  },
  linkText1: {
    color: 'blue',
    textDecorationLine: 'underline',
    fontSize: 12,
    top: 20,
    left:'-200%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30, // Ajuste a posição conforme necessário
    transform: [{ translateX: -50 }],
    borderRadius: 14, // Ajuste o tamanho conforme necessário
    backgroundColor: '#04C6AE',
    width: 328, // Ajuste o tamanho conforme necessário
    height: 54, // Ajuste o tamanho conforme necessário
    justifyContent: 'center',
    alignItems: 'center',
    top: 620,
    left: 80,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  welcomeText6: {
    color: 'black',
    fontSize: 12,
    marginTop: 10, // Adjust margin if needed
    textAlign: 'center', // Center the text
    fontFamily: 'Regular 400',
    fontWeight: 'bold',
    left: '10%',
  },
  welcomeText7: {
    color: 'black',
    fontSize: 12,
    marginTop: 10, // Adjust margin if needed
    textAlign: 'center', // Center the text
    fontFamily: 'Regular 400',
    fontWeight: 'bold',
    position: 'absolute',
    top: 785, // Adjust this value as needed
    left: '73%',
    transform: [{ translateX: -50 }],
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  downloadButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#04C6AE',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default Cadastro;