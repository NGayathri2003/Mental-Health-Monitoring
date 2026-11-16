import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, Grid, Avatar,
  Tab, Tabs, Skeleton, Alert, Divider, Table, TableBody,
  TableCell, TableRow, LinearProgress, Tooltip
} from '@mui/material';
import {
  ArrowBack, Person, Article, Mic, Assessment, Timeline,
  DownloadForOffline, Print, CalendarToday
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';
import client from '../../api/client';
import { formatDate, formatDateTime, getRiskColor, getRiskBgColor, getEmotionColor } from '../../utils/helpers';
import type { FinalReport } from '../../types';

// Clinical Report Component
const ClinicalReportCard: React.FC<{ report: FinalReport; onDownload: (id: string) => void }> = ({ report, onDownload }) => {
  const riskColor = getRiskColor(report.mhti?.risk_level);

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 3,
        border: `1px solid ${riskColor}30`,
        background: `linear-gradient(135deg, ${riskColor}05 0%, transparent 100%)`,
      }}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Clinical Report — {formatDateTime(report.created_at)}
            </Typography>
            <Chip label={report.journal_type} size="small" variant="outlined" sx={{ mt: 0.5, textTransform: 'capitalize', fontSize: '0.65rem', height: 20 }} />
          </Box>
          <Box display="flex" gap={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadForOffline sx={{ fontSize: 16 }} />}
              onClick={() => onDownload(report.id)}
              sx={{ borderRadius: 2, fontSize: '0.75rem' }}
            >
              PDF
            </Button>
          </Box>
        </Box>

        {/* Transcript */}
        {report.transcript && (
          <Box mb={2} p={2} sx={{ background: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>
              TRANSCRIPT
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7 }}>
              {report.transcript}
            </Typography>
          </Box>
        )}

        <Grid container spacing={2}>
          {/* ACGF Fusion Results */}
          <Grid item xs={12} md={6}>
            <Box p={2} sx={{ background: 'rgba(0,188,212,0.05)', borderRadius: 2, border: '1px solid rgba(0,188,212,0.15)', height: '100%' }}>
              <Typography variant="caption" color="primary" fontWeight={700} display="block" mb={1.5}>
                🧠 ADAPTIVE CONFIDENCE GUIDED FUSION (ACGF)
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ border: 'none', py: 0.5, pl: 0, color: 'text.secondary', fontSize: '0.75rem' }}>
                      Text Emotion
                    </TableCell>
                    <TableCell sx={{ border: 'none', py: 0.5 }}>
                      <Chip
                        label={`${report.acgf?.text_emotion} (${(report.acgf?.text_confidence * 100).toFixed(1)}%)`}
                        size="small"
                        sx={{ background: `${getEmotionColor(report.acgf?.text_emotion)}20`, color: getEmotionColor(report.acgf?.text_emotion), fontSize: '0.7rem', height: 22, fontWeight: 600 }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ border: 'none', py: 0.5, pl: 0, color: 'text.secondary', fontSize: '0.75rem' }}>
                      Speech Emotion
                    </TableCell>
                    <TableCell sx={{ border: 'none', py: 0.5 }}>
                      <Chip
                        label={`${report.acgf?.speech_emotion} (${(report.acgf?.speech_confidence * 100).toFixed(1)}%)`}
                        size="small"
                        sx={{ background: `${getEmotionColor(report.acgf?.speech_emotion)}20`, color: getEmotionColor(report.acgf?.speech_emotion), fontSize: '0.7rem', height: 22, fontWeight: 600 }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ border: 'none', py: 0.5, pl: 0, color: 'text.secondary', fontSize: '0.75rem' }}>
                      Dominant Modality
                    </TableCell>
                    <TableCell sx={{ border: 'none', py: 0.5 }}>
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {report.acgf?.dominant_modality}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ border: 'none', py: 0.5, pl: 0, color: 'text.secondary', fontSize: '0.75rem' }}>
                      Fusion Result
                    </TableCell>
                    <TableCell sx={{ border: 'none', py: 0.5 }}>
                      <Chip
                        label={report.acgf?.final_emotion}
                        size="small"
                        sx={{ background: `${getEmotionColor(report.acgf?.final_emotion)}25`, color: getEmotionColor(report.acgf?.final_emotion), fontWeight: 700, fontSize: '0.75rem', height: 24 }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ border: 'none', py: 0.5, pl: 0, color: 'text.secondary', fontSize: '0.75rem' }}>
                      Fusion Confidence
                    </TableCell>
                    <TableCell sx={{ border: 'none', py: 0.5 }}>
                      <Box>
                        <Typography variant="caption" fontWeight={700} color="text.primary">
                          {(report.acgf?.fusion_confidence * 100).toFixed(1)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={report.acgf?.fusion_confidence * 100}
                          sx={{ height: 4, borderRadius: 2, mt: 0.3, background: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #00BCD4, #7C3AED)' } }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Grid>

          {/* MHTI + CPA */}
          <Grid item xs={12} md={6}>
            <Box p={2} sx={{ background: `${riskColor}06`, borderRadius: 2, border: `1px solid ${riskColor}20`, mb: 1.5 }}>
              <Typography variant="caption" fontWeight={700} display="block" mb={1.5} sx={{ color: riskColor }}>
                📊 MENTAL HEALTH TRAJECTORY INDEX (MHTI)
              </Typography>
              <Table size="small">
                <TableBody>
                  {[
                    ['Final Emotion', report.mhti?.final_emotion],
                    ['Severity Score', `${report.mhti?.severity_score} / 10`],
                    ['MHTI Score', `${report.mhti?.mhti_score}%`],
                  ].map(([label, value]) => (
                    <TableRow key={label}>
                      <TableCell sx={{ border: 'none', py: 0.4, pl: 0, color: 'text.secondary', fontSize: '0.75rem', width: '50%' }}>{label}</TableCell>
                      <TableCell sx={{ border: 'none', py: 0.4, fontWeight: 700, fontSize: '0.85rem', color: 'text.primary' }}>{value}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell sx={{ border: 'none', py: 0.4, pl: 0, color: 'text.secondary', fontSize: '0.75rem' }}>Risk Level</TableCell>
                    <TableCell sx={{ border: 'none', py: 0.4 }}>
                      <Chip
                        label={report.mhti?.risk_level}
                        size="small"
                        sx={{ background: getRiskBgColor(report.mhti?.risk_level), color: riskColor, fontWeight: 700, border: `1px solid ${riskColor}40`, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <LinearProgress
                variant="determinate"
                value={report.mhti?.mhti_score}
                sx={{ mt: 1.5, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { background: riskColor } }}
              />
            </Box>

            <Box p={2} sx={{ background: 'rgba(124,58,237,0.06)', borderRadius: 2, border: '1px solid rgba(124,58,237,0.15)' }}>
              <Typography variant="caption" fontWeight={700} display="block" mb={1} color="secondary.main">
                🏥 CLINICAL PRIORITY ASSESSMENT (CPA)
              </Typography>
              <Typography variant="body2" fontWeight={700} color="secondary.main" mb={0.5}>
                {report.cpa?.clinical_priority}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Monitoring: {report.cpa?.monitoring_frequency}
              </Typography>
              <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6, fontSize: '0.8rem' }}>
                {report.cpa?.recommendation}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [journals, setJournals] = useState<any[]>([]);
  const [reports, setReports] = useState<FinalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      try {
        const [pRes, jRes, rRes] = await Promise.all([
          client.get(`/psychologist/patients/${id}`),
          client.get(`/psychologist/patients/${id}/journals`),
          client.get(`/psychologist/patients/${id}/reports`),
        ]);
        setPatient(pRes.data);
        setJournals(jRes.data);
        setReports(rRes.data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [id]);

  const handleDownload = async (reportId: string) => {
    try {
      const res = await client.get(`/reports/download/${reportId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${reportId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  // Timeline data
  const timeline = reports
    .filter(r => r.mhti?.mhti_score !== undefined)
    .map(r => ({
      date: formatDate(r.created_at),
      mhti: r.mhti?.mhti_score,
      emotion: r.acgf?.final_emotion,
    }))
    .reverse();

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  if (loading) {
    return (
      <Box>
        <Skeleton height={100} sx={{ borderRadius: 3, mb: 2 }} />
        <Skeleton height={300} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!patient) {
    return <Alert severity="error">Patient not found</Alert>;
  }

  const latestReport = reports[0];
  const riskColor = getRiskColor(latestReport?.mhti?.risk_level);

  return (
    <Box>
      {/* Header */}
      <Box mb={3} display="flex" alignItems="center" gap={2}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/psych/patients')}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Back
        </Button>
        <Typography variant="h5" fontWeight={800} flex={1}>Patient Detail</Typography>
      </Box>

      {/* Patient Profile Card */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${riskColor}30`,
          background: `linear-gradient(135deg, ${riskColor}06 0%, transparent 100%)`,
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" gap={2.5} flexWrap="wrap">
            <Avatar
              sx={{
                width: 72,
                height: 72,
                background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
                fontSize: '1.4rem',
                fontWeight: 800,
                border: `3px solid ${riskColor}40`,
                flexShrink: 0,
              }}
            >
              {getInitials(patient.name)}
            </Avatar>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                <Typography variant="h5" fontWeight={800}>{patient.name}</Typography>
                {latestReport?.mhti?.risk_level && (
                  <Chip
                    label={latestReport.mhti.risk_level}
                    sx={{
                      background: getRiskBgColor(latestReport.mhti.risk_level),
                      color: riskColor,
                      fontWeight: 700,
                      border: `1px solid ${riskColor}40`,
                    }}
                  />
                )}
              </Box>
              <Typography color="text.secondary" variant="body2">{patient.email}</Typography>
              <Box display="flex" gap={2} mt={1} flexWrap="wrap">
                {patient.gender && <Typography variant="caption" color="text.secondary">Gender: {patient.gender}</Typography>}
                {patient.dob && <Typography variant="caption" color="text.secondary">DOB: {formatDate(patient.dob)}</Typography>}
                {patient.phone && <Typography variant="caption" color="text.secondary">Phone: {patient.phone}</Typography>}
              </Box>
            </Box>
            <Box textAlign="right">
              <Typography variant="h3" fontWeight={900} color={riskColor}>
                {latestReport?.mhti?.mhti_score?.toFixed(0) || '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">MHTI Score</Typography>
              <Box display="flex" gap={1} mt={1} justifyContent="flex-end">
                <Chip label={`${journals.length} journals`} size="small" variant="outlined" />
                <Chip label={`${reports.length} reports`} size="small" variant="outlined" />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v)}
        sx={{
          mb: 2,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
          '& .Mui-selected': { color: 'primary.main' },
          '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #00BCD4, #7C3AED)' },
        }}
      >
        <Tab label="Overview" icon={<Person sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Text Journals" icon={<Article sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Clinical Reports" icon={<Assessment sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Emotion Timeline" icon={<Timeline sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Calendar" icon={<CalendarToday sx={{ fontSize: 18 }} />} iconPosition="start" />
      </Tabs>

      {/* Overview Tab */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>Latest Assessment</Typography>
                {latestReport ? (
                  <>
                    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                      <Chip
                        label={latestReport.acgf?.final_emotion}
                        sx={{ background: `${getEmotionColor(latestReport.acgf?.final_emotion)}20`, color: getEmotionColor(latestReport.acgf?.final_emotion), fontWeight: 700 }}
                      />
                      <Chip
                        label={latestReport.mhti?.risk_level}
                        sx={{ background: getRiskBgColor(latestReport.mhti?.risk_level), color: riskColor, fontWeight: 700 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {latestReport.cpa?.recommendation}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Report from {formatDate(latestReport.created_at)}
                    </Typography>
                  </>
                ) : (
                  <Alert severity="info">No reports yet for this patient.</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>Activity Summary</Typography>
                <Table size="small">
                  <TableBody>
                    {[
                      ['Total Journals', journals.length],
                      ['Text Journals', journals.filter(j => !j.journal_type || j.journal_type === 'text').length],
                      ['Voice Journals', journals.filter(j => j.journal_type === 'voice').length],
                      ['Total Reports', reports.length],
                    ].map(([label, value]) => (
                      <TableRow key={label}>
                        <TableCell sx={{ border: 'none', py: 0.8, pl: 0, color: 'text.secondary' }}>{label}</TableCell>
                        <TableCell sx={{ border: 'none', py: 0.8, fontWeight: 700, color: 'text.primary' }}>{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Text Journals Tab */}
      {tab === 1 && (
        <Box>
          {journals.length === 0 ? (
            <Alert severity="info">No text journals yet.</Alert>
          ) : (
            journals.map(journal => (
              <Card key={journal.id} sx={{ mb: 2, borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="caption" color="text.secondary">{formatDateTime(journal.created_at)}</Typography>
                    <Box display="flex" gap={0.5}>
                      {journal.emotion_result?.emotion && (
                        <Chip
                          label={journal.emotion_result.emotion}
                          size="small"
                          sx={{ background: `${getEmotionColor(journal.emotion_result.emotion)}20`, color: getEmotionColor(journal.emotion_result.emotion), fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                        />
                      )}
                      <Chip label={journal.submitted ? 'Submitted' : 'Draft'} size="small" color={journal.submitted ? 'success' : 'warning'} variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7 }}>
                    {journal.content}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      {/* Clinical Reports Tab */}
      {tab === 2 && (
        <Box>
          {reports.length === 0 ? (
            <Alert severity="info">No clinical reports yet.</Alert>
          ) : (
            reports.map(report => (
              <ClinicalReportCard key={report.id} report={report} onDownload={handleDownload} />
            ))
          )}
        </Box>
      )}

      {/* Emotion Timeline Tab */}
      {tab === 3 && (
        <Box>
          {timeline.length < 2 ? (
            <Alert severity="info">Need at least 2 assessments for timeline.</Alert>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} mb={2}>MHTI Score Over Time</Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={timeline}>
                        <defs>
                          <linearGradient id="mhtiGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                        <RTooltip contentStyle={{ background: '#112240', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                        <Area type="monotone" dataKey="mhti" stroke="#EF4444" fill="url(#mhtiGrad)" strokeWidth={2} name="MHTI Score" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} mb={2}>Emotion Timeline</Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      {timeline.slice().reverse().map((entry, i) => (
                        <Box
                          key={i}
                          sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <Typography variant="caption" color="text.secondary" minWidth={80}>{entry.date}</Typography>
                          <Chip
                            label={entry.emotion}
                            size="small"
                            sx={{ background: `${getEmotionColor(entry.emotion)}20`, color: getEmotionColor(entry.emotion), fontWeight: 700, fontSize: '0.7rem' }}
                          />
                          <Box flex={1}>
                            <LinearProgress
                              variant="determinate"
                              value={entry.mhti}
                              sx={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { background: getRiskColor(entry.mhti >= 80 ? 'Critical' : entry.mhti >= 60 ? 'High' : entry.mhti >= 40 ? 'Moderate' : 'Low') } }}
                            />
                          </Box>
                          <Typography variant="caption" fontWeight={700} color="text.primary" minWidth={36} textAlign="right">
                            {entry.mhti?.toFixed(0)}%
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )}

      {/* Calendar Tab */}
      {tab === 4 && (() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const monthStart = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startWeekday = monthStart.getDay();

        // Compile journal and report submission dates
        const journalDates = journals.map(j => {
          if (!j.created_at) return '';
          return j.created_at.split('T')[0];
        }).concat(reports.map(r => {
          if (!r.created_at) return '';
          return r.created_at.split('T')[0];
        })).filter(Boolean);

        const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
          const dateNum = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
          const count = journalDates.filter(d => d === dateStr).length;
          const isToday = today.getDate() === dateNum;
          return { dateStr, dateNum, count, isToday };
        });

        return (
          <Card sx={{ borderRadius: 3, background: 'rgba(17, 25, 40, 0.7)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>Patient Journaling Calendar</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {today.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
                  </Typography>
                </Box>
                <Chip label="Submitted Days Highlighted" color="success" size="small" sx={{ fontWeight: 700 }} />
              </Box>

              <Box display="grid" gridTemplateColumns="repeat(7, minmax(0, 1fr))" gap={1.5}>
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <Typography key={day} variant="caption" color="text.secondary" textAlign="center" fontWeight={700} sx={{ pb: 1 }}>
                    {day.slice(0, 3)}
                  </Typography>
                ))}
                {Array.from({ length: startWeekday }).map((_, idx) => (
                  <Box key={`blank-${idx}`} sx={{ minHeight: 70 }} />
                ))}
                {calendarDays.map(day => (
                  <Box
                    key={day.dateStr}
                    sx={{
                      minHeight: 70,
                      borderRadius: 2,
                      p: 1,
                      border: day.isToday ? '1px solid #00BCD4' : '1px solid rgba(255,255,255,0.08)',
                      background: day.isToday
                        ? 'rgba(0,188,212,0.1)'
                        : day.count > 0
                          ? 'rgba(34,197,94,0.12)'
                          : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    <Typography
                      variant="body2"
                      color={day.isToday ? '#00BCD4' : day.count > 0 ? '#22C55E' : 'text.secondary'}
                      fontWeight={day.isToday || day.count > 0 ? 700 : 500}
                    >
                      {day.dateNum}
                    </Typography>
                    {day.count > 0 && (
                      <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
                        <Chip
                          label={`${day.count} entry${day.count > 1 ? 'ies' : ''}`}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.6rem',
                            bgcolor: 'rgba(34,197,94,0.25)',
                            color: '#22C55E',
                            fontWeight: 700
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        );
      })()}
    </Box>
  );
};

export default PatientDetail;
