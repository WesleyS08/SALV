import 'react-native-gesture-handler';

import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './src/navigation/AuthStack';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { DarkModeProvider } from './src/Global/DarkModeContext';
import { FontSizeProvider } from './src/Global/FontSizeContext';
import { AuthProvider } from './src/contexts/AuthContext';

export default function App() {
  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
  }, []);

  return (
    <DarkModeProvider>
      <FontSizeProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar hidden={true} />
            <AuthStack />
          </NavigationContainer>
        </AuthProvider>
      </FontSizeProvider>
    </DarkModeProvider>
  );
}