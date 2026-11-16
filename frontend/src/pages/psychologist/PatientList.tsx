import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, TextField,
  InputAdornment, Select, MenuItem, FormControl, InputLabel, Avatar,
  Skeleton, Alert, Button, IconButton, Tooltip
} from '@mui/material';
import { Search, FilterList, ArrowForward, People, FiberManualRecord } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { formatDate, getRiskColor, getRiskBgColor, getEmotionColor } from '../../utils/helpers';

const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    client.get('/psychologist/patients')
      .then(r => setPatients(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients
    .filter(p => {
      const q = search.toLowerCase();
      return !q || p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q);
    })
    .filter(p => riskFilter === 'all' || p.risk_level === riskFilter)
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'risk') {
        const order = ['Critical', 'High', 'Moderate', 'Low', null];
        return order.indexOf(a.risk_level) - order.indexOf(b.risk_level);
      }
      return 0;
    });

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Patient List</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {patients.length} registered patients
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              id="patient-search"
              fullWidth
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Risk Level</InputLabel>
              <Select
                id="risk-filter"
                value={riskFilter}
                onChange={e => setRiskFilter(e.target.value)}
                label="Risk Level"
              >
                <MenuItem value="all">All Risks</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Moderate">Moderate</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                id="sort-by"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="risk">Risk Level</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={1}>
            <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
              {filtered.length} found
            </Typography>
          </Grid>
        </Grid>
      </Card>

      {/* Patient Cards */}
      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton height={180} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {search ? 'No patients match your search.' : 'No patients registered yet.'}
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(patient => (
            <Grid item xs={12} sm={6} md={4} key={patient.id}>
              <Card
                id={`patient-card-${patient.id}`}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${patient.risk_level ? getRiskColor(patient.risk_level) + '30' : 'rgba(255,255,255,0.07)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 40px ${patient.risk_level ? getRiskColor(patient.risk_level) + '20' : 'rgba(0,0,0,0.3)'}`,
                    border: `1px solid ${patient.risk_level ? getRiskColor(patient.risk_level) + '60' : 'rgba(0,188,212,0.3)'}`,
                  },
                }}
                onClick={() => navigate(`/psych/patients/${patient.id}`)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar
                        sx={{
                          width: 44,
                          height: 44,
                          background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                        }}
                      >
                        {getInitials(patient.name)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={700} color="text.primary">
                          {patient.name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {patient.email}
                        </Typography>
                      </Box>
                    </Box>
                    {patient.risk_level && (
                      <Chip
                        label={patient.risk_level}
                        size="small"
                        sx={{
                          background: getRiskBgColor(patient.risk_level),
                          color: getRiskColor(patient.risk_level),
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          border: `1px solid ${getRiskColor(patient.risk_level)}40`,
                        }}
                      />
                    )}
                  </Box>

                  <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                    {patient.gender && (
                      <Chip label={patient.gender} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                    )}
                    {patient.latest_emotion && (
                      <Chip
                        label={patient.latest_emotion}
                        size="small"
                        sx={{
                          background: `${getEmotionColor(patient.latest_emotion)}20`,
                          color: getEmotionColor(patient.latest_emotion),
                          fontSize: '0.65rem',
                          height: 20,
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {patient.latest_emotion ? 'Last assessed' : 'No assessment yet'}
                    </Typography>
                    <Button
                      size="small"
                      endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                      sx={{ fontSize: '0.7rem', textTransform: 'none', p: '2px 8px', borderRadius: 2 }}
                    >
                      View
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default PatientList;
