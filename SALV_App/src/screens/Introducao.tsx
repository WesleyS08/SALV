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
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => navigation.navigate('Principal')}
        >
          <Text style={styles.buttonText}>Próximo</Text>
        </TouchableOpacity>
      </ImageBackground>
    </View>
  );
}