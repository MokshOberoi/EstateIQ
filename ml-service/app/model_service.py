import os
import joblib
from typing import Dict
from .schemas import PredictRequest, PredictResponse

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'lead_classifier.joblib')

def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
    return joblib.load(MODEL_PATH)

# Load model at import time (will raise if missing)
_model = None
try:
    _model = load_model()
    _model  # noqa: F401
except Exception as e:
    _model = None
    # The FastAPI app will handle missing model errors.

def predict(request: PredictRequest) -> PredictResponse:
    if _model is None:
        raise RuntimeError('ML model is not loaded')
    # Prepare feature vector in the order expected by the model
    features = [
        request.total_views,
        request.total_favourites,
        request.total_enquiries,
        request.total_dwell_time,
        request.total_engagement_score if hasattr(request, 'total_engagement_score') else request.engagement_score,
        request.recency_score,
        request.intent_score,
    ]
    # Predict class index and probabilities
    probs = _model.predict_proba([features])[0]
    class_idx = probs.argmax()
    classes = _model.classes_
    classification = classes[class_idx]
    confidence = probs[class_idx]
    probs_dict = {cls: prob for cls, prob in zip(classes, probs)}
    return PredictResponse(
        classification=classification,
        confidence=confidence,
        probabilities=probs_dict,
    )

