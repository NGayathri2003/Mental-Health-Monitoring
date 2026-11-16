# System Architecture

This directory contains system architecture diagrams for the MindCare AI Mental Health Monitoring System.

## Architecture Overview

The system uses a layered architecture:

```
Client (React SPA)
       │
       ▼
FastAPI REST Backend
       │
       ├── Auth / Users / Journals / Voice / Reports
       │
       ▼
AI Pipeline
  ├── Text Emotion  → DistilBERT (GoEmotions, 28 classes)
  ├── Speech Emotion → Wav2Vec2 + OpenAI Whisper
  └── Fusion         → ACGF → MHTI → CPA
       │
       ▼
MongoDB Atlas (Cloud Database)
```

## Diagrams

| File | Description |
|------|-------------|
| `system_overview.png` | High-level system architecture |
| `ai_pipeline.png` | Detailed AI model pipeline |
| `database_schema.png` | MongoDB collection schemas |
| `api_flow.png` | REST API request/response flow |

## AI Pipeline Detail

```
Audio Input ──► Whisper (Transcription) ──► DistilBERT
                                              (Text Emotion)
                                                    │
Audio Input ──► Librosa (Feature Extraction)        │
                    │                               │
                    ▼                               ▼
              Wav2Vec2 ──────────────────► ACGF Fusion
              (Speech Emotion)                      │
                                                    ▼
                                              MHTI Score
                                                    │
                                                    ▼
                                          CPA (Clinical Triage)
```
