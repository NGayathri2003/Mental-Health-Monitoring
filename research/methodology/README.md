# Research Methodology

## Overview

MindCare employs a **multimodal emotion recognition** methodology that combines NLP and speech processing.

## 1. Text Emotion Recognition

### Model: DistilBERT (Fine-tuned)
- **Base Model**: `distilbert-base-uncased`
- **Dataset**: GoEmotions (58,009 carefully curated Reddit comments, 28 emotion classes)
- **Task**: Multi-label emotion classification
- **Threshold**: 0.85 (optimised on validation set)

### Training Details
| Parameter | Value |
|-----------|-------|
| Epochs | 10 |
| Batch Size | 32 |
| Learning Rate | 2e-5 |
| Optimizer | AdamW |
| Loss | Binary Cross-Entropy |
| Max Sequence Length | 128 tokens |

### Emotion Classes (28)
admiration, amusement, anger, annoyance, approval, caring, confusion, curiosity, desire, disappointment, disapproval, disgust, embarrassment, excitement, fear, gratitude, grief, joy, love, nervousness, optimism, pride, realisation, relief, remorse, sadness, surprise, neutral

---

## 2. Speech Emotion Recognition

### Pipeline
1. **Audio Preprocessing**: Resample to 16 kHz mono, normalise amplitude
2. **Transcription**: OpenAI Whisper (base) for speech-to-text
3. **Feature Extraction**: Wav2Vec2 feature extractor (1D CNN + transformer)
4. **Classification**: Fine-tuned classification head on RAVDESS / CREMA-D

### Speech Emotion Classes (8)
neutral, calm, happy, sad, angry, fearful, disgust, surprised

---

## 3. Adaptive Confidence-Guided Fusion (ACGF)

Novel fusion algorithm developed for this project:

```python
def fuse(text_emotion, text_conf, speech_emotion, speech_conf):
    if abs(text_conf - speech_conf) > 0.2:
        # Trust the more confident modality
        return argmax(text_conf, speech_conf)
    else:
        # Weighted average when confidence is similar
        return weighted_vote(text_emotion, text_conf,
                             speech_emotion, speech_conf)
```

---

## 4. Mental Health Trajectory Index (MHTI)

Severity mapping (emotion → clinical score):

| Emotion | Severity (0–10) | Risk Level |
|---------|----------------|------------|
| joy, amusement | 0–2 | Low |
| neutral, calm | 2–3 | Low |
| surprise, confusion | 3–4 | Low |
| anger, annoyance | 4–6 | Moderate |
| fear, nervousness | 5–7 | Moderate–High |
| sadness, grief | 7–9 | High |
| disgust + suicidal cues | 9–10 | Critical |

MHTI Score = (severity / 10) × 100

---

## 5. Clinical Priority Assessment (CPA)

| Priority | MHTI Range | Action |
|----------|-----------|--------|
| P4 – Routine | 0–25 | Weekly check-in |
| P3 – Elevated | 25–50 | Bi-weekly session |
| P2 – Urgent | 50–75 | Immediate session within 48h |
| P1 – Critical | 75–100 | Crisis intervention, continuous monitoring |
