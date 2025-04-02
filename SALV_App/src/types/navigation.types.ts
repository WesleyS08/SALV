import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
    Login: undefined;
    Home: { user: { id: string; email: string } };
    Cadastro: undefined;
    EsqueciSenha: undefined;
    Conta: undefined;
};

export type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
export type ContaScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Conta'>;