import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'react-native';
import { useUserData } from '../contexts/useUserData';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../Global/DarkModeContext';

const AoVivo = () => {
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
            
            <Text style={[styles.text2, themeStyles.text]}>Ao Vivo</Text>
            
            <View style={[styles.base, themeStyles.base]}>
                <View style={[styles.img, themeStyles.img]}>
                    <Image
                        source={require('../images/videocam_off_24dp_E3E3E3.png')}
                        style={{ width: 54, height: 54, top: 140, left: 210 }}
                    />
                    <Text style={[styles.text, themeStyles.text]}>Sem movimento em seu ambiente.</Text>
                </View>      
            </View>
            
            <Text style={[styles.text1, themeStyles.text]}>
                Quando houver algum movimento, você será notificado e poderá visualizar o movimento.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
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
        height: 378,
        borderRadius: 14,
        backgroundColor: "#D9D9D9",
    },
    img: {
        width: '95%',
        height: 369,
        marginTop: 4,
        borderRadius: 8,
        backgroundColor: "#201F21",
    },
    text2: {
        fontSize: 18,
        fontWeight: 'bold',
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
        backgroundColor: '#f0f0f0',
    },
    text: {
        color: '#2c3e50',
    },
    secondaryText: {
        color: '#7f8c8d',
    }
});

export default AoVivo;