import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './src/navigation/AuthStack';
import Principal from './src/screens/principal';
export default function App() {
  return (
    <NavigationContainer>
      <Principal />
    </NavigationContainer>
  );
}