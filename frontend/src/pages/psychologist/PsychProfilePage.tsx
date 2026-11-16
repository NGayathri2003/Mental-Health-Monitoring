import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  Avatar, Alert, CircularProgress, InputAdornment
} from '@mui/material';
import { Person, Email, Phone, Save, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

const PsychProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ 
    name: user?.name || '', 
    phone: user?.phone || '',
    specialization: (user as any)?.specialization || ''
  });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'PS';

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await client.put('/psychologist/me', form);
      updateUser(res.data);
      setSuccess('Profile updated');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to update');
    } finally { setLoading(false); }
  };

  const handlePasswordChange = async () => {
    if (pwForm.new_password !== pwForm.confirm) { setError('Passwords do not match'); return; }
    setPwLoading(true);
    setError('');
    try {
      await client.put('/psychologist/me/password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      setSuccess('Password changed');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed');
    } finally { setPwLoading(false); }
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={800}>My Profile</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>Manage your psychologist account</Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 3 }}>
            <CardContent>
              <Avatar sx={{ width: 100, height: 100, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', fontSize: '2rem', fontWeight: 800, margin: '0 auto 16px', border: '3px solid rgba(124,58,237,0.4)', boxShadow: '0 8px 32px rgba(124,58,237,0.25)' }}>
                {getInitials(user?.name || '')}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              <Box sx={{ mt: 2, px: 3, py: 1, background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.15))', borderRadius: 2, border: '1px solid rgba(124,58,237,0.2)', display: 'inline-block' }}>
                <Typography variant="caption" fontWeight={700} color="secondary.main">Licensed Psychologist</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1}>
                <Person sx={{ color: 'secondary.main' }} /> Account Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField id="psych-name" fullWidth label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: 'text.secondary' }} /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Email" value={user?.email || ''} disabled InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField id="psych-phone" fullWidth label="Phone Number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: 'text.secondary' }} /></InputAdornment> }} />
                </Grid>
              </Grid>
              <Button id="save-psych-profile" variant="contained" color="secondary" startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />} onClick={handleSave} disabled={loading} sx={{ mt: 3, borderRadius: 3, fontWeight: 700 }}>
                Save Changes
              </Button>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1}>
                <Lock sx={{ color: 'primary.main' }} /> Change Password
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField id="psych-curr-pw" fullWidth label="Current Password" type={showPw ? 'text' : 'password'} value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} InputProps={{ endAdornment: <InputAdornment position="end"><Button size="small" onClick={() => setShowPw(s => !s)}>{showPw ? <VisibilityOff /> : <Visibility />}</Button></InputAdornment> }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField id="psych-new-pw" fullWidth label="New Password" type={showPw ? 'text' : 'password'} value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} />
                </Grid>
                <Grid item xs={6}>
                  <TextField id="psych-confirm-pw" fullWidth label="Confirm Password" type={showPw ? 'text' : 'password'} value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} error={!!pwForm.confirm && pwForm.confirm !== pwForm.new_password} />
                </Grid>
              </Grid>
              <Button id="change-psych-pw" variant="contained" startIcon={pwLoading ? <CircularProgress size={18} color="inherit" /> : <Lock />} onClick={handlePasswordChange} disabled={pwLoading || !pwForm.current_password || !pwForm.new_password} sx={{ mt: 3, borderRadius: 3, fontWeight: 700, background: 'linear-gradient(135deg, #00BCD4, #7C3AED)', '&:hover': { background: 'linear-gradient(135deg, #00ACC1, #6D28D9)' } }}>
                Change Password
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PsychProfilePage;
