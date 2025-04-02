import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext'; // Importe o hook useAuth

// Importe suas telas
import Login from '../screens/LoginEmail';
import Cadastro from '../screens/Cadastro';
import EsqueciSenha from '../screens/EsqueciSenha';
import BoasVindas from '../screens/BoasVindas';
import Autenticacao from '../screens/Autenticacao';
import AppTabs from './AppTabs';

type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  EsqueciSenha: undefined;
  Home: undefined;
  BoasVindas: undefined;
  Autenticacao: undefined;
  LoginBiometria: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AuthStack: React.FC = () => {
  const { user, loading: authLoading } = useAuth(); // Obtenha o usuário e estado de loading
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const [checkingFirstLaunch, setCheckingFirstLaunch] = useState(true);

  useEffect(() => {
    const checkRoutes = async () => {
      try {
        if (user) {
          setInitialRoute('Home');
          return;
        }

        // Verifica se é o primeiro lançamento
        const hasLaunched = await AsyncStorage.getItem('@hasLaunched');
        if (hasLaunched === null) {
          await AsyncStorage.setItem('@hasLaunched', 'true');
          setInitialRoute('BoasVindas');
        } else {
          setInitialRoute('Autenticacao');
        }
      } catch (error) {
        console.error('Erro ao verificar rotas:', error);
        setInitialRoute('Autenticacao'); 
      } finally {
        setCheckingFirstLaunch(false);
      }
    };

    checkRoutes();
  }, [user]); 

  if (authLoading || checkingFirstLaunch || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      {initialRoute === 'BoasVindas' && (
        <Stack.Screen name="BoasVindas" component={BoasVindas} options={{ headerShown: false }} />
      )}
      
      <Stack.Screen name="Autenticacao" component={Autenticacao} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="Cadastro" component={Cadastro} options={{ headerShown: false }} />
      <Stack.Screen name="EsqueciSenha" component={EsqueciSenha} options={{ headerShown: false }} />
      
      <Stack.Screen 
        name="Home" 
        component={AppTabs} 
        options={{ headerShown: false }}
        listeners={({ navigation }) => ({
          focus: () => {
            if (!user) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Autenticacao' }],
              });
            }
          },
        })}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;