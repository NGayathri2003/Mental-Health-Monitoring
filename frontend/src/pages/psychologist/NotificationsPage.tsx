import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Alert,
  Grid, Chip, Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Divider, IconButton, Tooltip, Skeleton
} from '@mui/material';
import { Add, Send, Delete, Notifications, CalendarToday } from '@mui/icons-material';
import client from '../../api/client';
import { formatDateTime } from '../../utils/helpers';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    message: '',
    frequency: 'instant',
    scheduled_date: '',
  });

  const fetchNotifications = async () => {
    try {
      const res = await client.get('/notifications');
      setNotifications(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleCreate = async () => {
    if (!form.message.trim()) return;
    setCreating(true);
    setError('');
    try {
      await client.post('/notifications', {
        message: form.message,
        frequency: form.frequency,
        scheduled_date: form.scheduled_date || null,
        patient_ids: [],
      });
      setSuccess('Notification created and sent!');
      setForm({ message: '', frequency: 'instant', scheduled_date: '' });
      setShowForm(false);
      await fetchNotifications();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to create notification');
    } finally {
      setCreating(false);
    }
  };

  const freqColors: Record<string, string> = {
    instant: '#00BCD4',
    daily: '#22C55E',
    weekly: '#7C3AED',
    monthly: '#F97316',
    custom: '#EAB308',
  };

  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Notifications</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Create and manage reminders for your patients
          </Typography>
        </Box>
        <Button
          id="create-notif-btn"
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowForm(s => !s)}
          sx={{
            background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
            borderRadius: 3,
            fontWeight: 700,
            '&:hover': { background: 'linear-gradient(135deg, #00ACC1, #6D28D9)' },
          }}
        >
          Create Notification
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Create Form */}
      {showForm && (
        <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid rgba(0,188,212,0.25)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1}>
              <Notifications sx={{ color: 'primary.main' }} /> New Notification
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  id="notif-message"
                  fullWidth
                  label="Message"
                  multiline
                  rows={3}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="e.g., Please complete your daily journal to track your emotional wellness..."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    id="notif-frequency"
                    value={form.frequency}
                    label="Frequency"
                    onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                  >
                    <MenuItem value="instant">📢 Instant</MenuItem>
                    <MenuItem value="daily">📅 Daily</MenuItem>
                    <MenuItem value="weekly">📆 Weekly</MenuItem>
                    <MenuItem value="monthly">🗓️ Monthly</MenuItem>
                    <MenuItem value="custom">⚙️ Custom Date</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {form.frequency === 'custom' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    id="notif-date"
                    fullWidth
                    label="Scheduled Date"
                    type="datetime-local"
                    value={form.scheduled_date}
                    onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <Box display="flex" gap={1.5} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => setShowForm(false)}
                    sx={{ borderRadius: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    id="send-notif-btn"
                    variant="contained"
                    startIcon={creating ? <CircularProgress size={18} color="inherit" /> : <Send />}
                    onClick={handleCreate}
                    disabled={creating || !form.message.trim()}
                    sx={{
                      background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
                      borderRadius: 2,
                      fontWeight: 700,
                      '&:hover': { background: 'linear-gradient(135deg, #00ACC1, #6D28D9)' },
                    }}
                  >
                    Send Notification
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <Typography variant="h6" fontWeight={700} mb={2}>
        Sent Notifications ({notifications.length})
      </Typography>

      {loading ? (
        [1, 2, 3].map(i => <Skeleton key={i} height={80} sx={{ mb: 1.5, borderRadius: 2 }} />)
      ) : notifications.length === 0 ? (
        <Card sx={{ borderRadius: 3, textAlign: 'center', py: 6 }}>
          <Notifications sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">No notifications sent yet</Typography>
          <Typography variant="caption" color="text.disabled">
            Create reminders to keep patients engaged
          </Typography>
        </Card>
      ) : (
        notifications.map(notif => (
          <Card
            key={notif.id}
            sx={{
              mb: 2,
              borderRadius: 3,
              border: `1px solid ${freqColors[notif.frequency] || '#00BCD4'}25`,
              background: `${freqColors[notif.frequency] || '#00BCD4'}04`,
              transition: 'all 0.2s ease',
              '&:hover': { border: `1px solid ${freqColors[notif.frequency] || '#00BCD4'}50` },
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                <Box flex={1}>
                  <Typography variant="body1" color="text.primary" sx={{ mb: 1, lineHeight: 1.6 }}>
                    {notif.message}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                    <Chip
                      label={notif.frequency}
                      size="small"
                      sx={{
                        background: `${freqColors[notif.frequency] || '#00BCD4'}20`,
                        color: freqColors[notif.frequency] || '#00BCD4',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        textTransform: 'capitalize',
                      }}
                    />
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <CalendarToday sx={{ fontSize: 13, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(notif.created_at)}
                      </Typography>
                    </Box>
                    {notif.scheduled_date && (
                      <Typography variant="caption" color="text.secondary">
                        Scheduled: {formatDateTime(notif.scheduled_date)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};

export default NotificationsPage;
