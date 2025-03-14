import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '../screens/Login';
import Cadastro from '../screens/Cadastro';
import EsqueciSenha from '../screens/EsqueciSenha';
import Introducao from '../screens/Introducao';
import Principal from '../screens/principal';
import AppTabs from './AppTabs';

// Defina o tipo de navegação
type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  EsqueciSenha: undefined;
  Home: undefined;
  Introducao: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="Introducao">
      <Stack.Screen name="Introducao" component={Introducao} options={{ headerShown: false }} />
      <Stack.Screen name="Principal" component={Principal} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="Cadastro" component={Cadastro} />
      <Stack.Screen name="EsqueciSenha" component={EsqueciSenha} />
      <Stack.Screen name="Home" component={AppTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default AuthStack;