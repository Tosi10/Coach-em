import { useColorScheme as useSystemColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Borders
  border: string;
  borderSecondary: string;
  
  // Cards
  card: string;
  cardBorder: string;
  
  // Primary (Orange)
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Status colors
  success: string;
  error: string;
  warning: string;
  info: string;
}

interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#0a0a0a', // Almost black
    backgroundSecondary: '#171717', // Dark gray
    backgroundTertiary: '#262626', // Darker gray
    
    text: '#ffffff',
    textSecondary: '#a3a3a3',
    textTertiary: '#737373',
    
    border: '#262626',
    borderSecondary: '#404040',
    
    card: '#171717',
    cardBorder: '#262626',
    
    primary: '#fb923c', // Orange accent
    primaryLight: '#fdba74',
    primaryDark: '#f97316',
    
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
};

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#ffffff', // White
    backgroundSecondary: '#f5f5f5', // Light gray
    backgroundTertiary: '#e5e5e5', // Lighter gray
    
    text: '#0a0a0a', // Almost black
    textSecondary: '#525252', // Dark gray
    textTertiary: '#737373', // Medium gray
    
    border: '#e5e5e5',
    borderSecondary: '#d4d4d4',
    
    card: '#ffffff',
    cardBorder: '#e5e5e5',
    
    primary: '#fb923c', // Orange accent (mesmo)
    primaryLight: '#fdba74',
    primaryDark: '#f97316',
    
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@coachem_theme_preference';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [isLoading, setIsLoading] = useState(true);

  // Carregar preferência salva ou usar sistema
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeMode(savedTheme);
        } else {
          // Se não há preferência salva, usar sistema
          setThemeMode(systemColorScheme === 'dark' ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error);
        setThemeMode('dark'); // Fallback para dark
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
    
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  const setTheme = async (mode: ThemeMode) => {
    setThemeMode(mode);
    
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  // Não renderizar até carregar o tema
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
