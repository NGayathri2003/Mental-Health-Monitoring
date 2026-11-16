import React, { useState, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Alert, CircularProgress,
  LinearProgress, Chip, Stepper, Step, StepLabel, Divider, Grid, Paper
} from '@mui/material';
import {
  Mic, Stop, Pause, PlayArrow, Delete, CloudUpload, CheckCircle,
  FiberManualRecord, Send, LocalHospital
} from '@mui/icons-material';
import client from '../../api/client';

type RecordState = 'idle' | 'recording' | 'paused' | 'stopped' | 'uploading' | 'done';

const steps = ['Record / Upload', 'Uploading Audio', 'Whisper Transcription', 'ACGF & AI Fusion', 'Clinical Assessment'];

const getRiskBadgeColor = (risk?: string) => {
  switch (risk) {
    case 'Critical': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: '#EF4444' };
    case 'High': return { bg: 'rgba(249, 115, 22, 0.15)', text: '#F97316', border: '#F97316' };
    case 'Moderate': return { bg: 'rgba(234, 179, 8, 0.15)', text: '#EAB308', border: '#EAB308' };
    case 'Low': return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E', border: '#22C55E' };
    default: return { bg: 'rgba(0, 188, 212, 0.15)', text: '#00BCD4', border: '#00BCD4' };
  }
};

