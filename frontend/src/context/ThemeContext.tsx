import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../theme/muiTheme';

interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  toggleTheme: () => {},
});

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  const toggleTheme = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeContext);
