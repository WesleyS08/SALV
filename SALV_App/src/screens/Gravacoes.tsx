import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useUserData } from '../contexts/useUserData';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../Global/DarkModeContext';
import { useFontSize } from '../Global/FontSizeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type Filmagem = {
    id: number;
    data: string;
    hora_inicio: string;
    hora_fim: string;
    evento: string;
    url_video?: string;
};

const Gravacoes = () => {
    const { isDarkMode } = useDarkMode();
    const themeStyles = isDarkMode ? darkStyles : lightStyles;
    const { user } = useAuth();
    const { userData, filmagens } = useUserData(user);
    const { fontSize, setFontSize } = useFontSize();

    const renderItem = ({ item }: { item: Filmagem }) => (
        <View style={[styles.itemContainer, themeStyles.itemContainer]}>
            <View style={styles.itemHeader}>
                <View style={styles.dateTimeContainer}>
                    <Ionicons name="calendar" size={16} color="#4CAF50" />
                    <Text style={[styles.dateText, themeStyles.text, { fontSize: fontSize - 2 }]}>
                        {item.data}
                    </Text>
                </View>
                <View style={styles.dateTimeContainer}>
                    <Ionicons name="time" size={16} color="#2196F3" />
                    <Text style={[styles.timeText, themeStyles.text, { fontSize: fontSize - 2 }]}>
                        {item.hora_inicio} - {item.hora_fim}
                    </Text>
                </View>
            </View>
            
            <Text style={[styles.eventText, themeStyles.text, { fontSize }]}>
                {item.evento}
            </Text>
            
            <View style={styles.videoContainer}>
                {item.url_video ? (
                    <>
                        <Video
                            source={{ uri: item.url_video }}
                            style={styles.videoPlayer}
                            useNativeControls
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={false}
                        />
                        <TouchableOpacity 
                            style={styles.downloadButton}
                            onPress={() => console.log('Download:', item.url_video)}
                        >
                            <Ionicons name="download" size={20} color="#FFF" />
                            <Text style={styles.downloadText}>Download</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.noVideoContainer}>
                        <Ionicons name="videocam-off" size={40} color="#888" />
                        <Text style={[styles.noVideoText, themeStyles.text]}>
                            Vídeo não disponível
                        </Text>
                    </View>
                )}
            </View>
            
            <View style={styles.itemFooter}>
                <Text style={[styles.durationText, themeStyles.secondaryText]}>
                    <Ionicons name="timer" size={14} /> {item.duracao}
                </Text>
                <TouchableOpacity style={styles.shareButton}>
                    <Ionicons name="share-social" size={18} color="#0D293E" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, themeStyles.container]}>
            {/* Header com gradiente */}
            <LinearGradient
                colors={isDarkMode ? ['#0D293E', '#121212'] : ['#0D293E', '#f8f9fa']}
                style={styles.headerGradient}
            >
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
                            <Text style={[styles.userName, { color: '#FFF', fontSize }]} numberOfLines={1}>
                                {userData?.Nome || user?.displayName || 'Usuário'}
                            </Text>
                            <Text style={[styles.userEmail, { color: 'rgba(255,255,255,0.8)', fontSize: fontSize - 2 }]} numberOfLines={1}>
                                {user?.email || 'email@exemplo.com'}
                            </Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {/* Conteúdo principal */}
            <View style={styles.content}>
                <Text style={[styles.sectionTitle, themeStyles.text, { fontSize: fontSize + 2 }]}>
                    Gravações Registradas
                </Text>
                <Text style={[styles.sectionSubtitle, themeStyles.secondaryText, { fontSize }]}>
                    Todas as gravações capturadas do seu ambiente
                </Text>

                {filmagens.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Image
                            source={require('../../assets/img/image.png')}
                            style={styles.emptyImage}
                        />
                        <Text style={[styles.emptyText, themeStyles.text, { fontSize }]}>
                            Nenhuma gravação encontrada
                        </Text>
                        <Text style={[styles.emptySubtext, themeStyles.secondaryText, { fontSize: fontSize - 2 }]}>
                            Quando novas gravações forem feitas, elas aparecerão aqui
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filmagens}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        fontWeight: '600',
        marginBottom: 4,
    },
    userEmail: {
        opacity: 0.8,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    sectionSubtitle: {
        textAlign: 'center',
        marginBottom: 25,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyImage: {
        width: 150,
        height: 150,
        marginBottom: 20,
    },
    emptyText: {
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtext: {
        textAlign: 'center',
    },
    listContainer: {
        paddingBottom: 20,
    },
    itemContainer: {
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        marginLeft: 5,
    },
    timeText: {
        marginLeft: 5,
    },
    eventText: {
        fontWeight: '600',
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    videoContainer: {
        width: '100%',
        aspectRatio: 16/9,
    },
    videoPlayer: {
        width: '100%',
        height: '100%',
    },
    noVideoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    noVideoText: {
        marginTop: 10,
    },
    downloadButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    downloadText: {
        color: '#FFF',
        marginLeft: 5,
        fontWeight: '600',
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderTopWidth: 1,
    },
    durationText: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shareButton: {
        padding: 5,
    },
});

const darkStyles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
    },
    itemContainer: {
        backgroundColor: '#1E1E1E',
        borderColor: '#333',
    },
    text: {
        color: '#FFF',
    },
    secondaryText: {
        color: '#bdc3c7',
    },
    itemHeader: {
        borderColor: '#333',
    },
    itemFooter: {
        borderColor: '#333',
    },
});

const lightStyles = StyleSheet.create({
    container: {
        backgroundColor: '#F8F9FA',
    },
    itemContainer: {
        backgroundColor: '#FFF',
        borderColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    text: {
        color: '#2C3E50',
    },
    secondaryText: {
        color: '#7F8C8D',
    },
    itemHeader: {
        borderColor: '#EEE',
    },
    itemFooter: {
        borderColor: '#EEE',
    },
});

export default Gravacoes;