const VoiceJournalPage: React.FC = () => {
  const [state, setState] = useState<RecordState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [stageText, setStageText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    setError('');
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        setState('stopped');
        clearInterval(timerRef.current!);
      };
      mr.start(200);
      mediaRecorderRef.current = mr;
      setState('recording');
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      setError('Microphone access denied. Please allow microphone permissions in your browser.');
    }
  };

  const pauseRecording = () => {
    mediaRecorderRef.current?.pause();
    setState('paused');
    clearInterval(timerRef.current!);
  };

  const resumeRecording = () => {
    mediaRecorderRef.current?.resume();
    setState('recording');
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current!);
  };

  const handlePlayback = () => {
    if (!audioUrl && !uploadFile) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl || (uploadFile ? URL.createObjectURL(uploadFile) : ''));
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setAudioBlob(null);
    setAudioUrl(URL.createObjectURL(file));
    setState('stopped');
    setError('');
  };

  const handleSubmit = async () => {
    if (!audioBlob && !uploadFile) return;
    setState('uploading');
    setActiveStep(1);
    setStageText('Uploading audio file to MindCare AI pipeline...');
    setError('');
    setSuccess('');

    const formData = new FormData();
    if (uploadFile) {
      formData.append('file', uploadFile);
    } else if (audioBlob) {
      formData.append('file', audioBlob, 'voice_journal.webm');
    }

    let stepInterval: ReturnType<typeof setInterval> | null = null;
    try {
      stepInterval = setInterval(() => {
        setActiveStep(prev => {
          if (prev === 1) {
            setStageText('Transcribing audio with Whisper AI...');
            return 2;
          } else if (prev === 2) {
            setStageText('Fusing Wav2Vec2 speech & DistilBERT text emotions (ACGF)...');
            return 3;
          } else if (prev === 3) {
            setStageText('Calculating MHTI Score & CPA clinical recommendation...');
            return 4;
          }
          return prev;
        });
      }, 2000);

      // CPU Whisper + Wav2Vec2 can exceed 90s for recordings over ~45s.
      const audioDurationSec = uploadFile
        ? null
        : recordingTime;
      const processingTimeoutMs = Math.max(
        600_000,
        ((audioDurationSec ?? 120) * 5_000) + 120_000,
      );

      const res = await client.post('/voice', formData, {
        timeout: processingTimeoutMs,
      });

      if (stepInterval) clearInterval(stepInterval);
      setActiveStep(4);
      setResult(res.data);
      setSuccess('Voice journal submitted successfully. Clinical assessment complete.');
      setState('done');
    } catch (e: any) {
      if (stepInterval) clearInterval(stepInterval);
      const isTimeout = e.code === 'ECONNABORTED' || e.message?.includes('timeout');
      const errorMsg = isTimeout
        ? 'Voice analysis is taking longer than expected on CPU. Please try a shorter recording (under 60 seconds) or try again — the server may still be processing.'
        : (e.response?.data?.detail || e.message || 'Voice processing failed. Please check network connection and try again.');
      setError(errorMsg);
      setSuccess('');
      setState('stopped');
      setActiveStep(0);
    }
  };

  const handleReset = () => {
    setState('idle');
    setAudioBlob(null);
    setAudioUrl(null);
    setUploadFile(null);
    setActiveStep(0);
    setStageText('');
    setResult(null);
    setError('');
    setSuccess('');
    setRecordingTime(0);
    setIsPlaying(false);
    audioRef.current = null;
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Box mb={3.5}>
        <Typography variant="h4" fontWeight={800} color="text.primary">
          Voice Journal
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Record or upload audio — Multi-modal AI analyzes tone, transcript, and clinical risk in real time
        </Typography>
      </Box>

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3, borderRadius: 3, background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 3, background: 'rgba(211, 47, 47, 0.15)', color: '#ff8a80', border: '1px solid rgba(211, 47, 47, 0.3)' }}
          onClose={() => setError('')}
          action={
            (audioBlob || uploadFile) ? (
              <Button color="inherit" size="small" onClick={handleSubmit} sx={{ fontWeight: 700 }}>
                Retry
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      )}

      {/* Pipeline Steps Indicator */}
      {state === 'uploading' && (
        <Card sx={{ mb: 3, borderRadius: 4, background: 'rgba(17, 25, 40, 0.75)', border: '1px solid rgba(0, 188, 212, 0.3)' }}>
          <CardContent sx={{ py: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
              {steps.map((label, index) => (
                <Step key={label} completed={index < activeStep}>
                  <StepLabel sx={{
                    '& .MuiStepLabel-label': { fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
                    '& .MuiStepIcon-root.Mui-active': { color: '#00BCD4' },
                    '& .MuiStepIcon-root.Mui-completed': { color: '#22C55E' },
                  }}>
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
            <Box mt={2}>
              <LinearProgress sx={{ borderRadius: 4, height: 6, background: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #00BCD4, #7C3AED)' } }} />
              <Typography variant="body2" color="#00BCD4" fontWeight={600} display="block" textAlign="center" mt={1.5}>
                ⚡ {stageText || 'AI models processing voice journal...'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Full AI Mental Health Assessment Report Result Display */}
      {state === 'done' && result && (
        <Box mb={4}>
          <Card sx={{ borderRadius: 4, border: '1px solid rgba(34,197,94,0.4)', background: 'linear-gradient(180deg, rgba(17, 25, 40, 0.9) 0%, rgba(10, 22, 40, 0.95) 100%)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              {/* Header Status */}
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '16px', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle sx={{ color: '#22C55E', fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={800} color="#fff">
                      Mental Health Assessment Complete
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.6)">
                      Multi-modal AI Pipeline (Whisper + Wav2Vec2 + DistilBERT + ACGF + MHTI + CPA)
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={`Risk: ${result.mhti?.risk_level || 'Evaluated'}`}
                  sx={{
                    background: getRiskBadgeColor(result.mhti?.risk_level).bg,
                    color: getRiskBadgeColor(result.mhti?.risk_level).text,
                    border: `1px solid ${getRiskBadgeColor(result.mhti?.risk_level).border}`,
                    fontWeight: 800,
                    px: 1,
                    py: 2,
                    fontSize: '0.85rem'
                  }}
                />
              </Box>

              <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

              {/* 1. Transcript */}
              <Box mb={3} p={2.5} sx={{ background: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography variant="caption" sx={{ color: '#00BCD4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }} display="block" mb={1}>
                  🎙️ Whisper Speech-to-Text Transcript
                </Typography>
                <Typography variant="body1" color="#fff" sx={{ lineHeight: 1.7, fontStyle: 'italic' }}>
                  "{result.transcript || 'No transcript generated.'}"
                </Typography>
              </Box>

              {/* Grid of Emotions & AI Scores */}
              <Grid container spacing={2.5} mb={3}>
                {/* 2. Semantic Emotion (DistilBERT) */}
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="caption" color="rgba(255,255,255,0.6)" fontWeight={600} display="block">
                      SEMANTIC EMOTION
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700} color="#00BCD4" mt={0.5} textTransform="capitalize">
                      {result.text_emotion?.emotion || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">
                      Confidence: {Math.round((result.text_emotion?.confidence || 0) * 100)}% (DistilBERT)
                    </Typography>
                  </Paper>
                </Grid>

                {/* 3. Acoustic Emotion (Wav2Vec2) */}
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="caption" color="rgba(255,255,255,0.6)" fontWeight={600} display="block">
                      ACOUSTIC EMOTION
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700} color="#7C3AED" mt={0.5} textTransform="capitalize">
                      {result.speech_emotion?.emotion || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">
                      Confidence: {Math.round((result.speech_emotion?.confidence || 0) * 100)}% (Wav2Vec2)
                    </Typography>
                  </Paper>
                </Grid>

                {/* 4. Final Emotion (ACGF) */}
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="caption" color="rgba(255,255,255,0.6)" fontWeight={600} display="block">
                      FINAL FUSED EMOTION
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700} color="#22C55E" mt={0.5} textTransform="capitalize">
                      {result.acgf?.final_emotion || result.text_emotion?.emotion || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">
                      Modality: {result.acgf?.dominant_modality || 'Text'} ACGF
                    </Typography>
                  </Paper>
                </Grid>

                {/* 5. MHTI Score */}
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="caption" color="rgba(255,255,255,0.6)" fontWeight={600} display="block">
                      MHTI SEVERITY SCORE
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={800} color="#F97316" mt={0.5}>
                      {result.mhti?.mhti_score || 0} / 100
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">
                      Severity Level: {result.mhti?.severity_score || 0}/10
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* 6. CPA Priority & Clinical Recommendation */}
              <Box p={2.5} mb={3} sx={{ background: 'rgba(124, 58, 237, 0.08)', borderRadius: 3, border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <LocalHospital sx={{ color: '#a78bfa', fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={700} color="#a78bfa">
                    CPA Clinical Priority & Recommendation
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={700} color="#fff" mb={0.5}>
                  {result.cpa?.clinical_priority || 'Priority Assessment Complete'}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.8)" sx={{ lineHeight: 1.6 }}>
                  {result.cpa?.recommendation || 'Regular monitoring recommended.'}
                </Typography>
                <Typography variant="caption" color="#00BCD4" fontWeight={600} display="block" mt={1}>
                  Recommended Monitoring: {result.cpa?.monitoring_frequency || 'Standard'}
                </Typography>
              </Box>

              <Button
                variant="contained"
                onClick={handleReset}
                sx={{
                  py: 1.2,
                  px: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
                  fontWeight: 700,
                  textTransform: 'none',
                }}
              >
                Record Another Voice Journal
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Voice Recorder Main Card */}
      {state !== 'done' && (
        <Card sx={{ borderRadius: 4, background: 'rgba(17, 25, 40, 0.75)', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h6" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1} color="#fff">
              <Mic sx={{ color: '#00BCD4' }} /> Voice Journal Recorder
            </Typography>

            {/* Recording Visualizer */}
            <Box
              sx={{
                height: 150,
                borderRadius: 4,
                background: 'rgba(0,0,0,0.3)',
                border: `2px solid ${state === 'recording' ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {state === 'recording' && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.3 },
                      '100%': { opacity: 1 },
                    },
                  }}
                />
              )}

              {state === 'idle' ? (
                <>
                  <Mic sx={{ fontSize: 56, color: 'rgba(255,255,255,0.3)', mb: 1 }} />
                  <Typography color="rgba(255,255,255,0.6)" variant="body2">
                    Press "Start Recording" or upload an audio file below
                  </Typography>
                </>
              ) : (
                <>
                  <FiberManualRecord
                    sx={{
                      color: state === 'recording' ? '#EF4444' : '#22C55E',
                      fontSize: 28,
                      mb: 1,
                      animation: state === 'recording' ? 'blink 1s step-end infinite' : 'none',
                      '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
                    }}
                  />
                  <Typography variant="h4" fontWeight={700} fontFamily="monospace" color="#fff">
                    {formatTime(recordingTime)}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.6)" mt={0.5}>
                    {state === 'recording' ? 'Recording live audio...' : state === 'paused' ? 'Paused' : 'Recording stopped'}
                  </Typography>
                  {uploadFile && (
                    <Typography variant="caption" color="#00BCD4" fontWeight={600} mt={0.5}>
                      Selected: {uploadFile.name}
                    </Typography>
                  )}
                </>
              )}
            </Box>

            {/* Controls */}
            <Box display="flex" justifyContent="center" gap={2} mb={3.5} flexWrap="wrap">
              {state === 'idle' && (
                <Button
                  id="start-record-btn"
                  variant="contained"
                  startIcon={<Mic />}
                  onClick={startRecording}
                  size="large"
                  sx={{
                    background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
                    borderRadius: 3,
                    fontWeight: 700,
                    px: 4,
                    py: 1.2,
                    textTransform: 'none',
                    '&:hover': { background: 'linear-gradient(135deg, #DC2626, #991B1B)' },
                  }}
                >
                  Start Recording
                </Button>
              )}

              {state === 'recording' && (
                <>
                  <Button
                    id="pause-record-btn"
                    variant="outlined"
                    startIcon={<Pause />}
                    onClick={pauseRecording}
                    sx={{ borderRadius: 3, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    Pause
                  </Button>
                  <Button
                    id="stop-record-btn"
                    variant="contained"
                    startIcon={<Stop />}
                    onClick={stopRecording}
                    color="error"
                    sx={{ borderRadius: 3, fontWeight: 700 }}
                  >
                    Stop
                  </Button>
                </>
              )}

              {state === 'paused' && (
                <>
                  <Button
                    id="resume-record-btn"
                    variant="outlined"
                    startIcon={<PlayArrow />}
                    onClick={resumeRecording}
                    sx={{ borderRadius: 3, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    Resume
                  </Button>
                  <Button
                    id="stop-paused-btn"
                    variant="contained"
                    startIcon={<Stop />}
                    onClick={stopRecording}
                    color="error"
                    sx={{ borderRadius: 3, fontWeight: 700 }}
                  >
                    Stop
                  </Button>
                </>
              )}

              {state === 'stopped' && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={isPlaying ? <Stop /> : <PlayArrow />}
                    onClick={handlePlayback}
                    sx={{ borderRadius: 3, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    {isPlaying ? 'Stop Playback' : 'Play Recording'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Delete />}
                    onClick={handleReset}
                    color="error"
                    sx={{ borderRadius: 3 }}
                  >
                    Discard
                  </Button>
                  <Button
                    id="submit-voice-btn"
                    variant="contained"
                    startIcon={<Send />}
                    onClick={handleSubmit}
                    sx={{
                      background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
                      borderRadius: 3,
                      fontWeight: 700,
                      px: 3,
                      textTransform: 'none',
                      boxShadow: '0 4px 15px rgba(0,188,212,0.4)',
                      '&:hover': { background: 'linear-gradient(135deg, #00ACC1, #6D28D9)' },
                    }}
                  >
                    Submit for AI Analysis
                  </Button>
                </>
              )}

              {state === 'uploading' && (
                <Button variant="contained" disabled sx={{ borderRadius: 3, py: 1.2, px: 4, background: 'rgba(255,255,255,0.1)' }}>
                  <CircularProgress size={22} color="inherit" sx={{ mr: 1.5 }} /> Processing AI Analysis...
                </Button>
              )}
            </Box>

            {/* Upload existing file fallback */}
            <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Chip label="OR UPLOAD AUDIO FILE" size="small" sx={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }} />
            </Divider>

            <Box textAlign="center">
              <Button
                id="upload-audio-btn"
                variant="outlined"
                component="label"
                disabled={state === 'uploading'}
                startIcon={<CloudUpload sx={{ color: '#00BCD4' }} />}
                sx={{ borderRadius: 3, color: '#fff', borderColor: 'rgba(255,255,255,0.2)', textTransform: 'none', py: 1, px: 3 }}
              >
                Choose Audio File
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={handleFileUpload}
                />
              </Button>
              <Typography variant="caption" color="rgba(255,255,255,0.5)" display="block" mt={1}>
                Supports MP3, WAV, WEBM, OGG, M4A
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default VoiceJournalPage;
