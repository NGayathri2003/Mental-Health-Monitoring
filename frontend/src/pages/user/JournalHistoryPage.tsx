import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, TextField, InputAdornment,
  ToggleButton, ToggleButtonGroup, Skeleton, Alert, Divider, Pagination
} from '@mui/material';
import { Search, Article, Mic, CalendarToday, FilterList } from '@mui/icons-material';
import client from '../../api/client';
import type { TextJournal } from '../../types';
import { formatDateTime, getEmotionColor, truncate } from '../../utils/helpers';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const JournalHistoryPage: React.FC = () => {
  const [journals, setJournals] = useState<TextJournal[]>([]);
  const [voiceJournals, setVoiceJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'text' | 'voice'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [textRes, voiceRes] = await Promise.all([
          client.get('/journals'),
          client.get('/voice'),
        ]);
        setJournals(textRes.data);
        setVoiceJournals(voiceRes.data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const submittedText = journals.filter(j => j.submitted);
  const all = [
    ...submittedText.map(j => ({ ...j, type: 'text' as const })),
    ...voiceJournals.map(v => ({ ...v, type: 'voice' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filtered = all
    .filter(j => filter === 'all' || j.type === filter)
    .filter(j => {
      if (!search) return true;
      const text = j.type === 'text' ? j.content : j.transcript || '';
      return text.toLowerCase().includes(search.toLowerCase());
    });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  // Trend data (submitted journals over last 14 days)
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d;
  });
  const trendData = last14.map(d => ({
    day: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    count: all.filter(j => new Date(j.created_at).toDateString() === d.toDateString()).length,
  }));

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const startWeekday = monthStart.getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
    const key = date.toDateString();
    const entries = all.filter(j => new Date(j.created_at).toDateString() === key);
    return {
      date,
      count: entries.length,
      hasText: entries.some(j => j.type === 'text'),
      hasVoice: entries.some(j => j.type === 'voice'),
      isToday: key === new Date().toDateString(),
    };
  });

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={800} color="text.primary">
          Journal History
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          All your submitted journals and voice recordings
        </Typography>
      </Box>

      {/* Trend Chart */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} mb={2}>14-Day Journal Activity</Typography>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="journalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00BCD4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00BCD4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} interval={2} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} width={20} />
              <Tooltip contentStyle={{ background: '#112240', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#00BCD4" fill="url(#journalGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
        <TextField
          id="history-search"
          placeholder="Search journals…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          size="small"
          sx={{ minWidth: 260, flex: 1 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>
          }}
        />
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_e, v) => { if (v) { setFilter(v); setPage(1); } }}
          size="small"
        >
          <ToggleButton value="all" sx={{ px: 2, borderRadius: '8px !important', mr: 0.5 }}>All</ToggleButton>
          <ToggleButton value="text" sx={{ px: 2, borderRadius: '8px !important', mr: 0.5 }}>
            <Article fontSize="small" sx={{ mr: 0.5 }} /> Text
          </ToggleButton>
          <ToggleButton value="voice" sx={{ px: 2, borderRadius: '8px !important' }}>
            <Mic fontSize="small" sx={{ mr: 0.5 }} /> Voice
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Summary */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {[
          { label: 'Total Journals', value: all.length, color: '#00BCD4' },
          { label: 'Text Journals', value: submittedText.length, color: '#7C3AED' },
          { label: 'Voice Journals', value: voiceJournals.length, color: '#F97316' },
        ].map(s => (
          <Box
            key={s.label}
            sx={{
              flex: 1,
              minWidth: 120,
              p: 2,
              borderRadius: 2,
              background: `${s.color}12`,
              border: `1px solid ${s.color}30`,
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" fontWeight={800} color={s.color}>{loading ? '—' : s.value}</Typography>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Monthly Journal Calendar */}
      <Card sx={{ mb: 3, borderRadius: 3, background: 'rgba(17, 25, 40, 0.7)' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={700} mb={0.5}>Journal Calendar</Typography>
              <Typography variant="body2" color="text.secondary">
                {today.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Chip label="Text" size="small" sx={{ bgcolor: '#7C3AED22', color: '#7C3AED' }} />
              <Chip label="Voice" size="small" sx={{ bgcolor: '#00BCD422', color: '#00BCD4' }} />
            </Box>
          </Box>
          <Box display="grid" gridTemplateColumns="repeat(7, minmax(0, 1fr))" gap={1}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Typography key={day} variant="caption" color="text.secondary" textAlign="center">
                {day}
              </Typography>
            ))}
            {Array.from({ length: startWeekday }).map((_, idx) => (
              <Box key={`blank-${idx}`} sx={{ height: 72 }} />
            ))}
            {days.map(day => (
              <Box
                key={day.date.toISOString()}
                sx={{
                  minHeight: 72,
                  borderRadius: 2,
                  p: 1,
                  border: day.isToday ? '1px solid #00BCD4' : '1px solid rgba(255,255,255,0.08)',
                  background: day.isToday ? 'rgba(0,188,212,0.08)' : 'rgba(255,255,255,0.03)',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color={day.isToday ? '#00BCD4' : 'text.secondary'} fontWeight={day.isToday ? 700 : 600}>
                    {day.date.getDate()}
                  </Typography>
                  {day.count > 0 && (
                    <Chip
                      label={day.count}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.08)', color: 'text.primary' }}
                    />
                  )}
                </Box>
                <Box display="flex" gap={0.5} flexWrap="wrap">
                  {day.hasText && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#7C3AED' }} />}
                  {day.hasVoice && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#00BCD4' }} />}
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        [1, 2, 3, 4].map(i => (
          <Skeleton key={i} height={90} sx={{ mb: 1.5, borderRadius: 2 }} />
        ))
      ) : paginated.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {search ? 'No journals match your search.' : 'No journals found. Start journaling!'}
        </Alert>
      ) : (
        paginated.map(journal => (
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
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                <Box display="flex" gap={1.5} flex={1} minWidth={0}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: journal.type === 'text' ? 'rgba(124,58,237,0.15)' : 'rgba(0,188,212,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {journal.type === 'text'
                      ? <Article sx={{ color: '#7C3AED', fontSize: 20 }} />
                      : <Mic sx={{ color: '#00BCD4', fontSize: 20 }} />
                    }
                  </Box>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
                      {journal.type === 'text'
                        ? truncate(journal.content, 150)
                        : truncate(journal.transcript || 'Voice journal — transcript available', 150)
                      }
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <CalendarToday sx={{ fontSize: 13, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(journal.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box display="flex" flexDirection="column" gap={0.5} alignItems="flex-end" flexShrink={0}>
                  <Chip
                    label={journal.type === 'text' ? 'Text' : 'Voice'}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.65rem', height: 20 }}
                  />
                  {journal.type === 'text' && journal.emotion_result?.emotion && (
                    <Chip
                      label={journal.emotion_result.emotion}
                      size="small"
                      sx={{
                        background: `${getEmotionColor(journal.emotion_result.emotion)}20`,
                        color: getEmotionColor(journal.emotion_result.emotion),
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 20,
                      }}
                    />
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_e, p) => setPage(p)}
            color="primary"
            sx={{
              '& .MuiPaginationItem-root': { borderRadius: 2 },
              '& .Mui-selected': { background: 'linear-gradient(135deg, #00BCD4, #7C3AED) !important', color: '#fff' },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default JournalHistoryPage;
