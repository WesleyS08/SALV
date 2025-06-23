import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch, Modal, TextInput, Dimensions, Alert } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useFontSize } from '../Global/FontSizeContext';
import { useDarkMode } from '../Global/DarkModeContext';
import { auth } from '../DB/firebase';
import * as ImagePicker from 'expo-image-picker';
import CustomToast from '../components/CustomToast';
import { dbFunctionInsertPhotoProfile } from '../DB/dbFunctionInsertPhotoProfile';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getAuth, signOut, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from '../DB/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


const { width } = Dimensions.get('window');

type ContaScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Conta'>;

interface ContaProps {
    navigation: ContaScreenNavigationProp;
}

const fontSizes = [10, 12, 14, 16, 18, 20, 22];

const Conta = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const { fontSize, setFontSize } = useFontSize();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const [tempPhotoURL, setTempPhotoURL] = useState<string | null>(null);


    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.uid) return;

            try {
                const { data, error } = await supabase
                    .from('Tb_Usuarios')
                    .select('*')
                    .eq('ID_Usuarios', user.uid)
                    .single();

                if (error) throw error;

                if (data) {
                    console.log("Dados do usuário:", data);
                    setUserData(data);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Erro ao buscar dados do usuário:', error);
                setToastMessage('Erro ao carregar perfil');
            }
        };

        fetchUserData();
    }, [user?.uid]);



    const verifyAuth = async (): Promise<User> => {
        const auth = getAuth();
        await auth.currentUser?.reload();
        if (!auth.currentUser?.uid) {
            await signOut(auth);
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
            throw new Error('Sessão expirada. Por favor, faça login novamente');
        }
        return auth.currentUser;
    };

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setIsAuthenticated(!!firebaseUser?.uid);
            setLoading(false);

            if (!firebaseUser) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }
        });
        return () => unsubscribe();
    }, [navigation]);


    // Funções auxiliares
    const openModal = (content: string) => {
        setModalContent(content);
        setModalVisible(true);
    };

    const getModalContent = (content: string | null) => {
        switch (content) {
            case 'Sobre nós':
                return 'Aqui está os membros que fizeram acontecer o SALV:\n\n' +
                    '• Davi de Brito Junior - Desenvolvedor FullStack\n' +
                    '• Maria Luiza Cruvinel dos Santos - Desenvolvedora FrontEnd\n' +
                    '• Wesley Silva dos Santos - Designer UI/UX\n';
            case 'Política de Privacidade':
              return `1. Dados Coletados
 • Biometria facial (processamento local)
• Registros de acesso RFID
• Metadados técnicos (IP, horários)

 2. Compartilhamento
 - Supabase: armazenamento de vídeos
- Firebase: notificações push
- APIs REST: integração de sistemas

3. Segurança
• Criptografia AES-256
• Autenticação em duas etapas
• Auditorias trimestrais
                    
4. Direitos
- Solicitar exclusão de dados
- Acessar histórico completo
 - Revogar permissões

 5. Atualizações
Notificações via e-mail 15 dias antes
Versão vigente: 2.0.0 (Maio/2024)`;
            case 'Termos e Condições':
                return `Ao usar o SALV, você concorda com estes Termos
• Versão atualizada em: 01/01/2024

2. Funcionalidades
- Monitoramento via sensores/câmeras
- Autenticação RFID/biometria
- Gravação automática de eventos

3. Responsabilidades
• Manter hardware funcional (ESP32, câmeras)
• Configurar corretamente MQTT/APIs
• Não usar para atividades ilegais

4. Limitações
- Não cobrimos falhas de hardware
- Isenção por uso indevido
- Sujeito a disponibilidade de serviços em nuvem

5. Contato
suporte.salv@dominio.com
+55 (11) 98888-8888 | São Paulo/SP`;
            default:
                return 'Conteúdo não encontrado.';
        }
    };

    const getClosestFontSize = (value: number) => {
        return fontSizes.reduce((prev, curr) =>
            Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        );
    };

    const signOutUser = async () => {
        try {
            await AsyncStorage.clear();

            await signOut(auth);

            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });

        } catch (error) {
            console.error("Erro no logout:", error);
            setToastMessage("Erro ao sair da conta");
        }
    };

    const handleSignOutPress = () => {
        signOutUser().catch(error => {
            console.error("Erro não tratado no logout:", error);
        });
    };


    const handleImageSelection = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                await handleImageResult(result);
            } else {
                setToastMessage('Nenhuma imagem foi selecionada.');
            }
        } catch (error) {
            console.error('Error selecting image:', error);
            setToastMessage('Erro ao selecionar a imagem da galeria.');
        }
    };
   const handleImageResult = async (result: ImagePicker.ImagePickerResult) => {
    try {
        if (result.canceled || !result.assets?.length) {
            throw new Error('Nenhuma imagem selecionada');
        }

        const imageBase64 = result.assets[0].base64;
        if (!imageBase64) {
            throw new Error('Dados da imagem ausentes');
        }

        const currentUser = await verifyAuth();

        if (!userData || !userData.Nome?.trim()) {
            throw new Error('Complete seu perfil antes de adicionar foto');
        }

        // URI local da imagem selecionada
        const tempImageUri = result.assets[0].uri;
        
        // Atualização imediata via contexto global (para todas as telas)
        setTempPhotoURL(tempImageUri); // Adiciona esta linha para atualizar o contexto
        
        // Atualização local do estado (mantida para compatibilidade)
        setUserData(prev => ({
            ...prev,
            photoURL: tempImageUri,
        }));

        // Faz o upload para o banco de dados
        await dbFunctionInsertPhotoProfile(currentUser.uid, imageBase64, userData.Nome.trim());

        // Após upload bem-sucedido:
        // 1. Limpa a pré-visualização temporária
        setTempPhotoURL(null);
        // 2. Atualiza com a URL permanente (se aplicável)
        // const publicUrl = await getPublicUrlFromStorage(currentUser.uid);
        // setUserData(prev => ({ ...prev, photoURL: publicUrl }));

        setToastMessage('Foto atualizada com sucesso! Para ser exibida em todas as seções, entre novamente');
      
    } catch (error) {
        // Reverte as alterações em caso de erro
        setTempPhotoURL(null); // Remove a pré-visualização
        setToastMessage(error instanceof Error ? error.message : 'Erro ao processar imagem');
    } finally {
        setModalVisible(false);
    }
};

    const handleChangePassword = async () => {
        try {
            const currentUser = await verifyAuth();

            if (!currentUser.email) {
                setPasswordError('Email do usuário não encontrado');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                setPasswordError('Senhas não coincidem');
                return;
            }

            if (newPassword.length < 6) {
                setPasswordError('Senha precisa ter 6+ caracteres');
                return;
            }

            setLoadingPassword(true);

            const userCredential = await signInWithEmailAndPassword(
                auth,
                currentUser.email,
                currentPassword
            );

            await updatePassword(userCredential.user, newPassword);

            setToastMessage('Senha alterada com sucesso!');
            setModalVisible(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setPasswordError('');

        } catch (error) {
            let errorMessage = 'Erro ao alterar senha';

            if (typeof error === 'object' && error !== null && 'code' in error) {
                const firebaseError = error as { code: string; message: string };

                switch (firebaseError.code) {
                    case 'auth/wrong-password':
                        errorMessage = 'Senha atual incorreta';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Muitas tentativas. Tente mais tarde';
                        break;
                    default:
                        errorMessage = firebaseError.message || errorMessage;
                }
            }

            setPasswordError(errorMessage);
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            "Confirmar Desativação",
            "Deseja realmente desativar sua conta? Essa ação não poderá ser desfeita.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Desativar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const auth = getAuth();
                            const currentUser = auth.currentUser;

                            if (!currentUser) {
                                Alert.alert("Erro", "Usuário não autenticado.");
                                return;
                            }

                            const UID = currentUser.uid;
                            const anonEmail = `anonimo+${UID}@seudominio.com`;
                            const dataAtual = new Date().toISOString();

                            // Atualiza dados no Supabase
                            const { data, error } = await supabase
                                .from('Tb_Usuarios')
                                .update({
                                    Nome: 'Conta deletada',
                                    Email: anonEmail,
                                    UID: null,
                                    Data_Desativacao: dataAtual, // novo campo recomendado
                                    photoURL: null
                                })
                                .eq('UID', UID);

                            if (error) {
                                console.error(error);
                                Alert.alert("Erro", "Não foi possível desativar a conta.");
                                return;
                            }

                            // Desloga do Firebase
                            await signOut(auth);
                            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });

                        } catch (err) {
                            console.error(err);
                            Alert.alert("Erro", "Algo deu errado.");
                        }
                    }
                }
            ]
        );
    };


    if (loading) {
        return (
            <View style={[styles.loadingContainer, isDarkMode && styles.loadingContainerDark]}>
                <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
                    Carregando...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, isDarkMode && styles.containerDark]}
            contentContainerStyle={styles.scrollContainer}
        >
            {toastMessage && (
                <CustomToast
                    message={toastMessage}
                    duration={5000}
                    onClose={() => setToastMessage(null)}
                />
            )}

            {/* Header com gradiente */}
            <LinearGradient
                colors={isDarkMode ? ['#0D293E', '#121212'] : ['#0D293E', '#f8f9fa']}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleImageSelection}>
                        <View style={styles.profileImageContainer}>
                            <Image
                                source={userData?.photoURL ? { uri: userData.photoURL } : require('../../assets/img/user.png')}
                                style={styles.profileImage}
                            />
                            <View style={styles.editIcon}>
                                <Ionicons name="camera" size={16} color="#FFF" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: '#FFF', fontSize: fontSize + 2 }]}>
                            {userData?.Nome || user?.displayName || 'Usuário'}
                        </Text>
                        <Text style={[styles.userEmail, { color: 'rgba(255,255,255,0.8)', fontSize: fontSize - 2 }]}>
                            {user?.email || 'email@exemplo.com'}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Seção de Configurações */}
            <View style={[styles.section, isDarkMode && styles.sectionDark]}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark, { fontSize: fontSize + 1 }]}>
                    Configurações
                </Text>

                <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="moon" size={20} color={isDarkMode ? "#27c0c2" : "#666"} />
                        <Text style={[styles.settingLabel, isDarkMode && styles.settingLabelDark, { fontSize }]}>
                            Modo Escuro
                        </Text>
                    </View>
                    <Switch
                        value={isDarkMode}
                        onValueChange={toggleDarkMode}
                        trackColor={{ false: '#ccc', true: '#27c0c2' }}
                        thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
                    />
                </View>

                <TouchableOpacity
                    style={styles.settingItem}
                    onPress={() => {
                        setModalContent('Alterar senha');
                        setModalVisible(true);
                    }}
                >
                    <View style={styles.settingInfo}>
                        <Ionicons name="lock-closed" size={20} color={isDarkMode ? "#27c0c2" : "#666"} />
                        <Text style={[styles.settingLabel, isDarkMode && styles.settingLabelDark, { fontSize }]}>
                            Alterar Senha
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#ccc" : "#666"} />
                </TouchableOpacity>

                <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="text" size={20} color={isDarkMode ? "#27c0c2" : "#666"} />
                        <Text style={[styles.settingLabel, isDarkMode && styles.settingLabelDark, { fontSize }]}>
                            Tamanho da Fonte
                        </Text>
                    </View>
                    <View style={styles.fontSizeControls}>
                        <TouchableOpacity
                            onPress={() => setFontSize(Math.min(12, fontSize - 2))}
                            style={[
                                styles.fontSizeButton,
                                {
                                    backgroundColor: isDarkMode ? '#424242' : '#E0E0E0'
                                }
                            ]}
                        >
                            <Text style={{
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: isDarkMode ? '#FFF' : '#333'
                            }}>A-</Text>
                        </TouchableOpacity>

                        <Text style={{
                            marginHorizontal: 10,
                            fontSize: 16,
                            color: isDarkMode ? '#FFF' : '#333'
                        }}>{fontSize}</Text>

                        <TouchableOpacity
                            onPress={() => setFontSize(Math.max(24, fontSize + 2))}
                            style={[
                                styles.fontSizeButton,
                                {
                                    backgroundColor: isDarkMode ? '#424242' : '#E0E0E0'
                                }
                            ]}
                        >
                            <Text style={{
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: isDarkMode ? '#FFF' : '#333'
                            }}>A+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Seção de Informações */}
            <View style={[styles.section, isDarkMode && styles.sectionDark]}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark, { fontSize: fontSize + 1 }]}>
                    Informações
                </Text>

                {['Sobre nós', 'Política de Privacidade', 'Termos e Condições'].map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={styles.settingItem}
                        onPress={() => openModal(item)}
                    >
                        <View style={styles.settingInfo}>
                            <Ionicons
                                name={
                                    item === 'Sobre nós' ? 'information-circle' :
                                        item === 'Política de Privacidade' ? 'shield-checkmark' :
                                            'document-text'
                                }
                                size={20}
                                color={isDarkMode ? "#27c0c2" : "#666"}
                            />
                            <Text style={[styles.settingLabel, isDarkMode && styles.settingLabelDark, { fontSize }]}>
                                {item}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#ccc" : "#666"} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Seção de Ações */}
            <View style={[styles.section, isDarkMode && styles.sectionDark]}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.logoutButton]}
                    onPress={handleSignOutPress}
                >
                    <Ionicons name="log-out" size={20} color="#FFF" />
                    <Text style={[styles.actionButtonText, { fontSize }]}>Sair da Conta</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleDeleteAccount}
                >
                    <Ionicons name="trash" size={20} color="#FFF" />
                    <Text style={[styles.actionButtonText, { fontSize }]}>Desativar Conta</Text>
                </TouchableOpacity>
            </View>

            {/* Modal para Alterar Senha */}
            <Modal
                visible={modalVisible && modalContent === 'Alterar senha'}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={[styles.modalOverlay, isDarkMode && styles.modalOverlayDark]}>
                    <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
                        <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark, { fontSize: fontSize + 2 }]}>
                            Alterar Senha
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark, { fontSize: fontSize - 1 }]}>
                                Senha Atual
                            </Text>
                            <TextInput
                                style={[styles.input, isDarkMode && styles.inputDark]}
                                placeholder="Digite sua senha atual"
                                placeholderTextColor={isDarkMode ? "#888" : "#999"}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark, { fontSize: fontSize - 1 }]}>
                                Nova Senha
                            </Text>
                            <TextInput
                                style={[styles.input, isDarkMode && styles.inputDark]}
                                placeholder="Digite a nova senha"
                                placeholderTextColor={isDarkMode ? "#888" : "#999"}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark, { fontSize: fontSize - 1 }]}>
                                Confirmar Nova Senha
                            </Text>
                            <TextInput
                                style={[styles.input, isDarkMode && styles.inputDark]}
                                placeholder="Confirme a nova senha"
                                placeholderTextColor={isDarkMode ? "#888" : "#999"}
                                value={confirmNewPassword}
                                onChangeText={setConfirmNewPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                        </View>

                        {passwordError && (
                            <Text style={[styles.errorText, { fontSize: fontSize - 1 }]}>
                                {passwordError}
                            </Text>
                        )}

                        <TouchableOpacity
                            style={styles.passwordVisibilityButton}
                            onPress={togglePasswordVisibility}
                        >
                            <Ionicons
                                name={showPassword ? "eye-off" : "eye"}
                                size={18}
                                color={isDarkMode ? "#27c0c2" : "#666"}
                            />
                            <Text style={[styles.passwordVisibilityText, isDarkMode && styles.passwordVisibilityTextDark, { fontSize: fontSize - 1 }]}>
                                {showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, loadingPassword && styles.modalButtonDisabled]}
                            onPress={handleChangePassword}
                            disabled={loadingPassword}
                        >
                            {loadingPassword ? (
                                <Text style={styles.modalButtonText}>Processando...</Text>
                            ) : (
                                <Text style={styles.modalButtonText}>Alterar Senha</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => {
                                setModalVisible(false);
                                setPasswordError('');
                                setCurrentPassword('');
                                setNewPassword('');
                                setConfirmNewPassword('');
                            }}
                        >
                            <Text style={[styles.modalCloseButtonText, isDarkMode && styles.modalCloseButtonTextDark]}>
                                Cancelar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={modalVisible && modalContent !== 'Alterar senha'}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={[styles.modalOverlay, isDarkMode && styles.modalOverlayDark]}>
                    <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
                        <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark, { fontSize: fontSize + 2 }]}>
                            {modalContent}
                        </Text>

                        <ScrollView
                            style={styles.modalScroll}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={true}
                        >
                            <Text style={[styles.modalText, isDarkMode && styles.modalTextDark, { fontSize }]}>
                                {getModalContent(modalContent)}
                            </Text>
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={[styles.modalCloseButtonText, isDarkMode && styles.modalCloseButtonTextDark]}>
                                Fechar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    containerDark: {
        backgroundColor: '#121212',
    },
    scrollContainer: {
        paddingBottom: 30,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingContainerDark: {
        backgroundColor: '#121212',
    },
    loadingText: {
        fontSize: 18,
        color: '#333',
    },
    loadingTextDark: {
        color: '#fff',
    },
    headerGradient: {
        paddingTop: 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImageContainer: {
        position: 'relative',
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#27c0c2',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
        marginLeft: 20,
    },
    userName: {
        fontWeight: '600',
        marginBottom: 5,
    },
    userEmail: {
        opacity: 0.8,
    },
    section: {
        marginTop: 20,
        marginHorizontal: 20,
        padding: 15,
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionDark: {
        backgroundColor: '#1e1e1e',
        shadowColor: '#000',
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#666',
    },
    sectionTitleDark: {
        color: '#ccc',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    settingItemDark: {
        borderBottomColor: '#333',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingLabel: {
        marginLeft: 10,
        color: '#333',
    },
    settingLabelDark: {
        color: '#fff',
    },
    fontSizeControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fontSizeButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#eee',
    },
    fontSizeButtonDark: {
        backgroundColor: '#333',
    },
    fontSizeButtonText: {
        fontSize: 16,
        color: '#333',
    },
    fontSizeButtonTextDark: {
        color: '#fff',
    },
    fontSizeValue: {
        marginHorizontal: 10,
        fontSize: 16,
        color: '#333',
    },
    fontSizeValueDark: {
        color: '#fff',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    logoutButton: {
        backgroundColor: '#ffa500',
    },
    deleteButton: {
        backgroundColor: '#ff6b6b',
    },
    actionButtonText: {
        color: '#fff',
        marginLeft: 10,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalOverlayDark: {
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    modalContent: {
        width: width - 30,
        maxHeight: '80%',
        padding: 20,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    modalContentDark: {
        backgroundColor: '#1e1e1e',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    modalTitleDark: {
        color: '#fff',
    },
    modalScroll: {
        maxHeight: '90%',
        marginBottom: 20,
    },
    modalText: {
        fontSize: 10,
        lineHeight: 24,
        color: '#333',
    },
    modalTextDark: {
        color: '#fff',
    },
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        marginBottom: 5,
        color: '#666',
    },
    inputLabelDark: {
        color: '#ccc',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    inputDark: {
        borderColor: '#333',
        backgroundColor: '#2a2a2a',
        color: '#fff',
    },
    errorText: {
        color: '#d9534f',
        marginBottom: 15,
        textAlign: 'center',
    },
    passwordVisibilityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    passwordVisibilityText: {
        marginLeft: 5,
        color: '#666',
    },
    passwordVisibilityTextDark: {
        color: '#ccc',
    },
    modalButton: {
        backgroundColor: '#27c0c2',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    modalButtonDisabled: {
        opacity: 0.7,
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    modalCloseButton: {
        padding: 10,
    },
    modalCloseButtonText: {
        color: '#666',
        textAlign: 'center',
        fontSize: 16,
    },
    modalCloseButtonTextDark: {
        color: '#ccc',
    },
});

export default Conta;

function setIsAuthenticated(arg0: boolean) {
    throw new Error('Function not implemented.');
}
