import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipagem para o contexto
interface DarkModeContextType {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

// Criação do contexto com valor padrão
const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

// Provider do contexto
export const DarkModeProvider = ({ children }: { children: ReactNode }) => {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

    // Carrega o estado do modo escuro ao inicializar
    useEffect(() => {
        const loadDarkMode = async () => {
            try {
                const savedMode = await AsyncStorage.getItem('darkMode');
                if (savedMode !== null) {
                    setIsDarkMode(JSON.parse(savedMode)); 
                }
            } catch (error) {
                console.error('Erro ao carregar o estado do modo escuro:', error);
            }
        };

        loadDarkMode();
    }, []);

    // Alterna e salva o estado do modo escuro
    const toggleDarkMode = async () => {
        try {
            setIsDarkMode((prev) => {
                const newMode = !prev;
                AsyncStorage.setItem('darkMode', JSON.stringify(newMode)); 
                return newMode;
            });
        } catch (error) {
            console.error('Erro ao salvar o estado do modo escuro:', error);
        }
    };

    return (
        <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    );
};

// Hook para consumir o contexto
export const useDarkMode = () => {
    const context = useContext(DarkModeContext);
    if (!context) {
        throw new Error('useDarkMode deve ser usado dentro de um DarkModeProvider');
    }
    return context;
};