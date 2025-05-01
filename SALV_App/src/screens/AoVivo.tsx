import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Linking, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useUserData } from '../contexts/useUserData';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../Global/DarkModeContext';
import YoutubePlayer from 'react-native-youtube-iframe';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFontSize } from '../Global/FontSizeContext';

const { width } = Dimensions.get('window');

const AoVivo = ({ navigation }) => {
    const { isDarkMode } = useDarkMode();
    const themeStyles = isDarkMode ? darkStyles : lightStyles;
    const { user } = useAuth();
    const { userData, isLiveActive, ngrokLink, updatedAtFormatted } = useUserData(user);
    const { fontSize, setFontSize } = useFontSize();
    
    const playerRef = useRef<any>(null);
    const [playerError, setPlayerError] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Configura a orientação da tela
    useEffect(() => {
        ScreenOrientation.unlockAsync();
        
        return () => {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        };
    }, []);

    const handlePlayerError = (error: string) => {
        console.error('Erro no player:', error);
        setPlayerError(true);
    };

    const handlePlayerReady = () => {
        setPlayerReady(true);
        setPlayerError(false);
    };

    const handleRetry = () => {
        if (playerRef.current) {
            playerRef.current.seekTo(0);
        }
        setPlayerError(false);
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        if (!isFullscreen) {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        }
    };
    const [streamInfo, setStreamInfo] = useState({
        isLive: false,
        lastStream: "",
        viewers: 0
    });

    const handlePress = () => {
        const url = ngrokLink || `https://www.youtube.com/watch?v=wACTDUyZEws`;
        Linking.openURL(url).catch(err => console.error('Erro ao abrir link:', err));
    };

    return (
        <ScrollView 
            style={[styles.container, themeStyles.container]}
            contentContainerStyle={styles.scrollContainer}
        >
            {/* Header com gradiente */}
            <LinearGradient
                colors={isDarkMode ? ['#0D293E', '#121212'] : ['#0D293E', '#f8f9fa']}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    
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
                            <Text style={[styles.userName,  { fontSize }]} numberOfLines={1}>
                                {userData?.Nome || user?.displayName || 'Usuário'}
                            </Text>
                            <Text style={[styles.userEmail , { fontSize }]} numberOfLines={1}>
                                {user?.email || 'email@exemplo.com'}
                            </Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {/* Área principal de conteúdo */}
            <View style={styles.content}>
                <Text style={[styles.title, themeStyles.text, { fontSize }]}>TRANSMISSÃO AO VIVO</Text>
                
                {isLiveActive ? (
                    !playerError ? (
                        <View style={[styles.videoContainer, isFullscreen && styles.fullscreenVideo]}>
                            <YoutubePlayer
                                ref={playerRef}
                                height={isFullscreen ? width : 220}
                                play={true}
                                videoId="wACTDUyZEws"
                                webViewStyle={styles.videoPlayer}
                                onError={handlePlayerError}
                                onReady={handlePlayerReady}
                            />
                            <TouchableOpacity 
                                style={styles.fullscreenButton}
                                onPress={toggleFullscreen}
                            >
                                <Ionicons 
                                    name={isFullscreen ? "contract" : "expand"} 
                                    size={24} 
                                    color="#FFF" 
                                />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.placeholder, themeStyles.placeholder]}>
                            <Ionicons name="alert-circle" size={60} color="#FF6B6B" />
                            <Text style={[styles.placeholderText, themeStyles.text, { fontSize }]}>
                                Erro ao carregar a transmissão
                            </Text>
                            <TouchableOpacity 
                                style={styles.retryButton}
                                onPress={handleRetry}
                            >
                                <Text style={[styles.retryButtonText, { fontSize }]}>Tentar novamente</Text>
                            </TouchableOpacity>
                        </View>
                    )
                ) : (
                    <View style={[styles.placeholder, themeStyles.placeholder]}>
                        <Ionicons name="videocam-off" size={60} color="#888" />
                        <Text style={[styles.placeholderText, themeStyles.text, { fontSize }]}>
                            Nenhuma transmissão no momento
                        </Text>
                    </View>
                )}

                {/* Informações da transmissão */}
                <View style={[styles.infoCard, themeStyles.infoCard]}>
                    <View style={styles.infoRow}>
                        <Ionicons name="time" size={20} color="#4CAF50" />
                        <Text style={[styles.infoLabel, themeStyles.secondaryText, { fontSize }]}>Status:</Text>
                        <Text style={[styles.infoValue, themeStyles.text]}>
                            {isLiveActive ? "Ao vivo agora" : "Offline"}
                        </Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={20} color="#2196F3" />
                        <Text style={[styles.infoLabel, themeStyles.secondaryText, { fontSize }]}>Última transmissão:</Text>
                        <Text style={[styles.infoValue, themeStyles.text, { fontSize }]}> {updatedAtFormatted  ?? 'Indisponível'}</Text>
                    </View>
                    
                </View>

                {/* Ações */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.primaryButton]}
                        onPress={handlePress}
                    >
                        <Ionicons name="play" size={20} color="#FFF" />
                        <Text style={styles.actionButtonText}>Assistir</Text>
                    </TouchableOpacity>
                    
                </View>

                {/* Descrição */}
                <View style={[styles.descriptionCard, themeStyles.card]}>
                    <Text style={[styles.descriptionTitle, themeStyles.text, { fontSize }]}>Sobre a transmissão</Text>
                    <Text style={[styles.descriptionText, themeStyles.secondaryText, { fontSize }]}>
                        Acompanhe nossa transmissão ao vivo com os melhores conteúdos. 
                        Quando estivermos no ar, você será notificado automaticamente.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        paddingBottom: 40,
    },
    headerGradient: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 15,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 2,
        color: '#FFF',
    },
    userEmail: {
        fontSize: 14,
        opacity: 0.8,
        color: '#FFF',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
        letterSpacing: 1,
    },
    videoContainer: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    fullscreenVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
    },
    videoPlayer: {
        borderRadius: 12,
    },
    fullscreenButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 20,
    },
    placeholder: {
        width: '100%',
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        marginBottom: 20,
    },
    placeholderText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 15,
    },
    retryButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#0D293E',
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    infoCard: {
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoLabel: {
        fontSize: 14,
        marginLeft: 10,
        marginRight: 5,
        width: 120,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        width: '48%',
    },
    primaryButton: {
        backgroundColor: '#0D293E',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#0D293E',
    },
    actionButtonText: {
        marginLeft: 8,
        fontWeight: '600',
        color: '#FFF',
    },
    descriptionCard: {
        borderRadius: 12,
        padding: 20,
    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
    },
});

const darkStyles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
    },
    text: {
        color: '#FFF',
    },
    secondaryText: {
        color: '#bdc3c7',
    },
    placeholder: {
        backgroundColor: '#1E1E1E',
    },
    infoCard: {
        backgroundColor: '#1E1E1E',
    },
    card: {
        backgroundColor: '#1E1E1E',
        shadowColor: '#000',
    },
});

const lightStyles = StyleSheet.create({
    container: {
        backgroundColor: '#F8F9FA',
    },
    text: {
        color: '#2C3E50',
    },
    secondaryText: {
        color: '#7F8C8D',
    },
    placeholder: {
        backgroundColor: '#F0F0F0',
    },
    infoCard: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    card: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});

export default AoVivo;