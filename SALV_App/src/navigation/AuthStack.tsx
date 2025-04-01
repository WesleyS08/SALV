import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '../screens/LoginEmail';
import Cadastro from '../screens/Cadastro';
import EsqueciSenha from '../screens/EsqueciSenha';
import BoasVindas from '../screens/BoasVindas';
import Autenticacao from '../screens/Autenticacao';
import AppTabs from './AppTabs';

// Defina o tipo de navegação
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
  return (
    <Stack.Navigator initialRouteName="BoasVindas">
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