import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Image, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Linking} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/useUserData';
import { useDadosAcessos } from '../contexts/useDadosAcessos';
import CustomToast from '../components/CustomToast';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/pt-br';
import { useDarkMode } from '../Global/DarkModeContext';
import { useFontSize } from '../Global/FontSizeContext';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import supabase from '../DB/supabase';

moment.locale('pt-br');

const Home = ({ navigation }: any) => {
  const { user, loading: authLoading } = useAuth();
  const { userData, loading: dataLoading, errorMsg } = useUserData(user);
  const { acessos, filmagens, loading: dadosLoading, error: dadosError } = useDadosAcessos();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [lastAccess, setLastAccess] = useState<string | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState('Bem-vindo de volta!');
  const [activeTab, setActiveTab] = useState<'acessos' | 'filmagens'>('acessos');
  const { fontSize, setFontSize } = useFontSize();

  // Usando o contexto de DarkMode
  const { isDarkMode } = useDarkMode();
  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const firstAccess = await AsyncStorage.getItem('hasSeenWelcome');
        if (!firstAccess) {
          setShowModal(true);
          await AsyncStorage.setItem('hasSeenWelcome', 'true');
        }

        const storedLastAccess = await AsyncStorage.getItem('lastAccess');
        const now = new Date();

        if (storedLastAccess) {
          const lastDate = new Date(storedLastAccess);
          setLastAccess(moment(lastDate).format('LL [às] LT'));

          const diffDays = moment(now).diff(lastDate, 'days');
          const diffHours = moment(now).diff(lastDate, 'hours');

          if (diffDays > 30) {
            setWelcomeMessage(`NOSSA! Fazia ${diffDays} dias! 😱`);
          } else if (diffDays > 7) {
            setWelcomeMessage(`Quanto tempo! Fazia ${diffDays} dias!`);
          } else if (diffDays > 1) {
            setWelcomeMessage(`Que saudade! Fazia ${diffDays} dias!`);
          } else if (diffDays === 1) {
            setWelcomeMessage(`Voltou depois de um dia!`);
          } else if (diffHours > 1) {
            setWelcomeMessage(`Bem-vindo de volta! Você acessou há ${diffHours} horas.`);
          } else {
            setWelcomeMessage('Bem-vindo de novo! 😊');
          }
        } else {
          setWelcomeMessage('Primeira vez aqui? Seja bem-vindo! 🎉');
        }

        await AsyncStorage.setItem('lastAccess', now.toString());
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
      }
    };

    checkAccess();
  }, []);
  useEffect(() => {
    const saveToken = async () => {
      if (!user) return;
  
      const token = await registerForPushNotificationsAsync();
      if (!token) return;
  
      const { error } = await supabase
        .from('Tb_Usuarios')
        .update({ expo_push_token: token }) 
        .eq('ID_Usuarios', user.uid);
  
      if (error) {
        console.error('Erro salvando push token:', error.message);
      }
    };
  
    saveToken();
  }, [user]);

  const handleOpenVideo = (url: string) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        setToastMessage('Não foi possível abrir o vídeo');
      }
    });
  };

  const renderAcessoItem = ({ item }: { item: any }) => (
    <View style={[styles.itemContainer, themeStyles.itemContainer]}>
      <View style={styles.itemHeader}>
        <Ionicons name="log-in" size={20} color="#4CAF50" />
        <Text style={[styles.itemTitle, themeStyles.text, { fontSize }]}>
          {item.Nome_usuario || 'Usuário não identificado'}
        </Text>
      </View>
      <View style={styles.itemRow}>
        <Text style={[styles.itemLabel, themeStyles.secondaryText, { fontSize }]} >Entrada:</Text>
        <Text style={[styles.itemValue, themeStyles.text , { fontSize }]}>
          {moment(item.entrada).format('DD/MM/YYYY HH:mm')}
        </Text>
      </View>
      <View style={styles.itemRow}>
        <Text style={[styles.itemLabel, themeStyles.secondaryText , { fontSize }]}>Saída:</Text>
        <Text style={[styles.itemValue, themeStyles.text, { fontSize }]}>
          {item.saida ? moment(item.saida).format('DD/MM/YYYY HH:mm') : 'Em andamento'}
        </Text>
      </View>
      <View style={styles.itemRow}>
        <Text style={[styles.itemLabel, themeStyles.secondaryText , { fontSize }]}>Dispositivo:</Text>
        <Text style={[styles.itemValue, themeStyles.text, { fontSize }]} numberOfLines={1}>
          {item.Dispositivo_id || 'Não informado'}
        </Text>
      </View>
    </View>
  );

  const renderFilmagemItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.itemContainer, themeStyles.itemContainer]}
      onPress={() => navigation.navigate('Gravações', { filmagem: item })}
    >
      <View style={styles.itemHeader}>
        <Ionicons name="videocam" size={20} color="#2196F3" />
        <Text style={[styles.itemTitle, themeStyles.text , { fontSize }]}>
          {item.evento || 'Filmagem sem título'}
        </Text>
      </View>
      <View style={styles.itemRow}>
        <Text style={[styles.itemLabel, themeStyles.secondaryText , { fontSize }]}>Data:</Text>
        <Text style={[styles.itemValue, themeStyles.text, { fontSize }]}>
          {moment(item.data).format('DD/MM/YYYY')}
        </Text>
      </View>
      <View style={styles.itemRow}>
        <Text style={[styles.itemLabel, themeStyles.secondaryText, { fontSize }]}>Horário:</Text>
        <Text style={[styles.itemValue, themeStyles.text, { fontSize }]}>
          {item.hora_inicio} - {item.hora_fim}
        </Text>
      </View>
      <View style={styles.itemRow}>
        <Text style={[styles.itemLabel, themeStyles.secondaryText, { fontSize }]}>Duração:</Text>
        <Text style={[styles.itemValue, themeStyles.text, { fontSize }]}>{item.duracao}</Text>
      </View>
      <View style={styles.itemRow}>
      <Text style={[styles.itemLabel, themeStyles.secondaryText, { fontSize }]}>Tamanho:</Text>
      <Text style={[styles.itemValue, themeStyles.text, { fontSize }]}>{item.tamanho_arquivo_mb} MB</Text>
      </View>
    </TouchableOpacity>
  );

  if (authLoading || dataLoading || dadosLoading) {
    return (
      <SafeAreaView style={[styles.container, themeStyles.container]}>
        <ActivityIndicator size="large" color="#0D293E" />
        <Text style={[styles.loadingText, themeStyles.text , { fontSize }]}>Carregando dados...</Text>
      </SafeAreaView>
    );
  }

  if (errorMsg || dadosError) {
    return (
      <SafeAreaView style={[styles.container, themeStyles.container]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={40} color="#ff6659" />
          <Text style={[styles.errorText, themeStyles.errorText , { fontSize }]}>
            {errorMsg || dadosError}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {toastMessage && (
          <CustomToast
            message={toastMessage}
            duration={5000}
            onClose={() => setToastMessage(null)}
          />
        )}

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
              <Text style={[styles.userName, themeStyles.text , { fontSize }]} numberOfLines={1}>
                {userData?.Nome || user?.displayName || 'Usuário'}
              </Text>
              <Text style={[styles.userEmail, themeStyles.secondaryText, { fontSize }]} numberOfLines={1}>
                {user?.email || 'email@exemplo.com'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={[styles.card, themeStyles.card]}>
            <Text style={[styles.welcomeTitle, themeStyles.text , { fontSize }]}>
              {welcomeMessage}
            </Text>
            <Text style={[styles.welcomeText, themeStyles.secondaryText , { fontSize }]}>
              {lastAccess
                ? `Último acesso: ${lastAccess}`
                : 'Estamos felizes em te ver por aqui!'}
            </Text>
          </View>

          <View style={[styles.tabsContainer, themeStyles.tabsContainer]}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'acessos' && styles.activeTabButton,
                activeTab === 'acessos' && themeStyles.activeTabButton
              ]}
              onPress={() => setActiveTab('acessos')}
            >
              <Text style={[
                styles.tabButtonText,
                activeTab === 'acessos' && styles.activeTabButtonText,
                themeStyles.tabButtonText , { fontSize }
              ]}>
                Histórico de Acessos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'filmagens' && styles.activeTabButton,
                activeTab === 'filmagens' && themeStyles.activeTabButton
              ]}
              onPress={() => setActiveTab('filmagens')}
            >
              <Text style={[
                styles.tabButtonText,
                activeTab === 'filmagens' && styles.activeTabButtonText,
                themeStyles.tabButtonText , { fontSize }
              ]}>
                Histórico de Filmagens
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'acessos' ? (
            <FlatList
              data={acessos}
              renderItem={renderAcessoItem}
              keyExtractor={(item, index) => `${item.UID}-${index}`}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={[styles.emptyText, themeStyles.secondaryText , { fontSize }]}>
                  Nenhum acesso registrado
                </Text>
              }
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <FlatList
              data={filmagens}
              renderItem={renderFilmagemItem}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={[styles.emptyText, themeStyles.secondaryText , { fontSize }]}>
                  Nenhuma filmagem registrada
                </Text>
              }
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalOverlay, themeStyles.modalOverlay]}>
          <View style={[styles.modalContainer, themeStyles.card]}>
            {/* Ícone do Modal - NOME CORRIGIDO */}
            <Ionicons
              name="heart-circle"
              size={60}
              color="#0D293E"
              style={styles.modalIcon}
            />

            {/* Título do Modal */}
            <Text style={[styles.modalTitle, themeStyles.text , { fontSize }]}>
              Bem-vindo ao nosso app!
            </Text>

            {/* Mensagem do Modal */}
            <Text style={[styles.modalText, themeStyles.secondaryText , { fontSize }]}>
              Se lembre de cadastrar o cartao ou a tag para registrar os acessos e filmagens.
            </Text>

            {/* Botão de Fechar */}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Vamos começar!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Estilos base (neutros para ambos os temas)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    maxWidth: '90%',
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.8,
    maxWidth: '90%',
  },
  content: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#0D293E',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemLabel: {
    fontSize: 14,
    width: '30%',
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '500',
    width: '68%',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#0D293E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: '#0D293E',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

// Temas
const lightStyles = StyleSheet.create({
  activeTabButton: {
    backgroundColor: '#0D293E',
  },
  container: {
    backgroundColor: '#f8f9fa',
  },
  text: {
    color: '#2c3e50',
  },
  secondaryText: {
    color: '#7f8c8d',
  },
  card: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
  },
  itemContainer: {
    backgroundColor: '#ffffff',
  },
  tabsContainer: {
    backgroundColor: '#f0f0f0',
  },
  tabButtonText: {
    color: '#22FFF8',
  },
  errorText: {
    color: '#d32f2f',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});

const darkStyles = StyleSheet.create({
  activeTabButton: {
    backgroundColor: '#0D293E',
  },
  
  container: {
    backgroundColor: '#121212',
  },
  text: {
    color: '#ecf0f1',
  },
  secondaryText: {
    color: '#bdc3c7',
  },
  card: {
    backgroundColor: '#1e1e1e',
    shadowColor: '#0D293E',
  },
  itemContainer: {
    backgroundColor: '#2a2a2a',
  },
  tabsContainer: {
    backgroundColor: '#2a2a2a',
  },
  tabButtonText: {
    color: '#bdc3c7',
  },
  errorText: {
    color: '#ff6659',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
});

export default Home;