import { createTheme, ThemeOptions } from '@mui/material/styles';

const baseOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 24,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#00BCD4',
    },
    secondary: {
      main: '#7C3AED',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    error: { main: '#EF4444' },
    warning: { main: '#F97316' },
    info: { main: '#EAB308' },
    success: { main: '#22C55E' },
  },
});

export const darkTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#00BCD4',
    },
    secondary: {
      main: '#7C3AED',
    },
    background: {
      default: '#0A1628',
      paper: '#112240',
    },
    error: { main: '#EF4444' },
    warning: { main: '#F97316' },
    info: { main: '#EAB308' },
    success: { main: '#22C55E' },
  },
});
