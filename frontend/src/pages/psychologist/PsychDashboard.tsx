import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Skeleton, Alert, LinearProgress, IconButton, Tooltip
} from '@mui/material';
import {
  People, Warning, TrendingUp, Assignment, ArrowForward,
  FiberManualRecord, Assessment, LocalHospital
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import client from '../../api/client';
import { formatDate, formatDateTime, getRiskColor, getEmotionColor, getRiskBgColor } from '../../utils/helpers';

const KPICard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ label, value, icon, color, subtitle }) => (
  <Card
    sx={{
      borderRadius: 3,
      background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
      border: `1px solid ${color}30`,
      height: '100%',
    }}
  >
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h3" fontWeight={900} color={color} lineHeight={1}>
            {value}
          </Typography>
          <Typography variant="body2" fontWeight={600} color="text.primary" mt={0.5}>
            {label}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            background: `${color}22`,
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

const PsychDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/psychologist/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box>
        <Skeleton height={80} sx={{ mb: 3 }} />
        <Grid container spacing={3} mb={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton height={140} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton height={300} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  // Risk Distribution
  const riskCounts = data?.risk_breakdown || { Critical: 0, High: 0, Moderate: 0, Low: 0 };
  const riskPie = [
    { name: 'Critical', value: riskCounts.Critical || 0, color: '#EF4444' },
    { name: 'High', value: riskCounts.High || 0, color: '#F97316' },
    { name: 'Moderate', value: riskCounts.Moderate || 0, color: '#EAB308' },
    { name: 'Low', value: riskCounts.Low || 0, color: '#22C55E' },
  ].filter(d => d.value > 0);

  // CPA Distribution data
  const cpaCounts = data?.cpa_breakdown || {};
  const cpaBar = Object.entries(cpaCounts).map(([name, value]) => ({
    name,
    count: value
  }));

  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            Clinical Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Monitor patient mental health status, risk distribution, and critical reports
          </Typography>
        </Box>
        <Button
          id="view-all-patients-btn"
          variant="contained"
          startIcon={<People />}
          onClick={() => navigate('/psych/patients')}
          sx={{
            background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
            borderRadius: 3,
            fontWeight: 700,
            '&:hover': { background: 'linear-gradient(135deg, #00ACC1, #6D28D9)' },
          }}
        >
          View Patient Directory
        </Button>
      </Box>

      {/* High Risk Alerts */}
      {data?.high_risk_alerts?.length > 0 && (
        <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} color="#EF4444" display="flex" alignItems="center" gap={1} mb={2}>
              <Warning /> HIGH RISK PATIENT ALERTS ({data.high_risk_alerts.length})
            </Typography>
            <Grid container spacing={2}>
              {data.high_risk_alerts.map((alert: any, idx: number) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Box
                    onClick={() => navigate(`/psych/patients/${alert.patient_id}`)}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { border: '1px solid #EF4444', background: 'rgba(239,68,68,0.08)' }
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight={700}>{alert.patient_name}</Typography>
                      <Chip label={alert.risk_level} size="small" color="error" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Last Submission: {alert.last_journal_date ? formatDate(alert.last_journal_date) : 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Emotion: {alert.emotion}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={6} sm={3}>
          <KPICard
            label="Assigned Patients"
            value={data?.patient_count || 0}
            icon={<People fontSize="large" />}
            color="#00BCD4"
            subtitle="Registered clinic roster"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard
            label="Active Patients"
            value={data?.active_patients || 0}
            icon={<FiberManualRecord fontSize="large" />}
            color="#22C55E"
            subtitle="Journaled in past 7 days"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard
            label="Needs Attention"
            value={data?.needs_attention?.length || 0}
            icon={<Warning fontSize="large" />}
            color="#EF4444"
            subtitle="Critical or high-risk assessments"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard
            label="Assessed Sessions"
            value={data?.report_count || 0}
            icon={<Assessment fontSize="large" />}
            color="#7C3AED"
            subtitle="AI reports generated"
          />
        </Grid>
      </Grid>

      {/* Analytics Charts */}
      <Grid container spacing={3} mb={4}>
        {/* CPA Breakdown Bar Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, height: 320 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>Clinical Priority Assessment (CPA) Breakdown</Typography>
              {cpaBar.length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" height={220}>
                  <Typography color="text.secondary" variant="body2">No priority data available</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cpaBar}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                    <ChartTooltip contentStyle={{ background: '#112240', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Patients count" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Distribution Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: 320 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={1}>Risk Distribution</Typography>
              {riskPie.length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" height={220}>
                  <Typography color="text.secondary" variant="body2" textAlign="center">
                    No clinical risk data recorded yet
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={riskPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      outerRadius={70}
                      innerRadius={35}
                    >
                      {riskPie.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip contentStyle={{ background: '#112240', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Legend formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Clinical Reports Table */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} mb={2}>Recent Patient Clinical Reports</Typography>
          {data?.recent_reports?.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No clinical reports recorded yet in system.
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>PATIENT</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>TYPE</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>DOMINANT EMOTION</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>RISK CLASSIFICATION</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>CPA PRIORITY</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>SESSION DATE</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recent_reports.map((report: any) => {
                    const riskColor = getRiskColor(report.mhti?.risk_level);
                    return (
                      <TableRow
                        key={report.id}
                        sx={{
                          '&:hover': { background: 'rgba(255,255,255,0.03)' },
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/psych/patients/${report.user_id}`)}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                fontSize: '0.7rem',
                                background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
                              }}
                            >
                              {report.user_id?.slice(-2).toUpperCase()}
                            </Avatar>
                            <Typography variant="caption" color="text.secondary">
                              Patient ({report.user_id?.slice(-6)})
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={report.journal_type}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          {report.acgf?.final_emotion ? (
                            <Chip
                              label={report.acgf.final_emotion}
                              size="small"
                              sx={{
                                background: `${getEmotionColor(report.acgf.final_emotion)}20`,
                                color: getEmotionColor(report.acgf.final_emotion),
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 20,
                              }}
                            />
                          ) : '—'}
                        </TableCell>
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
                                border: `1px solid ${riskColor}40`,
                              }}
                            />
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={report.cpa?.clinical_priority || 'N/A'}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(report.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <ArrowForward sx={{ fontSize: 16, color: 'text.disabled' }} />
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
    </Box>
  );
};

export default PsychDashboard;
