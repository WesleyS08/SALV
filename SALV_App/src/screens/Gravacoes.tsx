import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'react-native';
import { useUserData } from '../contexts/useUserData';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../Global/DarkModeContext';


const Gravacoes = () => {
    const { isDarkMode } = useDarkMode();
    const themeStyles = isDarkMode ? darkStyles : lightStyles;
  
    const { user } = useAuth();
    const { userData } = useUserData(user);
  
    
    return (
        <View style={[styles.container, themeStyles.container]}>
            <View style={styles.header}>
                <View style={styles.profileContainer}>
                    <Image
                        source={
                            userData?.photoURL
                            ? { uri: userData.photoURL }
                            : require('../../assets/img/user.png')
                        }
                        style={styles.profileImage}
                    />
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, themeStyles.text]} numberOfLines={1}>
                            {userData?.Nome || user?.displayName || 'Usuário'}
                        </Text>
                        <Text style={[styles.userEmail, themeStyles.secondaryText]} numberOfLines={1}>
                            {user?.email || 'email@exemplo.com'}
                        </Text>
                    </View>
                </View>
            </View>
            
            <Text style={[styles.text2, themeStyles.text]}>Gravações Registradas</Text>
            <Text style={[styles.text3, themeStyles.text]}>Todas as gravações capturadas do seu ambiente, serão exibidas e disponibilizadas para download.</Text>
            <View style={[styles.base, themeStyles.base]}>
                 <Text style={[styles.text4, themeStyles.text]}>
                    Nenhuma Gravação Encontrada
                </Text>  
                  <View style={{ marginTop: 20 }}>
                    <Image
                        source={require('../../assets/img/image.png')}
                        style={[styles.img, themeStyles.img]}
                    />
                    </View>

            </View>
            
           
    
        </View>
    );
};

const styles = StyleSheet.create({

  img: {
    width: 24,
    height: 24,
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 1.0)"
  },
    link3: {
        fontSize: 16,
        color: '#000',
        fontWeight: 'bold',
        marginTop: 60,
        textAlign: 'center',
        width: '80%',
        alignSelf: 'center',
    },
    link: {
        color: 'blue',
        fontWeight: 'bold',
        textDecorationLine: 'underline'
      },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f0f0f0',
    },
    header: {
        width: '100%',
        marginBottom: 30,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#0D293E',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        opacity: 0.8,
    },
    secondaryText: {
        color: '#bdc3c7',
    },
    base: {
        width: '100%',
        alignItems: 'center',
        marginTop: 50,
        height: 478,
        borderRadius: 14,
        backgroundColor: "#D9D9D9",
        shadowColor: "#000",       // Cor da sombra
        shadowOffset: {
            width: 0,            // Deslocamento horizontal
            height: 2,           // Deslocamento vertical
        },
        shadowOpacity: 0.25,      // Opacidade (0 a 1)
        shadowRadius: 3.84,       // Raio do borrão
        // Sombra para Android
        elevation: 5,            // Nível de elevação (Android)
    },
    text4: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000',
      textAlign: 'center',
      marginTop: 20,
  },
    
    text2: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
        marginTop: 20,
    },
    text3: {
      fontSize: 16,
      color: '#000',
      textAlign: 'center',
      marginTop: 20,
  },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 250,
        textAlign: 'center',
    },
    text1: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 30,
        textAlign: 'center',
        width: '80%',
        alignSelf: 'center',
    },
});

const darkStyles = StyleSheet.create({
  
    container: {
        backgroundColor: '#121212',
    },
    base: {
        backgroundColor: '#1e1e1e',
    },
    img: {
        backgroundColor: '#2d2d2d',
    },
    text: {
        color: '#ffffff',
    },
    secondaryText: {
        color: '#bdc3c7',
    },
    link3:{
        color: '#ffffff',
    }
});

const lightStyles = StyleSheet.create({
    container: {
        backgroundColor: '#f8f9fa',
    },
    base: {
        backgroundColor: '#ffffff',
    },
    img: {
        backgroundColor: 'dark',
    },
    text: {
        color: '#2c3e50',
    },
    secondaryText: {
        color: '#7f8c8d',
    }, 
    link3:{
        color: '#2c3e50',
    }
});

export default Gravacoes;