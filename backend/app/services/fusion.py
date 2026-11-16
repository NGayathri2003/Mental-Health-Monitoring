"""
Adaptive Confidence-Guided Fusion (ACGF)
==========================================
Merges speech (Wav2Vec2) and text (DistilBERT) emotion predictions
by selecting the modality with the higher confidence score.

When the confidences are very close (< 5% gap), we further weight
the text modality slightly higher because DistilBERT operates on
semantic content, which is generally more reliable for clinical use.
"""

from __future__ import annotations

MODALITY_PREFERENCE_MARGIN = 0.05  # text wins ties within this margin


def run_acgf(
    speech_predictions: list[dict],
    text_predictions: list[dict],
) -> dict | None:
    """
    Fuse speech and text emotion predictions.

    Args:
        speech_predictions: list of {label: str, score: float}  (Wav2Vec2 output)
        text_predictions:   list of {emotion: str, confidence: float} (DistilBERT output)

    Returns:
        Fusion result dict, or None if either input is empty.
    """
    if not speech_predictions or not text_predictions:
        return None

    # Best from each modality
    speech_top = max(speech_predictions, key=lambda x: x.get("score", x.get("confidence", 0)))
    text_top   = max(text_predictions,   key=lambda x: x.get("confidence", x.get("score", 0)))

    speech_label = speech_top.get("label",      speech_top.get("emotion", "neutral"))
    speech_conf  = float(speech_top.get("score", speech_top.get("confidence", 0.0)))
    text_label   = text_top.get("emotion",      text_top.get("label", "neutral"))
    text_conf    = float(text_top.get("confidence", text_top.get("score", 0.0)))

    # ACGF decision: text wins ties within MODALITY_PREFERENCE_MARGIN
    if text_conf >= (speech_conf - MODALITY_PREFERENCE_MARGIN):
        final_emotion     = text_label
        final_confidence  = text_conf
        dominant_modality = "Text"
    else:
        final_emotion     = speech_label
        final_confidence  = speech_conf
        dominant_modality = "Speech"

    return {
        "speech_emotion":    speech_label,
        "speech_confidence": round(speech_conf, 4),
        "text_emotion":      text_label,
        "text_confidence":   round(text_conf, 4),
        "dominant_modality": dominant_modality,
        "final_emotion":     final_emotion,
        "fusion_confidence": round(final_confidence, 4),
    }
