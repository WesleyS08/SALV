import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFontSize } from '../Global/FontSizeContext';
import { useDarkMode } from '../Global/DarkModeContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import * as ImagePicker from 'expo-image-picker';
import CustomToast from '../components/CustomToast';
import { logError } from '../components/logger';
import { dbFunctionInsertPhotoProfile } from '../DB/dbFunctionInsertPhotoProfile';
import {  onAuthStateChanged, User } from 'firebase/auth';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';


const fontSizes = [12, 14, 16, 18, 20, 22, 24];

const Conta = () => {
    const navigation = useNavigation();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const { fontSize, setFontSize } = useFontSize();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const defaultFontSize = 16;
    const defaultDarkMode = false;
    const [darkMode, setDarkMode] = useState(defaultDarkMode);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);


    // Funções auxiliares
    const openModal = (content: string) => {
        setModalContent(content);
        setModalVisible(true);
    };

    const getModalContent = (content: string | null) => {
        switch (content) {
            case 'Sobre nós':
                return 'Aqui está o conteúdo sobre a empresa, sua missão, visão e valores.';
            case 'Política de Privacidade':
                return 'Aqui está a nossa política de privacidade, explicando como tratamos seus dados.';
            case 'Termos e Condições':
                return 'Aqui estão os nossos termos e condições de uso, incluindo direitos e responsabilidades.';
            default:
                return 'Conteúdo não encontrado.';
        }
    };

    const getClosestFontSize = (value: number) => {
        return fontSizes.reduce((prev, curr) =>
            Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        );
    };

    // Lógica de logout
    const signOutUser = async () => {
        try {
            await signOut(auth);
            navigation.navigate('Login');
        } catch (error) {
            console.error("Erro ao sair: ", error);
        }
    };

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => setShowPassword(!showPassword);


    // Lógica de imagem
    const handleImageSelection = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
            base64: true,
        });
        handleImageResult(result);
    };

    const handleTakePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
            setToastMessage('Permissão necessária. Permita o acesso à câmera para tirar uma foto');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
            base64: true,
        });
        handleImageResult(result);
    };

    const handleImageResult = async (result: any) => {
        if (!result.canceled) {
            const imageBase64 = result.assets[0].base64;
            if (imageBase64 && user?.uid && userData?.nome) {
                await dbFunctionInsertPhotoProfile(user.uid, imageBase64, userData.nome);
                setToastMessage('Foto de perfil atualizada!');
            } else {
                logError('Erro ao processar a imagem.', Error);
                setToastMessage('Erro ao processar a imagem.');
            }
        } else {
            setToastMessage('Erro: a imagem selecionada não contém dados válidos.');
        }
        setModalVisible(false);
    };
    const [loadingPassword, setLoadingPassword] = useState(false);



    // Função para alterar a senha
    const handleChangePassword = async () => {
        if (!user) {
            setPasswordError('Erro: Usuário não autenticado.');
            return;
        }
    
        // Verifica se as senhas novas coincidem
        if (newPassword !== confirmNewPassword) {
            setPasswordError('As senhas não coincidem.');
            return;
        }
    
        // Verifica se a nova senha tem pelo menos 6 caracteres
        if (newPassword.length < 6) {
            setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
    
        setLoadingPassword(true); // Mostra o carregamento
    
        try {
            // Tenta fazer login com a senha atual
            const userCredential = await signInWithEmailAndPassword(auth, user.email, currentPassword);
    
            // Atualiza a senha do usuário
            if (userCredential.user) {
                await updatePassword(userCredential.user, newPassword);
            }
    
            // Mensagem de sucesso
            setToastMessage('Senha alterada com sucesso!');
            setModalVisible(false);
        } catch (error) {
            console.error("Erro ao alterar a senha:", error);
            setPasswordError('Erro ao alterar a senha. Verifique a senha atual.');
        }
    
        setLoadingPassword(false); // Remove o carregamento
    };
    
    


if (loading) {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Carregando...</Text>
        </View>
    );
}

