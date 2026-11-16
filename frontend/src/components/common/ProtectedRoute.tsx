import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface Props {
  children: React.ReactNode;
  role?: 'user' | 'psychologist';
}

const ProtectedRoute: React.FC<Props> = ({ children, role }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'psychologist' ? '/psych/dashboard' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
