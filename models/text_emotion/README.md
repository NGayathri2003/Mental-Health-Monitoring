# Text Emotion Model — DistilBERT (GoEmotions)

This directory stores the fine-tuned DistilBERT model weights for multi-label text emotion classification.

## Model Details

| Property | Value |
|----------|-------|
| Base model | `distilbert-base-uncased` |
| Fine-tuning dataset | GoEmotions (58,009 samples) |
| Task | Multi-label classification (28 emotion classes) |
| Best threshold | 0.85 |
| Micro F1 | 0.5473 |
| Macro F1 | 0.5041 |
| Model size | ~247 MB |

## Setup

The model weights are **not committed to this repository** due to file size constraints.

### Download (Automated)
```bash
cd backend
python setup_model.py
```

### Manual Download
Download from HuggingFace Hub and place in `backend/app/ai_models/distilbert/`:
- `config.json`
- `pytorch_model.bin` (or `model.safetensors`)
- `tokenizer_config.json`
- `vocab.txt`
- `special_tokens_map.json`

## Training Notebooks

See [`../../notebooks/distilbert-model.ipynb`](../../notebooks/distilbert-model.ipynb) to reproduce training.
