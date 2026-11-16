def run_mhti(final_emotion: str):
    emotion_severity = {
        "grief": 10, "sadness": 9, "fear": 8, "fearful": 8, "remorse": 8,
        "disappointment": 7, "disgust": 7, "anger": 7, "nervousness": 6,
        "annoyance": 5, "confusion": 5, "embarrassment": 5, "realization": 4,
        "neutral": 3, "approval": 2, "curiosity": 2, "optimism": 2,
        "gratitude": 1, "joy": 1, "love": 1, "relief": 1, "admiration": 1,
        "amusement": 1, "caring": 1, "desire": 1, "excitement": 1, "pride": 1,
        "surprise": 2, "happy": 1, "calm": 1, "sad": 9
    }

    severity_score = emotion_severity.get(final_emotion.lower(), 5)
    mhti_score = round((severity_score / 10) * 100, 2)

    if mhti_score >= 80: risk = "Critical"
    elif mhti_score >= 60: risk = "High"
    elif mhti_score >= 40: risk = "Moderate"
    else: risk = "Low"

    mhti_result = {
        "final_emotion": final_emotion,
        "severity_score": severity_score,
        "mhti_score": mhti_score,
        "risk_level": risk
    }
    return mhti_result
