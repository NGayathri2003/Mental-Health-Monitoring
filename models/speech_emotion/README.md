# Speech Emotion Model — Wav2Vec2

This directory stores the fine-tuned Wav2Vec2 model weights for speech emotion recognition.

## Model Details

| Property | Value |
|----------|-------|
| Base model | `facebook/wav2vec2-base` |
| Fine-tuning dataset | RAVDESS + CREMA-D |
| Task | 8-class speech emotion classification |
| Input | 16 kHz mono audio |
| Output | Emotion label + confidence score |

## Emotion Classes
`neutral`, `calm`, `happy`, `sad`, `angry`, `fearful`, `disgust`, `surprised`

## Setup

Wav2Vec2 model is loaded on-demand via HuggingFace Transformers. The fine-tuned checkpoint is downloaded automatically when the backend starts.

```bash
# From backend directory:
python setup_model.py
```

## Training Notebooks

See [`../../notebooks/voice-model-notebook.ipynb`](../../notebooks/voice-model-notebook.ipynb) to reproduce training.
