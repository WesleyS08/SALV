import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Login from '../screens/LoginEmail';
import Cadastro from '../screens/Cadastro';
import EsqueciSenha from '../screens/EsqueciSenha';
import BoasVindas from '../screens/BoasVindas';
import Autenticacao from '../screens/Autenticacao';
import AppTabs from './AppTabs';
import { View, ActivityIndicator } from 'react-native';

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
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('@hasLaunched');
        if (hasLaunched === null) {
          await AsyncStorage.setItem('@hasLaunched', 'true');
          setInitialRoute('BoasVindas');
        } else {
          setInitialRoute('Autenticacao');
        }
      } catch (error) {
        console.error('Erro ao verificar primeira execução:', error);
        setInitialRoute('BoasVindas'); 
      }
    };

    checkFirstLaunch();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="BoasVindas" component={BoasVindas} options={{ headerShown: false }} />
      <Stack.Screen name="Autenticacao" component={Autenticacao} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="Cadastro" component={Cadastro} />
      <Stack.Screen name="EsqueciSenha" component={EsqueciSenha} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={AppTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default AuthStack;
