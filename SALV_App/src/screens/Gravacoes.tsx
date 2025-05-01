import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { Video } from 'expo-av'; // Importando o componente Video do expo-av
import { useUserData } from '../contexts/useUserData';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../Global/DarkModeContext';
import { useFontSize } from '../Global/FontSizeContext';

const Gravacoes = () => {
    const { isDarkMode } = useDarkMode();
    const themeStyles = isDarkMode ? darkStyles : lightStyles;
    const { user } = useAuth();
    const { userData, filmagens } = useUserData(user);
    const { fontSize, setFontSize } = useFontSize();

    const abrirLink = (url) => {
        // Função para abrir o link do vídeo
        console.log('Abrir link:', url);
    };

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
                        <Text style={[styles.userName, themeStyles.text, { fontSize }]} numberOfLines={1}>
                            {userData?.Nome || user?.displayName || 'Usuário'}
                        </Text>
                        <Text style={[styles.userEmail, themeStyles.secondaryText, { fontSize }]} numberOfLines={1}>
                            {user?.email || 'email@exemplo.com'}
                        </Text>
                    </View>
                </View>
            </View>

            <Text style={[styles.text2, themeStyles.text, { fontSize }]}>Gravações Registradas</Text>
            <Text style={[styles.text3, themeStyles.text, { fontSize }]}>Todas as gravações capturadas do seu ambiente, serão exibidas e disponibilizadas para download.</Text>
            <View style={[styles.base, themeStyles.base]}>
                {filmagens.length === 0 ? (
                    <>
                        <Text style={[styles.text4, themeStyles.text, { fontSize }]}>
                            Nenhuma Gravação Encontrada
                        </Text>
                        <View style={{ marginTop: 20 }}>
                            <Image
                                source={require('../../assets/img/image.png')}
                                style={[styles.img, themeStyles.img]}
                            />
                        </View>
                    </>
                ) : (
                    <FlatList
                        data={filmagens}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.itemContainer}>
                                <Text style={[styles.textItem, themeStyles.text, { fontSize }]}>
                                    📅 {item.data} ⏰ {item.hora_inicio} - {item.hora_fim}
                                </Text>
                                <Text style={[styles.textItem, themeStyles.secondaryText, { fontSize: fontSize - 2 }]}>
                                    Evento: {item.evento} | Duração: {item.duracao}
                                </Text>
                                {/* Reprodutor de vídeo usando expo-av */}
                                <View style={{ marginTop: 10, width: '100%', height: 200 }}>
                                    {item.url_video ? (
                                        <Video
                                            source={{ uri: item.url_video }} // Usando a URL do vídeo
                                            style={{ width: '100%', height: '100%' }}
                                            useNativeControls
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <Text style={[styles.text4, themeStyles.text, { fontSize }]}>
                                            Vídeo não disponível
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}
                    />
                )}
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
        shadowColor: "#000",       
        shadowOffset: {
            width: 0,            
            height: 2,           
        },
        shadowOpacity: 0.25,      
        shadowRadius: 3.84,       
        elevation: 5,            
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
    textItem: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
});

const darkStyles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
    },
    base: {
        backgroundColor: '#1e1e1e',
    },
    text: {
        color: '#ffffff',
    },
    secondaryText: {
        color: '#bdc3c7',
    },
    link: {
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
    text: {
        color: '#2c3e50',
    },
    secondaryText: {
        color: '#7f8c8d',
    },
    link: {
        color: '#2c3e50',
    }
});

export default Gravacoes;
