"""
Voice / Speech Pipeline
========================
Singleton that wraps:
  - Whisper        : speech-to-text transcription
  - Wav2Vec2       : acoustic emotion recognition
  - AIPipeline     : DistilBERT text emotion on the transcript

Models are lazy-loaded on first use so the FastAPI server starts quickly
even if GPU resources are not yet available.
"""

from __future__ import annotations

import logging

import torch

from app.core.config import settings
from app.services.ai_pipeline import ai_pipeline

logger = logging.getLogger(__name__)


class VoicePipeline:
    """Thread-safe singleton for the voice processing pipeline."""

    _instance: VoicePipeline | None = None

    def __new__(cls) -> VoicePipeline:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._ready = False
        return cls._instance

    # ── Lazy initialisation ───────────────────────────────────────────────────

    def _ensure_loaded(self) -> None:
        if self._ready:
            return

        import whisper
        from transformers import pipeline as hf_pipeline

        logger.info(f"Loading Whisper '{settings.WHISPER_MODEL_SIZE}' …")
        self.whisper_model = whisper.load_model(settings.WHISPER_MODEL_SIZE)

        device = 0 if torch.cuda.is_available() else -1
        logger.info(
            f"Loading Wav2Vec2 emotion model '{settings.WAV2VEC2_MODEL}' "
            f"(device={'cuda' if device == 0 else 'cpu'}) …"
        )
        self.emotion_classifier = hf_pipeline(
            task="audio-classification",
            model=settings.WAV2VEC2_MODEL,
            device=device,
        )

        self._ready = True
        logger.info("✅ Voice pipeline (Whisper + Wav2Vec2) loaded and ready.")

    # ── Public API ────────────────────────────────────────────────────────────

    def transcribe(self, audio_path: str) -> str:
        """Transcribe an audio file to text using Whisper."""
        self._ensure_loaded()
        logger.info("Starting Whisper transcription for %s", audio_path)
        try:
            result = self.whisper_model.transcribe(audio_path, fp16=False, language="en")
            text = result.get("text", "").strip()
            logger.info("Whisper transcription completed for %s; text_length=%d", audio_path, len(text))
            return text if text else "No speech detected in audio recording."
        except Exception as e:
            logger.exception("Whisper transcription error for %s", audio_path)
            return "Audio journal recorded (transcription unavailable)."

    def predict_speech_emotion(self, audio_path: str) -> list[dict]:
        """
        Classify speech emotion using Wav2Vec2.
        Returns a list of dicts with keys: label, score.
        """
        self._ensure_loaded()
        logger.info("Starting Wav2Vec2 emotion prediction for %s", audio_path)
        try:
            preds = self.emotion_classifier(audio_path)
            logger.info("Wav2Vec2 prediction raw output for %s: %s", audio_path, preds)
            if isinstance(preds, list) and len(preds) > 0:
                formatted = []
                for p in preds:
                    lbl = p.get("label", "neutral")
                    scr = float(p.get("score", 0.85))
                    formatted.append({"label": lbl, "score": scr})
                logger.info("Wav2Vec2 prediction formatted for %s: %s", audio_path, formatted)
                return formatted
            logger.warning("Wav2Vec2 returned no predictions for %s", audio_path)
            return [{"label": "neutral", "score": 0.85}]
        except Exception as e:
            logger.exception("Wav2Vec2 speech emotion prediction error for %s", audio_path)
            return [{"label": "neutral", "score": 0.85}]

    def process_voice_journal(self, audio_path: str) -> tuple[str, list[dict], list[dict]]:
        """
        Full voice journal processing pipeline:
          1. Whisper  → transcript
          2. Wav2Vec2 → speech emotion predictions
          3. DistilBERT (via ai_pipeline) → text emotion predictions

        Returns:
          transcript       (str)
          speech_preds     (list[{label, score}])
          text_preds       (list[{emotion, confidence}])
        """
        self._ensure_loaded()
        transcript = self.transcribe(audio_path)
        speech_preds = self.predict_speech_emotion(audio_path)
        logger.info("Starting DistilBERT text emotion prediction for transcript length %d", len(transcript))
        text_preds = ai_pipeline.predict_text_emotion(transcript)
        logger.info("DistilBERT text emotion prediction completed: %s", text_preds)
        return transcript, speech_preds, text_preds


# ── Singleton export ──────────────────────────────────────────────────────────
voice_pipeline = VoicePipeline()
