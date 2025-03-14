import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Importação das telas
import Home from '../screens/Home';
import AoVivo from '../screens/AoVivo';
import Gravações from '../screens/Gravacoes';
import Conta from '../screens/Conta';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarLabelStyle: {
                    fontSize: 14,  
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={Home}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="albums" color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="AoVivo"
                component={AoVivo}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="videocam" color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Gravações"
                component={Gravações}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="cloud-upload" color={color} size={size} />,
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
