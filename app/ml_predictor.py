

"""Machine-learning prediction support for PhishSight."""

from pathlib import Path
from typing import Any

import joblib


PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "models" / "phishsight_char_model.joblib"

LABELS = {
    0: "phishing",
    1: "legitimate",
}

model: Any = None
MODEL_LOAD_ERROR: str | None = None

try:
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

    model = joblib.load(MODEL_PATH)

    if not hasattr(model, "predict") or not hasattr(model, "decision_function"):
        raise TypeError("Loaded model does not support the expected prediction API.")

    if set(model.classes_) != {0, 1}:
        raise ValueError("Model must use classes 0 = phishing and 1 = legitimate.")

except Exception as error:
    model = None
    MODEL_LOAD_ERROR = f"{type(error).__name__}: {error}"


def is_model_loaded() -> bool:
    """Return whether the trained model loaded successfully."""
    return model is not None


def predict_url(url: str) -> dict[str, Any]:
    """Predict a URL class. The decision score is not a probability."""
    if model is None:
        raise RuntimeError("The machine-learning model is unavailable.")

    if not isinstance(url, str) or not url.strip():
        raise ValueError("URL must be a non-empty string.")

    normalized_url = url.strip().lower()

    predicted_label = int(model.predict([normalized_url])[0])
    decision_score = float(model.decision_function([normalized_url])[0])

    return {
        "model": "character_ngram_linear_svc",
        "predicted_label": predicted_label,
        "prediction": LABELS[predicted_label],
        "decision_score": round(decision_score, 6),
        "score_note": (
            "This is a decision score, not a probability. "
            "Positive scores favor legitimate; negative scores favor phishing."
        ),
    }
