import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  Chip, Alert, CircularProgress, Divider, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Paper
} from '@mui/material';
import {
  Add, Save, Send, Delete, Edit, CheckCircle, Article, Visibility, LocalHospital
} from '@mui/icons-material';
import client from '../../api/client';
import type { FinalReport, TextJournal } from '../../types';
import { formatDate, formatDateTime, getEmotionColor, getRiskColor } from '../../utils/helpers';

const TextJournalPage: React.FC = () => {
  const [drafts, setDrafts] = useState<TextJournal[]>([]);
  const [submittedJournals, setSubmittedJournals] = useState<TextJournal[]>([]);
  const [reportsByJournalId, setReportsByJournalId] = useState<Record<string, FinalReport>>({});
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [viewReport, setViewReport] = useState<FinalReport | null>(null);

  const sortByNewest = (a: TextJournal, b: TextJournal) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

  const applyJournalLists = (all: TextJournal[]) => {
    setDrafts(all.filter(j => j.is_draft));
    // Show submitted entries by flag; fall back to non-drafts for legacy rows.
    setSubmittedJournals(
      all.filter(j => j.submitted || !j.is_draft).sort(sortByNewest)
    );
  };

  const fetchReports = async () => {
    try {
      const reportsRes = await client.get('/reports/my');
      const reportMap: Record<string, FinalReport> = {};
      (reportsRes.data as FinalReport[])
        .filter(r => r.journal_type === 'text')
        .forEach(r => { reportMap[r.journal_id] = r; });
      setReportsByJournalId(reportMap);
    } catch (e: any) {
      console.warn('Failed to load reports:', e.response?.data?.detail || e.message);
    }
  };

  const fetchJournals = async () => {
    try {
      const journalsRes = await client.get('/journals');
      applyJournalLists(journalsRes.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load journals');
      return;
    } finally {
      setListLoading(false);
    }
    await fetchReports();
  };

  useEffect(() => { fetchJournals(); }, []);

  const handleSaveDraft = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      if (editingId) {
        await client.put(`/journals/${editingId}`, { content, is_draft: true });
        setSuccess('Draft updated');
      } else {
        await client.post('/journals', { content, is_draft: true });
        setSuccess('Draft saved');
      }
      setContent('');
      setEditingId(null);
      setShowEditor(false);
      await fetchJournals();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      let submitted: TextJournal;
      if (editingId) {
        const res = await client.put(`/journals/${editingId}`, { content, is_draft: false });
        submitted = res.data;
      } else {
        const res = await client.post('/journals', { content, is_draft: false });
        submitted = res.data;
      }

      const emotion = submitted.emotion_result?.emotion || 'analyzed';
      const confidence = submitted.emotion_result?.confidence
        ? Math.round(submitted.emotion_result.confidence * 100)
        : null;
      setSuccess(
        confidence
          ? `Journal submitted and analyzed! Detected emotion: ${emotion} (${confidence}% confidence). View your report below.`
          : `Journal submitted and analyzed! Detected emotion: ${emotion}. View your report below.`
      );

      // Immediately reflect the submitted journal in the UI (don't wait for refetch).
      setDrafts(prev => prev.filter(j => j.id !== submitted.id));
      setSubmittedJournals(prev => {
        const without = prev.filter(j => j.id !== submitted.id);
        return [submitted, ...without].sort(sortByNewest);
      });

      setContent('');
      setEditingId(null);
      setShowEditor(false);

      // Refresh lists and load the new clinical report in the background.
      await fetchJournals();
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to submit journal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (journal: TextJournal) => {
    setEditingId(journal.id);
    setContent(journal.content);
    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/journals/${id}`);
      setDeleteId(null);
      await fetchJournals();
      setSuccess('Draft deleted');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to delete');
    }
  };

  const handleViewReport = async (journalId: string) => {
    const cached = reportsByJournalId[journalId];
    if (cached) {
      setViewReport(cached);
      return;
    }
    try {
      const res = await client.get('/reports/my');
      const report = (res.data as FinalReport[]).find(r => r.journal_id === journalId);
      if (report) {
        setReportsByJournalId(prev => ({ ...prev, [journalId]: report }));
        setViewReport(report);
      } else {
        setError('Clinical report not found for this journal.');
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load clinical report');
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            Text Journal
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Express your thoughts — AI will analyze your emotional patterns
          </Typography>
        </Box>
        <Button
          id="new-journal-btn"
          variant="contained"
          startIcon={<Add />}
          onClick={() => { setShowEditor(true); setContent(''); setEditingId(null); }}
          sx={{
            background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
            borderRadius: 3,
            fontWeight: 700,
            '&:hover': { background: 'linear-gradient(135deg, #00ACC1, #6D28D9)' },
          }}
        >
          New Journal
        </Button>
      </Box>

      {success && (
        <Alert
          severity="success"
          icon={<CheckCircle fontSize="inherit" />}
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Editor */}
      {showEditor && (
        <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid rgba(0,188,212,0.2)' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700} display="flex" alignItems="center" gap={1}>
                <Article sx={{ color: 'primary.main' }} />
                {editingId ? 'Edit Draft' : 'New Journal Entry'}
              </Typography>
              <Chip label={`${wordCount} words`} size="small" color={wordCount > 50 ? 'success' : 'default'} />
            </Box>

            <TextField
              id="journal-content"
              fullWidth
              multiline
              rows={8}
              placeholder="How are you feeling today? Write freely — your thoughts are private and secure. The AI will analyze your emotional patterns to help your psychologist support you better."
              value={content}
              onChange={e => setContent(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '1rem',
                  lineHeight: 1.8,
                },
              }}
            />

            {wordCount < 10 && content.length > 0 && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Write at least 10 words for better emotion analysis
              </Alert>
            )}

            <Box display="flex" gap={1.5} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => { setShowEditor(false); setContent(''); setEditingId(null); }}
                sx={{ borderRadius: 2 }}
              >
                Cancel
              </Button>
              <Button
                id="save-draft-btn"
                variant="outlined"
                startIcon={<Save />}
                onClick={handleSaveDraft}
                disabled={loading || !content.trim()}
                sx={{ borderRadius: 2 }}
              >
                {loading ? <CircularProgress size={18} /> : 'Save Draft'}
              </Button>
              <Button
                id="submit-journal-btn"
                variant="contained"
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Send />}
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
                sx={{
                  background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
                  borderRadius: 2,
                  fontWeight: 700,
                  '&:hover': { background: 'linear-gradient(135deg, #00ACC1, #6D28D9)' },
                }}
              >
                Submit & Analyze
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Submitted Journals */}
      <Typography variant="h6" fontWeight={700} mb={2}>
        Submitted Journals ({submittedJournals.length})
      </Typography>

      {listLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : submittedJournals.length === 0 ? (
        <Card sx={{ mb: 4, borderRadius: 3, textAlign: 'center', py: 4, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <CheckCircle sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No submitted journals yet. Submit an entry to see AI analysis here.</Typography>
        </Card>
      ) : (
        submittedJournals.map(journal => (
          <Card
            key={journal.id}
            sx={{
              mb: 2,
              borderRadius: 3,
              border: '1px solid rgba(34,197,94,0.25)',
              background: 'rgba(34,197,94,0.03)',
              transition: 'all 0.2s ease',
              '&:hover': { border: '1px solid rgba(34,197,94,0.4)' },
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                <Box flex={1}>
                  <Typography variant="body1" color="text.primary" sx={{ mb: 1, lineHeight: 1.7 }}>
                    {journal.content.slice(0, 200)}{journal.content.length > 200 ? '...' : ''}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary">
                      Submitted {formatDateTime(journal.created_at)}
                    </Typography>
                    {journal.emotion_result?.emotion && (
                      <Chip
                        label={`${journal.emotion_result.emotion}${journal.emotion_result.confidence ? ` · ${Math.round(journal.emotion_result.confidence * 100)}%` : ''}`}
                        size="small"
                        sx={{
                          background: `${getEmotionColor(journal.emotion_result.emotion)}20`,
                          color: getEmotionColor(journal.emotion_result.emotion),
                          fontWeight: 700,
                        }}
                      />
                    )}
                    <Chip label="Analyzed" size="small" color="success" variant="outlined" icon={<CheckCircle />} />
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Visibility />}
                  onClick={() => handleViewReport(journal.id)}
                  sx={{ borderRadius: 2, flexShrink: 0, textTransform: 'none' }}
                >
                  View Report
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      <Divider sx={{ my: 3 }} />

      {/* Drafts */}
      <Typography variant="h6" fontWeight={700} mb={2}>
        Saved Drafts ({drafts.length})
      </Typography>

      {drafts.length === 0 ? (
        <Card sx={{ borderRadius: 3, textAlign: 'center', py: 6 }}>
          <Article sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">No drafts yet. Start writing!</Typography>
        </Card>
      ) : (
        drafts.map(journal => (
          <Card
            key={journal.id}
            sx={{
              mb: 2,
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.07)',
              transition: 'all 0.2s ease',
              '&:hover': { border: '1px solid rgba(0,188,212,0.2)', background: 'rgba(0,188,212,0.03)' },
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1} mr={2}>
                  <Typography variant="body1" color="text.primary" sx={{ mb: 1, lineHeight: 1.7 }}>
                    {journal.content.slice(0, 200)}{journal.content.length > 200 ? '...' : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(journal.updated_at)}
                  </Typography>
                </Box>
                <Box display="flex" gap={0.5} flexShrink={0}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEdit(journal)} sx={{ color: 'primary.main' }}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => setDeleteId(journal.id)} sx={{ color: 'error.main' }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Chip label="Draft" size="small" color="warning" variant="outlined" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        ))
      )}

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        PaperProps={{ sx: { borderRadius: 3, background: '#112240', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle fontWeight={700}>Delete Draft?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            onClick={() => deleteId && handleDelete(deleteId)}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clinical Report Dialog */}
      <Dialog
        open={!!viewReport}
        onClose={() => setViewReport(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, background: '#112240', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle fontWeight={800} display="flex" alignItems="center" gap={1}>
          <LocalHospital sx={{ color: '#a78bfa' }} />
          Clinical Assessment Report
        </DialogTitle>
        <DialogContent dividers>
          {viewReport && (
            <Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Generated {formatDateTime(viewReport.created_at)}
              </Typography>

              <Box mb={2} p={2} sx={{ background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                <Typography variant="caption" color="primary" fontWeight={700}>JOURNAL CONTENT</Typography>
                <Typography variant="body2" mt={0.5} sx={{ lineHeight: 1.7 }}>
                  {viewReport.transcript}
                </Typography>
              </Box>

              <Grid container spacing={2} mb={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }}>
                    <Typography variant="caption" color="text.secondary">DETECTED EMOTION</Typography>
                    <Typography variant="h6" fontWeight={700} color={getEmotionColor(viewReport.text_emotion?.emotion)} textTransform="capitalize">
                      {viewReport.text_emotion?.emotion || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Confidence: {Math.round((viewReport.text_emotion?.confidence || 0) * 100)}% (DistilBERT)
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }}>
                    <Typography variant="caption" color="text.secondary">MHTI RISK LEVEL</Typography>
                    <Typography variant="h6" fontWeight={700} color={getRiskColor(viewReport.mhti?.risk_level)}>
                      {viewReport.mhti?.risk_level || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Score: {viewReport.mhti?.mhti_score ?? 'N/A'} / 100
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box p={2} sx={{ background: 'rgba(124,58,237,0.08)', borderRadius: 2, border: '1px solid rgba(124,58,237,0.2)' }}>
                <Typography variant="subtitle2" fontWeight={700} color="#a78bfa" mb={0.5}>
                  {viewReport.cpa?.clinical_priority || 'Clinical Priority Assessment'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {viewReport.cpa?.recommendation || 'Regular monitoring recommended.'}
                </Typography>
                <Typography variant="caption" color="primary" display="block" mt={1}>
                  Monitoring: {viewReport.cpa?.monitoring_frequency || 'Standard'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewReport(null)} variant="contained" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TextJournalPage;
