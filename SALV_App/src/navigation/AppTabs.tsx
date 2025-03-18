import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

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
                tabBarActiveTintColor: '#04C6AE',  
                tabBarInactiveTintColor: 'gray', 
                tabBarStyle: {
                    backgroundColor: '#EDE9F1',  
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
