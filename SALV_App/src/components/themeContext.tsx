import React, { createContext, useState, useContext,ReactNode } from 'react';
import { Appearance } from 'react-native';

// Definindo o tipo do contexto
interface ThemeContextType {
    darkMode: boolean;
    setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
    fontSize: number;
    setFontSize: React.Dispatch<React.SetStateAction<number>>;
    colorBlindMode: boolean;
    setColorBlindMode: React.Dispatch<React.SetStateAction<boolean>>;
}

// Valor padrão do contexto
const defaultTheme: ThemeContextType = {
    darkMode: Appearance.getColorScheme() === 'dark',
    setDarkMode: () => {}, 
    fontSize: 16,
    setFontSize: () => {},
    colorBlindMode: false,
    setColorBlindMode: () => {}
};

const ThemeContext = createContext<ThemeContextType>(defaultTheme);



export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [darkMode, setDarkMode] = useState(Appearance.getColorScheme() === 'dark');
    const [fontSize, setFontSize] = useState(16); // Tamanho padrão da fonte
    const [colorBlindMode, setColorBlindMode] = useState(false);

    return (
        <ThemeContext.Provider value={{ darkMode, setDarkMode, fontSize, setFontSize, colorBlindMode, setColorBlindMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Hook personalizado para usar o contexto
export const useTheme = () => useContext(ThemeContext);
