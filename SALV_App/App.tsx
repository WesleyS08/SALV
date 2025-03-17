import 'react-native-gesture-handler';

import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './src/navigation/AuthStack';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';

export default function App() {
  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
  }, []);

  return (
    <NavigationContainer>
      <StatusBar hidden={true} />
      <AuthStack />
    </NavigationContainer>
  );
}