import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, InputAdornment,
  IconButton, Alert, Divider, Chip, CircularProgress, Snackbar, Stack,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { Visibility, VisibilityOff, Psychology, Email, Lock, LocalHospital, Person } from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<'user' | 'psychologist'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password, role);
      setToast({
        open: true,
        message: '🎉 Sign in successful! Redirecting to dashboard...',
        severity: 'success',
      });
      setTimeout(() => {
        navigate(role === 'psychologist' ? '/psych/dashboard' : '/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
      setToast({
        open: true,
        message: err.response?.data?.detail || 'Sign in failed. Check credentials.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        background: 'radial-gradient(circle at 50% 0%, #1a1b36 0%, #0b0f19 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: 6,
        px: 2,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-15%',
          left: '20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,188,212,0.15) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(40px)',
          animation: 'pulse 8s infinite alternate ease-in-out',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-15%',
          right: '20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(40px)',
          animation: 'pulse 10s infinite alternate ease-in-out',
        },
        '@keyframes pulse': {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1.1)' },
        }
      }}
    >
      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast(t => ({ ...t, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{
            width: '100%',
            fontWeight: 600,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      <Box width="100%" maxWidth={460} zIndex={1}>
        {/* Header */}
        <Box textAlign="center" mb={3}>
          <Box
            sx={{
              width: 76,
              height: 76,
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #00BCD4 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 12px 32px rgba(0, 188, 212, 0.35)',
              transform: 'rotate(-3deg)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'rotate(0deg) scale(1.05)',
              }
            }}
          >
            <Psychology sx={{ color: '#fff', fontSize: 42 }} />
          </Box>
          <Typography variant="h4" fontWeight={800} color="#fff" letterSpacing="-0.5px" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.95rem' }}>
            Sign in to access your MindCare portal
          </Typography>
        </Box>

        {/* Main Card */}
        <Card
          elevation={0}
          sx={{
            background: 'rgba(17, 25, 40, 0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 5,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 3, background: 'rgba(211, 47, 47, 0.15)', color: '#ff8a80', border: '1px solid rgba(211, 47, 47, 0.3)' }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* Role Selection Toggle */}
              <Box mb={3}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 1, display: 'block' }}>
                  SIGN IN AS
                </Typography>
                <ToggleButtonGroup
                  value={role}
                  exclusive
                  onChange={(_e, v) => v && setRole(v)}
                  fullWidth
                  sx={{
                    background: 'rgba(255,255,255,0.05)',
                    p: 0.5,
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <ToggleButton
                    value="user"
                    id="login-role-user"
                    sx={{
                      flex: 1,
                      borderRadius: '10px !important',
                      border: 'none !important',
                      py: 1,
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #00BCD4, #00ACC1)',
                        color: '#fff',
                        boxShadow: '0 4px 15px rgba(0,188,212,0.4)',
                      },
                    }}
                  >
                    👤 Patient / User
                  </ToggleButton>
                  <ToggleButton
                    value="psychologist"
                    id="login-role-psychologist"
                    sx={{
                      flex: 1,
                      borderRadius: '10px !important',
                      border: 'none !important',
                      py: 1,
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                        color: '#fff',
                        boxShadow: '0 4px 15px rgba(124,58,237,0.4)',
                      },
                    }}
                  >
                    🩺 Psychologist
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Box mb={2.5}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 0.8, display: 'block' }}>
                  EMAIL ADDRESS
                </Typography>
                <TextField
                  id="login-email"
                  fullWidth
                  placeholder="name@mindcare.com"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#00BCD4' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                      '&:hover fieldset': { borderColor: '#00BCD4' },
                      '&.Mui-focused fieldset': { borderColor: '#00BCD4' },
                    },
                  }}
                />
              </Box>

              <Box mb={3}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 0.8, display: 'block' }}>
                  PASSWORD
                </Typography>
                <TextField
                  id="login-password"
                  fullWidth
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#7C3AED' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(s => !s)} edge="end" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                      '&:hover fieldset': { borderColor: '#7C3AED' },
                      '&.Mui-focused fieldset': { borderColor: '#7C3AED' },
                    },
                  }}
                />
              </Box>

              <Button
                id="login-submit"
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.6,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  boxShadow: '0 6px 20px rgba(0,188,212,0.35)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00ACC1, #6D28D9)',
                    boxShadow: '0 8px 25px rgba(0,188,212,0.5)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {loading ? <CircularProgress size={26} color="inherit" /> : 'Sign In'}
              </Button>
            </form>

            {/* Reference Sample Credentials Section */}
            <Box mt={3.5} pt={3} sx={{ borderTop: '1px dashed rgba(255,255,255,0.15)' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5, textAlign: 'center' }}>
                🔑 Sample Test Accounts
              </Typography>
              
              <Stack spacing={1.5}>
                {/* Psychologist Credential Box */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    background: 'rgba(124, 58, 237, 0.12)',
                    border: '1px solid rgba(124, 58, 237, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LocalHospital sx={{ color: '#a78bfa', fontSize: 20 }} />
                    </Box>
                    <Box textAlign="left">
                      <Typography variant="body2" fontWeight={700} color="#fff">
                        Psychologist
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
                        psychologist@mindcare.com • Psych@2024!
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="Demo Account" size="small" sx={{ background: 'rgba(124, 58, 237, 0.4)', color: '#fff', fontWeight: 600, height: 24, fontSize: '0.7rem' }} />
                </Box>

                {/* Patient Credential Box */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    background: 'rgba(0, 188, 212, 0.12)',
                    border: '1px solid rgba(0, 188, 212, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0, 188, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Person sx={{ color: '#26c6da', fontSize: 20 }} />
                    </Box>
                    <Box textAlign="left">
                      <Typography variant="body2" fontWeight={700} color="#fff">
                        Patient / User
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
                        user@mindcare.com • User@2024!
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="Demo Account" size="small" sx={{ background: 'rgba(0, 188, 212, 0.4)', color: '#fff', fontWeight: 600, height: 24, fontSize: '0.7rem' }} />
                </Box>
              </Stack>
            </Box>

            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.12)' }}>
              <Chip label="NEW TO MINDCARE?" size="small" sx={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: 600 }} />
            </Divider>

            <Typography textAlign="center" variant="body2" color="rgba(255,255,255,0.7)">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                style={{ color: '#00BCD4', textDecoration: 'none', fontWeight: 700 }}
              >
                Create Account
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Login;
