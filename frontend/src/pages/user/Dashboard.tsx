import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button,
  LinearProgress, Avatar, Skeleton, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip
} from '@mui/material';
import {
  Book, Mic, TrendingUp, CalendarToday, EmojiEmotions,
  Notifications, ArrowForward, CheckCircle, RadioButtonUnchecked,
  DownloadForOffline, LocalHospital, Favorite
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer
} from 'recharts';
import client from '../../api/client';
import { formatDate, formatDateTime, getEmotionColor, getRiskColor, getRiskBgColor } from '../../utils/helpers';

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  onClick?: () => void;
}> = ({ icon, label, value, color, onClick }) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
      border: `1px solid ${color}30`,
      borderRadius: 3,
      transition: 'all 0.3s ease',
      '&:hover': onClick ? {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 40px ${color}25`,
        border: `1px solid ${color}60`,
      } : {},
    }}
  >
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h4" fontWeight={800} color={color}>{value}</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>{label}</Typography>
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const [dashRes, notifRes] = await Promise.all([
        client.get('/users/dashboard'),
        client.get('/notifications/me')
      ]);
      setData(dashRes.data);
      setNotifications(notifRes.data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleDownload = async (reportId: string) => {
    try {
      const res = await client.get(`/reports/download/${reportId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${reportId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // failed
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calendar rendering variables
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthStart = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = monthStart.getDay();

  const calendarDays = data ? Array.from({ length: daysInMonth }, (_, i) => {
    const dateNum = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
    const hasJournal = data.calendar_dates?.includes(dateStr);
    const isToday = today.getDate() === dateNum;
    return { dateStr, dateNum, hasJournal, isToday };
  }) : [];

  if (loading) {
    return (
      <Box>
        <Box mb={4}>
          <Skeleton width="40%" height={50} />
          <Skeleton width="20%" height={25} />
        </Box>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={3} mb={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton height={140} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton height={280} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton height={280} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  const latestMood = data?.latest_mood || 'None Yet';
  const latestRisk = data?.latest_risk || 'Low';
  const streak = data?.streak || 0;
  const journaledToday = data?.journaled_today || false;

  return (
    <Box>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>
            {today.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button
            id="dash-new-text"
            variant="outlined"
            startIcon={<Book />}
            onClick={() => navigate('/journal/text')}
            sx={{ borderRadius: 3, border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Text Journal
          </Button>
          <Button
            id="dash-new-voice"
            variant="contained"
            startIcon={<Mic />}
            onClick={() => navigate('/journal/voice')}
            sx={{
              background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
              borderRadius: 3,
              '&:hover': { background: 'linear-gradient(135deg, #00ACC1, #6D28D9)' },
            }}
          >
            Voice Journal
          </Button>
        </Box>
      </Box>

      {/* Today's Status Banner */}
      <Card
        sx={{
          mb: 4,
          background: journaledToday
            ? 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(0,188,212,0.06))'
            : 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(234,179,8,0.06))',
          border: `1px solid ${journaledToday ? 'rgba(34,197,94,0.25)' : 'rgba(249,115,22,0.25)'}`,
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '14px !important' }}>
          {journaledToday
            ? <CheckCircle sx={{ color: '#22C55E', fontSize: 30 }} />
            : <RadioButtonUnchecked sx={{ color: '#F97316', fontSize: 30 }} />
          }
          <Box flex={1}>
            <Typography fontWeight={700} color="text.primary">
              {journaledToday ? "Today's journal submitted ✓" : "You haven't journaled today yet"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {journaledToday
                ? `Current mood assessment: ${latestMood}`
                : 'Share your thoughts today to keep up your streak and track mental health trajectory.'}
            </Typography>
          </Box>
          {!journaledToday && (
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate('/journal/text')}
              sx={{ background: 'linear-gradient(135deg, #F97316, #EAB308)', borderRadius: 2, whiteSpace: 'nowrap', fontWeight: 700 }}
            >
              Journal Now
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Book />}
            label="Total Journals"
            value={data?.total_journals || 0}
            color="#00BCD4"
            onClick={() => navigate('/history')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CheckCircle />}
            label="Journaling Streak"
            value={`${streak} days`}
            color="#22C55E"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Favorite />}
            label="Emotional State"
            value={latestMood}
            color={getEmotionColor(latestMood)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<LocalHospital />}
            label="Current Risk Level"
            value={latestRisk}
            color={getRiskColor(latestRisk)}
          />
        </Grid>
      </Grid>

      {/* CPA & Clinic Information */}
      {data?.latest_cpa && (
        <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.04)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} color="secondary.main" display="flex" alignItems="center" gap={1} mb={1}>
              <LocalHospital /> Clinical Recommendation (CPA)
            </Typography>
            <Box display="flex" gap={1.5} flexWrap="wrap" mb={2}>
              <Chip label={`Clinical Priority: ${data.latest_cpa.clinical_priority}`} color="secondary" size="small" sx={{ fontWeight: 700 }} />
              <Chip label={`Monitoring Frequency: ${data.latest_cpa.monitoring_frequency}`} variant="outlined" color="secondary" size="small" />
            </Box>
            <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7 }}>
              {data.latest_cpa.recommendation}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Trajectories & Analytics */}
      <Grid container spacing={3} mb={4}>
        {/* MHTI Score Line */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 350, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1}>
                <TrendingUp sx={{ color: 'primary.main' }} /> Mental Health Trajectory Index (MHTI)
              </Typography>
              {data?.mhti_trend?.length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" height={240}>
                  <Typography color="text.secondary" variant="body2">No trajectory data yet</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={data?.mhti_trend}>
                    <defs>
                      <linearGradient id="mhtiTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={getRiskColor(latestRisk)} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={getRiskColor(latestRisk)} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => formatDate(d)}
                      tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                    <ChartTooltip
                      contentStyle={{ background: '#112240', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      labelFormatter={(l) => formatDateTime(l)}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke={getRiskColor(latestRisk)}
                      fill="url(#mhtiTrend)"
                      strokeWidth={3}
                      name="MHTI Score"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Calendar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 350, borderRadius: 3, background: 'rgba(17, 25, 40, 0.5)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={0.5} display="flex" alignItems="center" gap={1}>
                <CalendarToday sx={{ color: '#00BCD4' }} /> Journal Calendar
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                {today.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
              </Typography>

              <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.5} textAlign="center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                  <Typography key={d} variant="caption" color="text.disabled" fontWeight={700}>
                    {d}
                  </Typography>
                ))}
                {Array.from({ length: startWeekday }).map((_, i) => (
                  <Box key={`blank-${i}`} sx={{ pt: '100%' }} />
                ))}
                {calendarDays.map(day => (
                  <Box
                    key={day.dateStr}
                    sx={{
                      pt: '100%',
                      position: 'relative',
                      borderRadius: 2,
                      background: day.isToday
                        ? 'rgba(0, 188, 212, 0.15)'
                        : day.hasJournal
                          ? 'rgba(34, 197, 94, 0.12)'
                          : 'rgba(255,255,255,0.02)',
                      border: day.isToday
                        ? '1px solid #00BCD4'
                        : day.hasJournal
                          ? '1px solid rgba(34,197,94,0.3)'
                          : '1px solid transparent',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={day.isToday || day.hasJournal ? 700 : 500}
                        color={day.isToday ? '#00BCD4' : day.hasJournal ? '#22C55E' : 'text.primary'}
                      >
                        {day.dateNum}
                      </Typography>
                      {day.hasJournal && (
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#22C55E', mt: 0.2 }} />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Weekly Activity Summary */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>Weekly Submission Activity</Typography>
              {data?.weekly_summary?.length === 0 ? (
                <Skeleton variant="rectangular" height={100} />
              ) : (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={data?.weekly_summary}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                    <ChartTooltip contentStyle={{ background: '#112240', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="journal_count" fill="#00BCD4" radius={[4, 4, 0, 0]} name="Journals Submitted" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Clinical Reports list */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} mb={2.5}>Recent AI Clinical Assessments</Typography>
          {data?.recent_reports?.length === 0 ? (
            <Alert severity="info">No clinical reports available yet.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem' }}>TYPE</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem' }}>FUSED EMOTION</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem' }}>MHTI SCORE</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem' }}>RISK LEVEL</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem' }}>DATE</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem', textAlign: 'right' }}>ACTION</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recent_reports.map((report: any) => {
                    const riskColor = getRiskColor(report.mhti?.risk_level);
                    return (
                      <TableRow key={report.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                        <TableCell sx={{ textTransform: 'capitalize', fontWeight: 600 }}>{report.journal_type}</TableCell>
                        <TableCell>
                          {report.acgf?.final_emotion ? (
                            <Chip
                              label={report.acgf.final_emotion}
                              size="small"
                              sx={{
                                background: `${getEmotionColor(report.acgf.final_emotion)}15`,
                                color: getEmotionColor(report.acgf.final_emotion),
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 20
                              }}
                            />
                          ) : '—'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{report.mhti?.mhti_score?.toFixed(0)}%</TableCell>
                        <TableCell>
                          {report.mhti?.risk_level ? (
                            <Chip
                              label={report.mhti.risk_level}
                              size="small"
                              sx={{
                                background: getRiskBgColor(report.mhti.risk_level),
                                color: riskColor,
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 20,
                                border: `1px solid ${riskColor}30`
                              }}
                            />
                          ) : '—'}
                        </TableCell>
                        <TableCell>{formatDateTime(report.created_at)}</TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Tooltip title="Download Clinical Report (PDF)">
                            <IconButton size="small" onClick={() => handleDownload(report.id)} sx={{ color: 'primary.main' }}>
                              <DownloadForOffline />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Reminders from Psychologist */}
      {notifications.length > 0 && (
        <Card sx={{ borderRadius: 3, border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.05)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
              <Notifications sx={{ color: '#7C3AED' }} /> Psychologist Bulletins & Tasks
            </Typography>
            {notifications.slice(0, 3).map(n => (
              <Box
                key={n.id}
                sx={{ p: 2, mb: 1, borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Typography variant="body2" color="text.primary">{n.message}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  Sent {formatDateTime(n.created_at)} • Frequency: {n.frequency}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default UserDashboard;
