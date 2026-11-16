"""
DistilBERT Text Emotion Pipeline
==================================
Singleton that loads the fine-tuned GoEmotions DistilBERT model.
Model is lazy-loaded on the first call to predict_text_emotion()
so that the FastAPI server can start even if the model hasn't been
extracted yet (run setup_model.py first).
"""

from __future__ import annotations

import json
import logging
import os

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── GoEmotions 28-class label set (used as fallback if id2label.json missing) ─
GOEMOTION_LABELS: list[str] = [
    "admiration", "amusement", "anger", "annoyance", "approval", "caring",
    "confusion", "curiosity", "desire", "disappointment", "disapproval",
    "disgust", "embarrassment", "excitement", "fear", "gratitude", "grief",
    "joy", "love", "nervousness", "optimism", "pride", "realization",
    "relief", "remorse", "sadness", "surprise", "neutral",
]

# Confidence threshold for multi-label classification
THRESHOLD = 0.30   # lower than 0.85 — 0.85 caused very few positives


class AIPipeline:
    """
    Thread-safe singleton wrapping the DistilBERT emotion classifier.
    """

    _instance: AIPipeline | None = None

    def __new__(cls) -> AIPipeline:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._ready = False
        return cls._instance

    # ── Lazy initialisation ───────────────────────────────────────────────────

    def _ensure_loaded(self) -> None:
        if self._ready:
            return

        model_path = settings.DISTILBERT_MODEL_PATH
        if not os.path.isdir(model_path):
            raise RuntimeError(
                f"DistilBERT model directory not found at '{model_path}'. "
                "Please run  python setup_model.py  from the backend directory."
            )

        logger.info(f"Loading DistilBERT model from '{model_path}' …")
        self.tokenizer   = AutoTokenizer.from_pretrained(model_path)
        self.text_model  = AutoModelForSequenceClassification.from_pretrained(model_path)
        self.text_model.eval()

        # Load label map
        id2label_path = os.path.join(model_path, "id2label.json")
        if os.path.exists(id2label_path):
            with open(id2label_path) as f:
                self.id2label: dict[str, str] = json.load(f)
            logger.info(f"Loaded {len(self.id2label)}-class label map from id2label.json")
        else:
            # Fall back to the standard 28-class GoEmotions set
            self.id2label = {str(i): label for i, label in enumerate(GOEMOTION_LABELS)}
            logger.warning(
                "id2label.json not found — using default 28-class GoEmotions label map."
            )

        self._ready = True
        logger.info("✅ DistilBERT model loaded and ready.")

    # ── Inference ─────────────────────────────────────────────────────────────

    def predict_text_emotion(self, text: str) -> list[dict]:
        """
        Run multi-label emotion classification on `text`.

        Returns a list of dicts, each with keys:
          - emotion   (str)
          - confidence (float, 0–1)

        Falls back to [{"emotion": "neutral", "confidence": 1.0}] if the
        model hasn't been extracted yet, so other parts of the app don't crash.
        """
        try:
            self._ensure_loaded()
        except RuntimeError as exc:
            logger.error(str(exc))
            return [{"emotion": "neutral", "confidence": 1.0}]

        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True,
        )
        with torch.no_grad():
            logits = self.text_model(**inputs).logits
            probs  = torch.sigmoid(logits)[0]

        results: list[dict] = []
        for idx, prob in enumerate(probs):
            p = float(prob)
            if p >= THRESHOLD:
                emotion = self.id2label.get(str(idx), f"label_{idx}")
                results.append({"emotion": emotion, "confidence": round(p, 4)})

        # If nothing clears the threshold, return the single most probable emotion
        if not results:
            top_idx  = int(probs.argmax())
            top_prob = float(probs[top_idx])
            emotion  = self.id2label.get(str(top_idx), f"label_{top_idx}")
            results  = [{"emotion": emotion, "confidence": round(top_prob, 4)}]

        return results


# ── Singleton export ──────────────────────────────────────────────────────────
ai_pipeline = AIPipeline()
