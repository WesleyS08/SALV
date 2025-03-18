import { Text, ImageBackground, StyleSheet, View, Image, TouchableOpacity } from "react-native";
import { useNavigation } from '@react-navigation/native';

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
    marginTop: 10, // Adjust margin if needed
    fontWeight: 'bold',
  },
  welcomeText1: {
    color: 'black',
    fontSize: 14,
    marginTop: 10, // Adjust margin if needed
    position: 'absolute',
    top: 500,
    left: 20,
    fontFamily: 'Rubik',
  },
  welcomeText2Container: {
    position: 'absolute',
    top: 600,
    left: 20,
  },
  welcomeText2: {
    color: 'black',
    fontSize: 14,
    marginTop: 10, // Adjust margin if needed
    fontFamily: 'Rubik',
    fontWeight: '500',
    left: -1,
    top: -35,
  },
  welcomeText2Normal: {
    fontWeight: '500',
    
  },
  welcomeText3Normal: {
    fontWeight: '500',
    top: -10,
    left: -5,
  },
  logo: {
    width: 72, // Ajuste o tamanho conforme necessário
    height: 72, // Ajuste o tamanho conforme necessário
    borderRadius: 20, // Ajuste o tamanho conforme necessário
    position: 'absolute',
    top: 280,
    left: '50%',
    transform: [{ translateX: -50 }],
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30, // Ajuste a posição conforme necessário
    left: '20%',
    transform: [{ translateX: -50 }],
    borderRadius: 14, // Ajuste o tamanho conforme necessário
    backgroundColor: '#B5CDCA',
    width: 324, // Ajuste o tamanho conforme necessário
    height: 54, // Ajuste o tamanho conforme necessário
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default function Index() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../images/background.png')}
        style={styles.background}
      >
        <Image
          source={require('../images/logo.png')}
          style={styles.logo} // Apply the logo style here
        />
        <Text style={styles.welcomeText}>Bem vindo ao SALV.</Text>
        <Text style={styles.welcomeText1}>Único sistema que te auxilia em vigilância e proteção em ambientes laboratórias.</Text>
        <View style={styles.welcomeText2Container}>
          <Text style={styles.welcomeText2}>
            🔹 <Text style={styles.welcomeText2Normal}>Monitoramento em tempo real para um ambiente mais seguro.</Text>
          </Text>
          <Text style={styles.welcomeText2}>
            🔹 <Text style={styles.welcomeText2Normal}>Alertas inteligentes para riscos.</Text>
          </Text>
          <Text style={styles.welcomeText2}>
            🔹 <Text style={styles.welcomeText2Normal}>Registro de acessos para total controle e transparência.</Text>
          </Text>
          <Text style={styles.welcomeText3Normal}>
            Sua segurança e a integridade do seu laboratório são nossa prioridade.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => navigation.navigate('Autenticacao')}
        >
          <Text style={styles.buttonText}>Próximo</Text>
        </TouchableOpacity>
      </ImageBackground>
    </View>
  );
}