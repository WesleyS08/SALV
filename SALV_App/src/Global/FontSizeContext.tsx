import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FontSizeContextType {
    fontSize: number;
    setFontSize: (size: number) => void;
}

const defaultFontSize = 16; 

const FontSizeContext = createContext<FontSizeContextType>({
    fontSize: defaultFontSize,
    setFontSize: () => {},
});

export const FontSizeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [fontSize, setFontSizeState] = useState<number>(defaultFontSize);

    useEffect(() => {
        const loadFontSize = async () => {
            const savedFontSize = await AsyncStorage.getItem('fontSize');
            if (savedFontSize) {
                setFontSizeState(Number(savedFontSize)); 
            }
        };
        loadFontSize();
    }, []);

    const setFontSize = async (size: number) => {
        setFontSizeState(size);
        await AsyncStorage.setItem('fontSize', String(size));
    };

    return (
        <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
            {children}
        </FontSizeContext.Provider>
    );
};

export const useFontSize = () => React.useContext(FontSizeContext);