import React, { useState } from 'react';
import { Text, ImageBackground, StyleSheet, View, Image, TouchableOpacity, Modal } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
    height: '100%',
  },
  welcomeText: {
    color: 'black',
    fontSize: 24,
    marginTop: -550, // Adjust margin to move closer to the logo
    fontWeight: 'bold',
    left: -60,
    top: 40,
  },
  welcomeText1: {
    color: 'black',
    fontSize: 11,
    marginTop: 10, // Adjust margin if needed
    position: 'absolute',
    top: 570,
    left: 15,
    fontFamily: 'Regular 400',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  welcomeText2: {
    color: 'black',
    fontSize: 15,
    marginTop: 10, // Adjust margin if needed
    position: 'absolute',
    top: 250, // Ajuste a posição conforme necessário
    left: '-2%',
    transform: [{ translateX: -50 }],
    textAlign: 'center',
    fontFamily: 'Regular 400',
    fontWeight: '700',
    flexWrap: 'wrap', // Adiciona quebra de linha
    lineHeight: 20,
    width: '100%', // Garante que o texto ocupe toda a largura disponível
  },
  welcomeText3: {
    color: 'black',
    fontSize: 19,
    marginTop: 10, // Adjust margin if needed
    position: 'absolute',
    top: 200,
    left: 30,
    fontFamily: 'Regular 400',
    fontWeight: 'bold',
  },
  welcomeText4: {
    color: 'black',
    fontSize: 22,
    marginTop: 10, // Adjust margin if needed
    position: 'absolute',
    top: 350,
    left: '32%',
    fontFamily: 'Regular 400',
    fontWeight: 'bold',
  },
  welcomeText5: {
    color: 'black',
    fontSize: 14,
    marginTop: 10, // Adjust margin if needed
    position: 'absolute',
    top: 390,
    left: '20%',
    transform: [{ translateX: -50 }],
    textAlign: 'center', // Center the text
    fontFamily: 'Regular 400',
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
    top: 789, // Adjust this value as needed
    left: '67%',
    transform: [{ translateX: -50 }],
  },
  linkText: {
    color: 'blue',
    textDecorationLine: 'underline',
    fontSize: 12,
  },
  linkText1: {
    color: 'blue',
    textDecorationLine: 'underline',
    fontSize: 12,
    top: 20,
    left:'-200%',
  },
  logo: {
    width: 72, // Ajuste o tamanho conforme necessário
    height: 72, // Ajuste o tamanho conforme necessário
    borderRadius: 20, // Ajuste o tamanho conforme necessário
    position: 'absolute',
    top: 120,
    left: '20%',
    transform: [{ translateX: -50 }],
  },
  retangulo: {
    width: 32, // Ajuste o tamanho conforme necessário
    height: 4, // Ajuste o tamanho conforme necessário
    borderRadius: 8, // Ajuste o tamanho conforme necessário
    position: 'absolute',
    top: '41%',
    left: '48%',
    transform: [{ translateX: -16 }, { translateY: -2 }], // Centraliza o retângulo
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30, // Ajuste a posição conforme necessário
    left: '20%',
    transform: [{ translateX: -50 }],
    borderRadius: 14, // Ajuste o tamanho conforme necessário
    backgroundColor: '#04C6AE',
    width: 328, // Ajuste o tamanho conforme necessário
    height: 54, // Ajuste o tamanho conforme necessário
    justifyContent: 'center',
    alignItems: 'center',
    top: 430,
  },
  buttonContainer1: {
    position: 'absolute',
    bottom: 30, // Ajuste a posição conforme necessário
    left: '20%',
    transform: [{ translateX: -50 }],
    borderRadius: 14, // Ajuste o tamanho conforme necessário
    width: 328, // Ajuste o tamanho conforme necessário
    height: 54, // Ajuste o tamanho conforme necessário
    justifyContent: 'center',
    alignItems: 'center',
    top: 500,
    borderColor: "rgba(215, 215, 215, 1.0)",
    borderWidth: 1,
    borderStyle: 'solid',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonText1: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
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

export default function Principal() {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

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
      <ImageBackground
        source={require('../images/background.png')}
        style={styles.background}
      >
        <Image
          source={require('../images/Rectangle 9.png')}
          style={styles.retangulo} 
        />
        <Image
          source={require('../images/logo.png')}
          style={styles.logo} // Apply the logo style here
        />
        <Text style={styles.welcomeText}>SALV</Text>
        <Text style={styles.welcomeText1}>Caso o e-mail informado não esteja cadastrado, automaticamente será feito um cadastro.</Text>
        <Text style={styles.welcomeText2}>
          Segurança inteligente para laboratórios.{"\n"}
          Monitore, proteja e tenha controle total!
        </Text>
        <Text style={styles.welcomeText3}>Sistema de Alerta Laboratorial com Visão</Text>
        <Text style={styles.welcomeText4}>Login ou Cadastro</Text>
        <Text style={styles.welcomeText5}>Selecione sua maneira para se cadastrar ou logar no aplicativo.</Text>
        <View style={{ alignItems: 'center', marginTop: 20, top: 600, left: -10 }}>
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
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Continuar com Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonContainer1}
          onPress={() => navigation.navigate('Biometria')}
        >
          <Text style={styles.buttonText1}>Continuar com Biometria</Text>
        </TouchableOpacity>
      </ImageBackground>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text>Termos e Condições...</Text>
            <Text>{termsText}</Text>
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
        <View style={styles.modalContent}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPrivacyModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text>Política de Privacidade...</Text>
            <Text>{privacyText}</Text>
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
    </View>
  );
}