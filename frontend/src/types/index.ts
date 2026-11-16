export interface User { id: string; name: string; email: string; role: 'user' | 'psychologist'; dob?: string; gender?: string; phone?: string; }
export interface AuthState { user: User | null; token: string | null; isLoading: boolean; }
export interface TextJournal { id: string; content: string; is_draft: boolean; submitted: boolean; created_at: string; updated_at: string; emotion_result?: any; }
export interface VoiceJournal { id: string; transcript: string; audio_url?: string; created_at: string; report_id: string; }
export interface EmotionPrediction { emotion: string; confidence: number; }
export interface SpeechPrediction { label: string; score: number; }
export interface ACGFResult { speech_emotion: string; speech_confidence: number; text_emotion: string; text_confidence: number; dominant_modality: string; final_emotion: string; fusion_confidence: number; }
export interface MHTIResult { final_emotion: string; severity_score: number; mhti_score: number; risk_level: 'Critical' | 'High' | 'Moderate' | 'Low'; }
export interface CPAResult { clinical_priority: string; monitoring_frequency: string; recommendation: string; }
export interface FinalReport { id: string; user_id: string; journal_id: string; journal_type: string; transcript: string; speech_emotion: SpeechPrediction; text_emotion: EmotionPrediction; acgf: ACGFResult; mhti: MHTIResult; cpa: CPAResult; created_at: string; }
export interface Patient { id: string; name: string; email: string; dob?: string; gender?: string; phone?: string; latest_emotion?: string; latest_risk?: string; last_journal_date?: string; journal_count: number; }
export interface DashboardStats { total_patients: number; active_today: number; critical: number; high: number; moderate: number; low: number; }
export interface Notification { id: string; message: string; frequency: string; scheduled_date?: string; read: boolean; created_at: string; }
