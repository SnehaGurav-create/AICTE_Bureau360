"""
Flask micro-service for complaint overlap prediction.
Called by the Node.js backend for ML-based overlap scoring.

Endpoints:
  POST /predict  — { text_a, text_b } → { is_overlap, probability, explanation }
  GET  /health   — health check
"""

import os
import pickle
import numpy as np
from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)

MODEL_DIR = os.environ.get("MODEL_DIR", "model/")
model = None
vectorizer = None


def load_model():
    """Load the trained model and vectorizer."""
    global model, vectorizer

    model_path = os.path.join(MODEL_DIR, "overlap_model.pkl")
    vectorizer_path = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")

    if not os.path.exists(model_path) or not os.path.exists(vectorizer_path):
        print(f"WARNING: Model files not found in {MODEL_DIR}. Predictions will return fallback.")
        return False

    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(vectorizer_path, "rb") as f:
        vectorizer = pickle.load(f)

    print(f"Model loaded from {MODEL_DIR}")
    return True


def preprocess(text):
    """Lowercase, strip, collapse whitespace."""
    if not isinstance(text, str):
        return ""
    return " ".join(text.lower().strip().split())


def predict_pair(text_a, text_b):
    """Run prediction for a single complaint pair."""
    if model is None or vectorizer is None:
        return {
            "is_overlap": False,
            "probability": 0.0,
            "explanation": "ML model not loaded — rule-based detection only",
        }

    a = preprocess(text_a)
    b = preprocess(text_b)
    combined = a + " " + b

    # Build features matching training pipeline
    tfidf_combined = vectorizer.transform([combined])
    tfidf_a = vectorizer.transform([a])
    tfidf_b = vectorizer.transform([b])

    # Cosine similarity
    cos_sim = (
        tfidf_a.multiply(tfidf_b).sum()
        / (
            max(np.sqrt(tfidf_a.multiply(tfidf_a).sum()), 1e-8)
            * max(np.sqrt(tfidf_b.multiply(tfidf_b).sum()), 1e-8)
        )
    )

    diff = abs(tfidf_a - tfidf_b)

    from scipy.sparse import hstack
    features = hstack([tfidf_combined, diff, np.array([[cos_sim]])])

    probability = float(model.predict_proba(features)[0, 1])
    is_overlap = probability >= 0.5

    # Generate explanation
    if is_overlap:
        if probability >= 0.9:
            explanation = f"Very high similarity ({probability:.0%}) — likely duplicate complaint"
        elif probability >= 0.7:
            explanation = f"High similarity ({probability:.0%}) — probable overlap in complaint content"
        else:
            explanation = f"Moderate similarity ({probability:.0%}) — possible overlap detected"
    else:
        explanation = f"Low similarity ({probability:.0%}) — unlikely to be related"

    return {
        "is_overlap": is_overlap,
        "probability": round(probability, 4),
        "explanation": explanation,
        "cosine_similarity": round(float(cos_sim), 4),
    }


@app.route("/predict", methods=["POST"])
def predict():
    """Predict overlap for a complaint pair."""
    data = request.get_json(force=True)

    text_a = data.get("text_a", "")
    text_b = data.get("text_b", "")

    if not text_a or not text_b:
        return jsonify({"error": "Both text_a and text_b are required"}), 400

    result = predict_pair(text_a, text_b)
    return jsonify(result)


@app.route("/health", methods=["GET"])
def health():
    """Health check."""
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "model_dir": MODEL_DIR,
    })


if __name__ == "__main__":
    loaded = load_model()
    port = int(os.environ.get("PORT", 5050))
    print(f"Starting ML overlap service on port {port}")
    print(f"Model loaded: {loaded}")
    app.run(host="0.0.0.0", port=port, debug=False)
