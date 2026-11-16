# MindCare — AI Mental Health Monitoring System

<div align="center">

![MindCare Banner](docs/banner.png)

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111%2B-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.9%2B-EE4C2C?style=for-the-badge&logo=pytorch)](https://pytorch.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**A multimodal, AI-driven mental health assessment platform that fuses text and speech emotion signals to deliver real-time clinical risk stratification.**

</div>

---

## 📌 Table of Contents

1. [Problem Statement & Motivation](#-problem-statement--motivation)
2. [Abstract](#-abstract)
3. [System Architecture](#-system-architecture)
4. [Technologies Used](#-technologies-used)
5. [Implementation](#-implementation)
6. [Installation Guide](#-installation-guide)
7. [Results](#-results)
8. [Future Enhancements](#-future-enhancements)

---

## 🧠 Problem Statement & Motivation

Mental health disorders—including depression, anxiety, and suicidal ideation—affect **1 in 4 people** globally (WHO, 2023), yet fewer than **50 %** receive timely clinical attention due to:

- **Stigma** that prevents self-reporting.
- **Clinician shortage** (< 1 psychiatrist per 10,000 people in developing nations).
- **Delayed diagnosis** because current tools rely almost entirely on subjective self-assessments.

Existing mental health apps offer only questionnaires or generic chatbots that cannot detect nuanced emotional cues embedded in natural language or voice.  
**MindCare** addresses this gap by providing an objective, non-invasive, multimodal assessment engine that combines cutting-edge NLP and speech-processing models with a clinically inspired risk stratification framework.

---

## 📄 Abstract

MindCare is a full-stack AI platform for real-time mental health monitoring. It captures two distinct emotional modalities:

| Modality | Model | Purpose |
|----------|-------|---------|
| **Text** | Fine-tuned DistilBERT (GoEmotions) | Multi-label emotion classification from journal entries |
| **Speech** | Wav2Vec2 + OpenAI Whisper | Speech emotion recognition + automatic transcription |

The dual-modality outputs are merged by the **Adaptive Confidence-Guided Fusion (ACGF)** algorithm, which dynamically weights each modality based on inference confidence. The fused emotion is then scored by the **Mental Health Trajectory Index (MHTI)** and triaged by the **Clinical Priority Assessment (CPA)** engine, producing actionable clinical recommendations for psychologists.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT  (React + MUI)                         │
│  Journal Entry  │  Voice Recorder  │  Dashboard  │  Psychologist UI  │
└──────────┬──────────────────────────────────────────────────────────┘
           │  REST API (HTTPS)
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    BACKEND  (FastAPI + Python)                        │
│                                                                       │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────────────┐   │
│  │   Auth /     │   │  Journals /  │   │   Reports /            │   │
│  │   Users      │   │  Voice       │   │   Psychologist         │   │
│  └──────────────┘   └──────────────┘   └────────────────────────┘   │
│           │                  │                      │                 │
│           └──────────────────┴──────────────────────┘                │
│                              │                                        │
│                    ┌─────────▼──────────┐                            │
│                    │    AI  Pipeline     │                            │
│                    │                     │                            │
│  ┌─────────────────┼─────────────────┐  │                            │
│  │  Text Emotion   │  Speech Emotion  │  │                            │
│  │  (DistilBERT)   │  (Wav2Vec2 +    │  │                            │
│  │  GoEmotions     │   Whisper)       │  │                            │
│  └────────┬────────┴────────┬─────────┘  │                            │
│           └────────┬────────┘            │                            │
│                    ▼                      │                            │
│          ┌──────────────────┐            │                            │
│          │  ACGF  (Fusion)  │            │                            │
│          └────────┬─────────┘            │                            │
│                   ▼                       │                            │
│          ┌──────────────────┐            │                            │
│          │  MHTI  (Scorer)  │            │                            │
│          └────────┬─────────┘            │                            │
│                   ▼                       │                            │
│          ┌──────────────────┐            │                            │
│          │  CPA (Triage)    │            │                            │
│          └────────┬─────────┘            │                            │
│                   │                      │                            │
└───────────────────┼──────────────────────┘                            │
                    ▼
         ┌────────────────────┐
         │   MongoDB Atlas    │
         │  (Users, Journals, │
         │   Reports, Notifs) │
         └────────────────────┘
```

> Full architecture diagram: [`research/architecture/`](research/architecture/)

---

## 🛠️ Technologies Used

### Backend
| Technology | Version | Role |
|-----------|---------|------|
| Python | 3.10+ | Core runtime |
| FastAPI | 0.111+ | REST API framework |
| Uvicorn | 0.30+ | ASGI server |
| MongoDB Atlas | — | Cloud database |
| Motor | 3.4+ | Async MongoDB driver |
| PyTorch | 2.9+ | Deep learning runtime |
| HuggingFace Transformers | 4.41+ | DistilBERT & Wav2Vec2 |
| OpenAI Whisper | 20231117 | Speech-to-text |
| Librosa | 0.10+ | Audio feature extraction |
| ReportLab | 4.2+ | PDF report generation |

### Frontend
| Technology | Version | Role |
|-----------|---------|------|
| React | 18.3 | UI framework |
| TypeScript | 5.2 | Type-safe JavaScript |
| Vite | 5.3 | Build tool |
| MUI (Material UI) | 5.15 | Component library |
| React Router | 6.24 | Client-side routing |
| Axios | 1.7 | HTTP client |
| Recharts | 2.12 | Data visualisation |
| jsPDF + html2canvas | — | Client-side PDF export |

### AI Models
| Model | Dataset | Task |
|-------|---------|------|
| DistilBERT (fine-tuned) | GoEmotions (58k samples) | Multi-label text emotion (28 classes) |
| Wav2Vec2-base | RAVDESS / CREMA-D | Speech emotion recognition (8 classes) |
| OpenAI Whisper (base) | Multilingual | Automatic speech transcription |

---

## 🔧 Implementation

### Directory Structure
```
Mental-Health-Monitoring/
│
├── README.md
├── requirements.txt
├── LICENSE
│
├── frontend/               # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── pages/          # Login, Dashboard, Journal, Voice, Reports
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth & global state
│   │   ├── api/            # Axios service layer
│   │   ├── theme/          # MUI custom theme
│   │   └── types/          # TypeScript type definitions
│   ├── index.html
│   └── vite.config.ts
│
├── backend/                # FastAPI application
│   ├── main.py             # App entry point, lifespan, CORS
│   ├── requirements.txt    # Python dependencies
│   └── app/
│       ├── core/           # Config, DB connection, security, deps
│       ├── routers/        # auth, users, journals, voice, reports,
│       │                   # psychologist, notifications
│       ├── models/         # Pydantic request/response schemas
│       ├── services/       # AI pipeline, voice pipeline, fusion,
│       │                   # MHTI, CPA, report generation
│       └── ai_models/      # DistilBERT model loader
│
├── models/
│   ├── text_emotion/       # Fine-tuned DistilBERT weights
│   └── speech_emotion/     # Wav2Vec2 fine-tuned weights
│
├── research/
│   ├── architecture/       # System architecture diagrams
│   └── methodology/        # Research methodology notes
│
├── results/                # Evaluation metrics and analysis
├── screenshots/            # Application UI screenshots
├── notebooks/              # Jupyter notebooks for training
│   ├── distilbert-model.ipynb
│   ├── voice-model-notebook.ipynb
│   └── workflow-fusionofmodels.ipynb
└── docs/                   # Extended documentation
```

### Key Modules

#### 1. Text Emotion Pipeline (`backend/app/services/ai_pipeline.py`)
- Loads the fine-tuned **DistilBERT** model from `app/ai_models/distilbert/`.
- Tokenises journal text using the DistilBERT tokenizer.
- Runs multi-label inference and returns top-1 emotion with confidence score.

#### 2. Voice / Speech Pipeline (`backend/app/services/voice_pipeline.py`)
- Accepts an audio upload (WAV / M4A / MP3).
- Transcribes speech with **OpenAI Whisper** (base model).
- Extracts MFCC + spectrogram features with **Librosa**.
- Classifies speech emotion using **Wav2Vec2** fine-tuned on RAVDESS/CREMA-D.

#### 3. Adaptive Confidence-Guided Fusion — ACGF (`backend/app/services/fusion.py`)
- Receives `(text_emotion, text_confidence)` and `(speech_emotion, speech_confidence)`.
- Chooses the dominant modality when confidence gap > 0.2; otherwise blends via weighted vote.
- Outputs a single `final_emotion` and `fusion_confidence`.

#### 4. Mental Health Trajectory Index — MHTI (`backend/app/services/mhti.py`)
- Maps the fused emotion to a clinical severity score (0–10).
- Computes MHTI score (0–100) normalised to a risk scale.
- Outputs: `severity_score`, `mhti_score`, `risk_level` (Low / Moderate / High / Critical).

#### 5. Clinical Priority Assessment — CPA (`backend/app/services/cpa.py`)
- Applies rule-based clinical triage on the MHTI output.
- Assigns one of four priority levels (P1–P4) with monitoring frequency and recommendation text.

#### 6. API Routers (`backend/app/routers/`)
| Router | Endpoints | Description |
|--------|-----------|-------------|
| `auth.py` | POST `/auth/register`, `/auth/login` | JWT-based authentication |
| `journals.py` | CRUD `/journals/` | Journal entry management + AI analysis |
| `voice.py` | POST `/voice/analyze` | Audio upload + speech-emotion analysis |
| `reports.py` | GET `/reports/` | PDF report generation |
| `users.py` | GET/PUT `/users/me` | User profile management |
| `psychologist.py` | GET `/psychologist/patients` | Patient dashboard for clinicians |
| `notifications.py` | GET `/notifications/` | Real-time alert system |

---

## 🚀 Installation Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/NGayathri2003/Mental-Health-Monitoring.git
cd Mental-Health-Monitoring
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Configure environment variables
```bash
cp .env.example .env
```
Edit `.env`:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/mindcare
SECRET_KEY=<your-jwt-secret-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
```

#### Download AI Models
The DistilBERT model (~247 MB) is not included in the repository due to size constraints. Download from the HuggingFace Hub or use our fine-tuned weights:

```bash
python setup_model.py
```

#### Run the backend
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
API docs available at: **http://localhost:8000/docs**

---

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```
App available at: **http://localhost:5173**

---

### 4. Seed the Database (Optional)
```bash
cd backend
python seed_db.py
```

---

## 📊 Results

### Text Emotion Model (DistilBERT — GoEmotions)

| Metric | Value |
|--------|-------|
| **Micro F1** | **0.5473** |
| **Macro F1** | **0.5041** |
| Precision | 0.5267 |
| Recall | 0.5696 |
| Hamming Loss | 0.0392 |
| Subset Accuracy | 0.3788 |
| Best Threshold | 0.85 |
| Test Loss | 1.178 |

> *Evaluated on the held-out GoEmotions test set (28 emotion classes, multi-label setting).*

### End-to-End Clinical Pipeline — Sample Output

```json
{
  "Speech Emotion":  { "Emotion": "sad",     "Confidence": 0.6478 },
  "Text Emotion":    { "Emotion": "sadness", "Confidence": 0.9958 },
  "ACGF": {
    "dominant_modality": "Text",
    "final_emotion":     "sadness",
    "fusion_confidence": 0.9958
  },
  "MHTI": {
    "Severity Score": 9,
    "MHTI Score":     90.0,
    "Risk Level":     "Critical"
  },
  "CPA": {
    "Clinical Priority": "Priority 1 - Immediate Psychological Intervention",
    "Monitoring Frequency": "Continuous Monitoring",
    "Recommendation": "Immediate clinical assessment recommended. Notify psychologist and initiate crisis intervention if required."
  }
}
```

> See [`results/`](results/) for full evaluation metrics and analysis reports.

---

## 🔮 Future Enhancements

| Enhancement | Description | Priority |
|------------|-------------|----------|
| **Longitudinal Tracking** | Time-series MHTI visualisation to track patient progress over weeks/months | High |
| **Large Language Model Integration** | Use GPT-4 / Gemini for empathetic conversational therapy support | High |
| **Mobile App** | React Native companion app for on-the-go journalling and voice analysis | Medium |
| **Multilingual Support** | Extend Whisper + DistilBERT pipeline to support Hindi, Tamil, and other regional languages | Medium |
| **EHR Integration** | HL7 FHIR API integration for hospital electronic health record systems | Medium |
| **Federated Learning** | Privacy-preserving model fine-tuning across hospitals without sharing raw data | High |
| **Wearable Data Fusion** | Incorporate heart-rate variability and sleep data from wearables | Low |
| **Explainability (XAI)** | SHAP / LIME explanations for model predictions shown to clinicians | High |
| **Real-time Voice Streaming** | WebSocket-based live speech emotion detection (< 2 s latency) | Medium |
| **DSM-5 Mapping** | Automatic mapping of MHTI risk levels to DSM-5 diagnostic criteria | High |

---

## 👥 Authors

| Name | Role |
|------|------|
| N. Gayathri | AI/ML Engineering, Backend, Frontend |

---

## 📚 References

Key references are stored as PDFs in the research bibliography. Major citations include:
- Saravia et al., *GoEmotions: A Dataset of Fine-Grained Emotions* (2020)
- Baevski et al., *Wav2Vec 2.0: A Framework for Self-Supervised Learning* (2020)
- Radford et al., *Robust Speech Recognition via Large-Scale Weak Supervision* (Whisper, 2022)
- WHO World Mental Health Report (2022)

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.
