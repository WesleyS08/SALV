import React, { useLayoutEffect, useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Modal, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const EsqueciSenha = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);


  const handleContinue = () => {
    if (email.trim() === '') {
      setErrorModalVisible(true);
    } else {
      setModalVisible(true);
    }
  };

  const termsText = `
   Verifique seu Email.
    Foi enviado uma senha aleátoria para sua caixa de e-mail. Utiliza-a para acessar sua conta.
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
        source={require('../images/cadeado.png')}
        style={styles.email}
      />
      <Text style={styles.title}>Esqueceu Sua Senha?</Text>
      <Text style={styles.title1}>Digite seu e-mail válido para receber uma senha temporária.</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
     
      <Text style={styles.title2}>
        Lembrou sua senha?{' '}
        <TouchableOpacity onPress={() => navigation.navigate('Autenticacao')}>
          <Text style={styles.linkText}>Login</Text>
        </TouchableOpacity>
      </Text>

      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
            <Text style={styles.modalText}>Verifique seu Email.</Text>
            <Text style={styles.modalText1}>Foi enviado uma senha aleátoria para sua caixa de entrada.Utiliza-a para acessar sua conta.</Text>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.downloadButtonText}>Ok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => {
          setErrorModalVisible(!errorModalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setErrorModalVisible(!errorModalVisible)}
            >
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
            <Text style={styles.modalText}>Erro</Text>
            <Text style={styles.modalText1}>Por favor, insira um e-mail válido.</Text>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => setErrorModalVisible(!errorModalVisible)}
            >
              <Text style={styles.downloadButtonText}>Ok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContent: {
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
  downloadButton: {
    width: 108,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#04C6AE",
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    left: 35,
  },
  welcomeText7: {
    color: 'black',
    fontSize: 12,
    marginTop: 10, // Adjust margin if needed
    textAlign: 'center', // Center the text
    fontFamily: 'Regular 400',
    fontWeight: 'bold',
    position: 'absolute',
    top: 797, // Adjust this value as needed
    left: '73%',
    transform: [{ translateX: -50 }],
  },
  linkText1: {
    color: 'blue',
    textDecorationLine: 'underline',
    fontSize: 12,
    top: 20,
    left: '-200%',
  },
  linkText2: {
    color: 'blue',
    textDecorationLine: 'underline',
    fontSize: 12,
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
    top: 580,
    left: 80,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
    top: -160,
  },
  welcomeText1: {
    width: 328,
    height: 40,
    fontFamily: "Roboto",
    fontSize: 14,
    fontWeight: "700",
    fontStyle: "normal",
    lineHeight: 20,
    textAlign: "center",
    color: "#464242",
    top: -20,
    left: -1,
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
    top: -180,
    marginBottom: 20,
    left: -38,
  },
  email: {
    width: 41, // Ajuste o tamanho conforme necessário
    height: 51, // Ajuste o tamanho conforme necessário
    marginTop: 20, // Adicione margem superior para ajustar a posição
    marginBottom: 20, // Adicione margem inferior para ajustar a posição
    alignSelf: 'center', // Centraliza o ícone horizontalmente
    top: -140,
    left: -140,
  },
  title: {
    width: 206,
    height: 23,
    fontFamily: "Regular 400",
    fontSize: 24,
    fontWeight: "700",
    fontStyle: "normal",
    lineHeight: 23,
    color: "#000000",
    top: -120,
    marginBottom: 20,
    left: -60,
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
    top: -86,
    marginBottom: 20,
    left: -60,
  },
  linkText: {
    color: 'blue',
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
    top: -110,
  },
  input: {
    width: 328,
    height: 54,
    borderColor: '#04C6AE',
    borderWidth: 2,
    borderRadius: 13,
    marginBottom: 10,
    paddingLeft: 10,
    top: -80,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    left: -10,
    fontWeight: "700",
  },
  modalText1: {
    fontSize: 16,
    marginBottom: 20,
    left: -5,
    top: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },

});

export default EsqueciSenha;