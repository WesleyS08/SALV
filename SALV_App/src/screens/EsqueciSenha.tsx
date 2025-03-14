// src/screens/EsqueciSenha.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  EsqueciSenha: undefined;
};

type EsqueciSenhaScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EsqueciSenha'>;

interface Props {
  navigation: EsqueciSenhaScreenNavigationProp;
}

const EsqueciSenha: React.FC<Props> = ({ navigation }) => {
  return (
    <View>
      <Text>Esqueci a Senha</Text>
      <Button title="Voltar para Login" onPress={() => navigation.navigate('Login')} />
    </View>
  );
};

export default EsqueciSenha;
