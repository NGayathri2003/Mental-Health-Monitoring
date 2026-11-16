# Experimental Results

This directory contains all evaluation metrics, model outputs, and analysis results.

## Text Emotion Model — DistilBERT (GoEmotions)

### Quantitative Results

| Metric | Value |
|--------|-------|
| **Micro F1** | **0.5473** |
| **Macro F1** | **0.5041** |
| Precision | 0.5267 |
| Recall | 0.5696 |
| Hamming Loss | 0.0392 |
| Subset Accuracy | 0.3788 |
| Best Decision Threshold | 0.85 |
| Test Loss | 1.178 |

> *Evaluated on the held-out GoEmotions test split (28 emotion classes, multi-label)*

### Interpretation
- **Micro F1 of 0.547** is competitive with published baselines on the challenging 28-class GoEmotions benchmark.
- **Hamming Loss of 0.039** (< 4 %) confirms the model correctly suppresses false positive labels for most samples.
- The high decision threshold (0.85) was chosen to maximise precision in a clinical context — false positives are more harmful than missed positives.

---

## End-to-End Pipeline — Sample Clinical Output

```json
{
  "Transcript": "I feel really very bad, I don't want to speak to anyone, I want to be alone. I just want to end my life.",
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
    "Clinical Priority":    "Priority 1 — Immediate Psychological Intervention",
    "Monitoring Frequency": "Continuous Monitoring",
    "Recommendation":       "Immediate clinical assessment recommended. Notify psychologist and initiate crisis intervention if required."
  }
}
```

---

## Files in this Directory

| File | Description |
|------|-------------|
| `evaluation_metrics.csv` | Full metrics table (CSV format) |
| `evaluation_metrics.json` | Full metrics (JSON format) |
| `final_mental_health_report.json` | Sample end-to-end pipeline output |
| `voice_analysis_results.json` | Sample speech analysis output |
