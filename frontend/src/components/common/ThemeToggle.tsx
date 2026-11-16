import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useThemeMode } from '../../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <IconButton
        onClick={toggleTheme}
        sx={{
          color: 'text.primary',
          backgroundColor: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'primary.main',
            color: '#fff',
            transform: 'rotate(180deg)',
          },
        }}
      >
        {mode === 'dark' ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
