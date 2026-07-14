import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider, CssBaseline, PaletteMode } from '@mui/material';
import { getM3Theme } from './theme';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  preference: ThemePreference;
  mode: PaletteMode;
  setPreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem('pocketcloud_theme_pref');
    return (saved as ThemePreference) || 'system';
  });

  const [systemMode, setSystemMode] = useState<PaletteMode>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemMode(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    localStorage.setItem('pocketcloud_theme_pref', pref);
  };

  const mode: PaletteMode = useMemo(() => {
    if (preference === 'system') return systemMode;
    return preference;
  }, [preference, systemMode]);

  const toggleTheme = () => {
    if (mode === 'dark') {
      setPreference('light');
    } else {
      setPreference('dark');
    }
  };

  const theme = useMemo(() => getM3Theme(mode), [mode]);

  return (
    <ThemeContext.Provider value={{ preference, mode, setPreference, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProviderWrapper');
  }
  return context;
};
