import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, InputAdornment,
  IconButton, Alert, ToggleButton, ToggleButtonGroup, CircularProgress, Grid, Snackbar, MenuItem
} from '@mui/material';
import { Visibility, VisibilityOff, Psychology, Person, Email, Lock, Badge, Phone, CalendarToday, School } from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<'user' | 'psychologist'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    gender: '',
    dob: '',
    phone: '',
    license_no: '',
    specialization: ''
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailValue = form.email.trim();
    const nameValue = form.name.trim();
    const passwordValue = form.password;
    const phoneValue = form.phone.trim();

    if (!nameValue || !emailValue || !passwordValue) {
      setError('Please enter your name, email, and password.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailValue)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (passwordValue.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (role === 'psychologist') {
      if (!form.license_no.trim() || !form.specialization.trim()) {
        setError('Please provide your license number and specialization to register as a psychologist.');
        return;
      }
    }

    setLoading(true);
    try {
      const data: Record<string, string> = {
        name: nameValue,
        email: emailValue,
        password: passwordValue,
        phone: phoneValue,
      };

      if (role === 'user') {
        data.gender = form.gender || '';
        data.dob = form.dob || '';
      } else {
        data.license_no = form.license_no.trim();
        data.specialization = form.specialization.trim();
      }

      await register(role, data);
      
      setToast({
        open: true,
        message: '✨ Registration successful! Welcome to MindCare.',
        severity: 'success',
      });

      setTimeout(() => {
        navigate(role === 'psychologist' ? '/psych/dashboard' : '/dashboard');
      }, 1000);
    } catch (err: any) {
      console.error('Registration error:', err);
      const responseData = err.response?.data;
      const statusCode = err.response?.status;
      let errorMsg = 'Registration failed. Please check your inputs.';

      if (responseData?.detail) {
        if (typeof responseData.detail === 'string') {
          errorMsg = responseData.detail;
        } else if (Array.isArray(responseData.detail)) {
          errorMsg = responseData.detail.map((d: any) => d.msg || 'Invalid field').join(', ');
        } else {
          errorMsg = JSON.stringify(responseData.detail);
        }
      } else if (responseData?.message) {
        errorMsg = responseData.message;
      } else if (err.message) {
        errorMsg = err.message;
      }

      if (statusCode) {
        errorMsg = `${errorMsg} (${statusCode})`;
      }

      setError(errorMsg);
      setToast({
        open: true,
        message: errorMsg,
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
        py: 6,
        px: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,188,212,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        },
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

      <Box width="100%" maxWidth={540} zIndex={1}>
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
              transform: 'rotate(3deg)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'rotate(0deg) scale(1.05)',
              }
            }}
          >
            <Psychology sx={{ color: '#fff', fontSize: 42 }} />
          </Box>
          <Typography variant="h4" fontWeight={800} color="#fff" letterSpacing="-0.5px" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
            Join MindCare — AI-powered mental health ecosystem
          </Typography>
        </Box>

        {/* Card */}
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
            {/* Role Selection */}
            <Box mb={3.5}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 1, display: 'block' }}>
                REGISTER AS
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
                  id="role-user"
                  sx={{
                    flex: 1,
                    borderRadius: '10px !important',
                    border: 'none !important',
                    py: 1.2,
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
                  id="role-psychologist"
                  sx={{
                    flex: 1,
                    borderRadius: '10px !important',
                    border: 'none !important',
                    py: 1.2,
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

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 3, background: 'rgba(211, 47, 47, 0.15)', color: '#ff8a80', border: '1px solid rgba(211, 47, 47, 0.3)' }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 0.5, display: 'block' }}>
                    FULL NAME *
                  </Typography>
                  <TextField
                    id="reg-name"
                    fullWidth
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange('name')}
                    required
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
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Person sx={{ color: '#00BCD4' }} /></InputAdornment>
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 0.5, display: 'block' }}>
                    EMAIL ADDRESS *
                  </Typography>
                  <TextField
                    id="reg-email"
                    fullWidth
                    placeholder="email@example.com"
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    required
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
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Email sx={{ color: '#00BCD4' }} /></InputAdornment>
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 0.5, display: 'block' }}>
                    PASSWORD *
                  </Typography>
                  <TextField
                    id="reg-password"
                    fullWidth
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange('password')}
                    required
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
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#7C3AED' }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(s => !s)} edge="end" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 0.5, display: 'block' }}>
                    PHONE NUMBER
                  </Typography>
                  <TextField
                    id="reg-phone"
                    fullWidth
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={handleChange('phone')}
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
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Phone sx={{ color: '#00BCD4' }} /></InputAdornment>
                    }}
                  />
                </Grid>

                {role === 'user' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 0.5, display: 'block' }}>
                        DATE OF BIRTH
                      </Typography>
                      <TextField
                        id="reg-dob"
                        fullWidth
                        type="date"
                        value={form.dob}
                        onChange={handleChange('dob')}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#fff',
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                            '&:hover fieldset': { borderColor: '#00BCD4' },
                            '&.Mui-focused fieldset': { borderColor: '#00BCD4' },
                          },
                          '& input[type="date"]::-webkit-calendar-picker-indicator': {
                            filter: 'invert(1)',
                          }
                        }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><CalendarToday sx={{ color: '#00BCD4', fontSize: 20 }} /></InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 0.5, display: 'block' }}>
                        GENDER
                      </Typography>
                      <TextField
                        id="reg-gender"
                        select
                        fullWidth
                        value={form.gender}
                        onChange={handleChange('gender')}
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
                      >
                        <MenuItem value="">Select Gender</MenuItem>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                        <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                      </TextField>
                    </Grid>
                  </>
                )}

                {role === 'psychologist' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 0.5, display: 'block' }}>
                        LICENSE NUMBER
                      </Typography>
                      <TextField
                        id="reg-license"
                        fullWidth
                        placeholder="e.g. PSY-2024-001"
                        value={form.license_no}
                        onChange={handleChange('license_no')}
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
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Badge sx={{ color: '#7C3AED' }} /></InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 0.5, display: 'block' }}>
                        SPECIALIZATION
                      </Typography>
                      <TextField
                        id="reg-specialization"
                        fullWidth
                        placeholder="e.g. Clinical Psychology"
                        value={form.specialization}
                        onChange={handleChange('specialization')}
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
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><School sx={{ color: '#7C3AED' }} /></InputAdornment>
                        }}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12} mt={1}>
                  <Button
                    id="reg-submit"
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
                    {loading ? <CircularProgress size={26} color="inherit" /> : 'Complete Registration'}
                  </Button>
                </Grid>
              </Grid>
            </form>

            <Typography textAlign="center" variant="body2" color="rgba(255,255,255,0.7)" mt={3.5}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#00BCD4', textDecoration: 'none', fontWeight: 700 }}>
                Sign In
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Register;
