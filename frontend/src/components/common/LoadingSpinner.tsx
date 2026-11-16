import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Psychology } from '@mui/icons-material';

interface Props {
  message?: string;
  size?: number;
}

const LoadingSpinner: React.FC<Props> = ({ message = 'Loading...', size = 48 }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
      gap={2}
    >
      <Box position="relative" display="inline-flex">
        <CircularProgress
          size={size}
          thickness={3}
          sx={{
            color: 'primary.main',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        <Box
          position="absolute"
          top="50%"
          left="50%"
          sx={{ transform: 'translate(-50%, -50%)' }}
        >
          <Psychology sx={{ fontSize: size * 0.45, color: 'primary.main', opacity: 0.7 }} />
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;
