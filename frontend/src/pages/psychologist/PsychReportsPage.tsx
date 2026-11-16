import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Skeleton, IconButton, Tooltip
} from '@mui/material';
import { Assessment, DownloadForOffline, ArrowForward, FilterList } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { formatDateTime, getRiskColor, getRiskBgColor, getEmotionColor } from '../../utils/helpers';
import type { FinalReport } from '../../types';

const PsychReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<FinalReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/reports')
      .then(r => setReports(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
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
    } catch { /* silent */ }
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={800}>All Clinical Reports</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Full ACGF + MHTI + CPA assessments for all patients
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          {loading ? (
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          ) : reports.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No clinical reports yet. Reports are automatically generated when patients submit text or voice journals.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {['Patient ID', 'Type', 'Final Emotion', 'Dominant', 'MHTI Score', 'Risk', 'Priority', 'Date', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map(report => {
                    const riskColor = getRiskColor(report.mhti?.risk_level);
                    return (
                      <TableRow
                        key={report.id}
                        sx={{ '&:hover': { background: 'rgba(255,255,255,0.025)' } }}
                      >
                        <TableCell>
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                            {report.user_id?.slice(-8)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={report.journal_type} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }} />
                        </TableCell>
                        <TableCell>
                          {report.acgf?.final_emotion ? (
                            <Chip
                              label={report.acgf.final_emotion}
                              size="small"
                              sx={{ background: `${getEmotionColor(report.acgf.final_emotion)}20`, color: getEmotionColor(report.acgf.final_emotion), fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                            />
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {report.acgf?.dominant_modality || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color={riskColor}>
                            {report.mhti?.mhti_score?.toFixed(1) || '—'}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {report.mhti?.risk_level ? (
                            <Chip
                              label={report.mhti.risk_level}
                              size="small"
                              sx={{ background: getRiskBgColor(report.mhti.risk_level), color: riskColor, fontWeight: 700, border: `1px solid ${riskColor}40`, fontSize: '0.65rem', height: 20 }}
                            />
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 160, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {report.cpa?.clinical_priority || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary" whiteSpace="nowrap">
                            {formatDateTime(report.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="Download PDF">
                              <IconButton size="small" onClick={() => handleDownload(report.id)} sx={{ color: 'primary.main' }}>
                                <DownloadForOffline fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Patient">
                              <IconButton size="small" onClick={() => navigate(`/psych/patients/${report.user_id}`)} sx={{ color: 'text.secondary' }}>
                                <ArrowForward fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
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

export default PsychReportsPage;
