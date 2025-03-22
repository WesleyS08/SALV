import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useDarkMode } from '../Global/DarkModeContext';
import Home from '../screens/Home';
import AoVivo from '../screens/AoVivo';
import Gravações from '../screens/Gravacoes';
import Conta from '../screens/Conta';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
    const { isDarkMode, toggleDarkMode } = useDarkMode();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarLabelStyle: {
                    fontSize: 14,
                },
                tabBarActiveTintColor: isDarkMode ? '#04C6AE' : '#00796B',  
                tabBarInactiveTintColor: isDarkMode ? 'gray' : '#757575',  
                tabBarStyle: {
                    backgroundColor: isDarkMode ? '#333333' : '#EDE9F1',  
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={Home}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="AoVivo"
                component={AoVivo}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="images" color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Gravações"
                component={Gravações}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="cloud-download" color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Conta"
                component={Conta}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}