return (
    <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        {toastMessage && (
            <CustomToast
                message={toastMessage}
                duration={5000}
                onClose={() => setToastMessage(null)}
            />
        )}

        <View style={styles.header}>
            <TouchableOpacity onPress={handleImageSelection}>
                <Image
                    source={user?.photoURL ? { uri: user.photoURL } : require('../../assets/img/user.png')}
                    style={styles.profileImage}
                />
            </TouchableOpacity>

            <Text style={[styles.userName, isDarkMode && styles.userNameDark, { fontSize }]}>{user?.displayName || 'Nome do usuário'}</Text>
        </View>


        <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark, { fontSize }]}>Configurações de Conta</Text>
            <TouchableOpacity style={styles.option}>
                <Text style={[styles.optionText, isDarkMode && styles.optionTextDark, { fontSize }]}>Editar dados</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => {
                setModalContent('Alterar senha');
                setModalVisible(true);
            }}>
                <Text style={[styles.optionText, isDarkMode && styles.optionTextDark, { fontSize }]}>Alterar a senha</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem]}>
                <Text style={[styles.label, isDarkMode && styles.labelDark, { fontSize }]}>Modo Escuro</Text>
                <Switch
                    value={isDarkMode}
                    onValueChange={toggleDarkMode}
                    trackColor={{ false: '#ccc', true: '#27c0c2' }}
                    thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
                />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.option}
                onPress={() => setFontSize(getClosestFontSize(fontSize + 2))}
            >
                <Text style={[styles.optionText, { fontSize }, isDarkMode && styles.optionTextDark, { fontSize }]}>Aumentar fonte</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.option}
                onPress={() => setFontSize(getClosestFontSize(fontSize - 2))}
            >
                <Text style={[styles.optionText, { fontSize }, isDarkMode && styles.optionTextDark, { fontSize }]}>Diminuir fonte</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark, { fontSize }]}>Mais Opções</Text>
            <TouchableOpacity style={styles.option} onPress={() => openModal('Sobre nós')}>
                <Text style={[styles.optionText, isDarkMode && styles.optionTextDark, { fontSize }]}>Sobre nós</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => openModal('Política de Privacidade')}>
                <Text style={[styles.optionText, isDarkMode && styles.optionTextDark, { fontSize }]}>Política de Privacidade</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => openModal('Termos e Condições')}>
                <Text style={[styles.optionText, isDarkMode && styles.optionTextDark, { fontSize }]}>Termos e Condições</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.footer}>
            <TouchableOpacity onPress={signOutUser} style={styles.logoutButton}>
                <Text style={[styles.logoutText, isDarkMode && styles.logoutTextDark, { fontSize }]}>Sair da Conta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton}>
                <Text style={[styles.deleteText, isDarkMode && styles.deleteTextDark, { fontSize }]}>Deletar Conta</Text>
            </TouchableOpacity>
        </View>

        {/* Modal */}
        <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
                <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
                    <Text style={[styles.modalText, { fontSize }, isDarkMode && styles.modalTextDark]}>
                        {getModalContent(modalContent)}
                    </Text>
                    <TouchableOpacity
                        style={styles.closeModalButton}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={[styles.closeModalText, isDarkMode && styles.closeModalTextDark]}>Fechar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {modalContent === 'Alterar senha' ? (
                        <View style={styles.modalBody}>
                            <TextInput
                                style={styles.input}
                                placeholder="Senha Atual"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry={!showPassword} // Alterna entre mostrar e ocultar a senha
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Nova Senha"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirmar Nova Senha"
                                value={confirmNewPassword}
                                onChangeText={setConfirmNewPassword}
                                secureTextEntry={!showPassword}
                            />
                            {passwordError && <Text style={styles.passwordError}>{passwordError}</Text>}
                            <TouchableOpacity onPress={handleChangePassword} style={styles.modalButton}>
                                <Text style={styles.modalButtonText}>Alterar Senha</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.showPasswordButton}>
                                <Text style={styles.showPasswordText}>
                                    {showPassword ? 'Ocultar Senhas' : 'Mostrar Senhas'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text>{modalContent}</Text>
                    )}

                    <TouchableOpacity
                        onPress={() => setModalVisible(false)}
                        style={styles.closeButton}
                    >
                        <Text style={styles.closeButtonText}>Fechar</Text>
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
        backgroundColor: '#fff',
    },
    containerDark: {
        backgroundColor: '#1f1f1f',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginLeft: '5%',
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginTop: 10,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        marginLeft: '4%',
    },
    userNameDark: {
        color: '#fff',
    },
    section: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#888',
        marginBottom: 10,
    },
    sectionTitleDark: {
        color: '#ccc',
    },
    option: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    optionText: {
        fontSize: 16,
    },
    optionTextDark: {
        color: '#fff',
    },
    footer: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    logoutButton: {
        paddingVertical: 15,
    },
    logoutText: {
        fontSize: 16,
        color: '#d9534f',
    },
    logoutTextDark: {
        color: '#f8d7da',
    },
    deleteButton: {
        paddingVertical: 15,
    },
    deleteText: {
        fontSize: 16,
        color: '#ff0000',
        fontWeight: 'bold',
    },
    deleteTextDark: {
        color: '#ff4d4d',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    label: {
        fontSize: 16,
    },
    labelDark: {
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalOverlayDark: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalContentDark: {
        backgroundColor: '#333',
    },
    modalText: {
        fontSize: 18,
        color: '#000',
        marginBottom: 20,
    },
    modalTextDark: {
        color: '#fff',
    },
    closeButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#27c0c2',
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    closeButtonTextDark: {
        color: '#fff',
    },
    modalBody: {
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 10,
        paddingLeft: 10,
        backgroundColor: '#f9f9f9',
    },
    passwordError: {
        color: 'red',
        marginBottom: 10,
    },
    modalButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    showPasswordButton: {
        marginTop: 10,
        alignItems: 'center',
    },
    showPasswordText: {
        color: '#007BFF',
    },
});

export default Conta;
function setUserData(updatedUserData: any) {
    throw new Error('Function not implemented.');
}

