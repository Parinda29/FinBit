import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

type AppTheme = {
  mode: ThemeMode;
  setMode: (next: ThemeMode) => void;
  toggleMode: () => void;
  colors: {
    background: string;
    card: string;
    text: string;
    subtext: string;
    border: string;
    primary: string;
  };
};

const STORAGE_KEY = 'finbit_theme_mode';

const ThemeContext = createContext<AppTheme | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') {
          setModeState(saved);
        }
      } catch {
        // Keep default if storage read fails.
      }
    };
    load();
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const toggleMode = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
  };

  const colors = useMemo(
    () =>
      mode === 'dark'
        ? {
            background: '#0B1220',
            card: '#111827',
            text: '#E5E7EB',
            subtext: '#9CA3AF',
            border: '#1F2937',
            primary: '#A78BFA',
          }
        : {
            background: '#F8FAFC',
            card: '#FFFFFF',
            text: '#0F172A',
            subtext: '#475569',
            border: '#E5E7EB',
            primary: '#7C3AED',
          },
    [mode]
  );

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }
  return context;
}
