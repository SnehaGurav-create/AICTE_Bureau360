"""
Train a TF-IDF + Logistic Regression model for complaint-pair overlap classification.

Usage:
  python train_model.py --data training_data.csv --output model/

Expected CSV columns:
  text_a, text_b, is_overlap (0 or 1)
"""

import argparse
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from scipy.sparse import hstack


def preprocess(text):
    """Lowercase, strip, collapse whitespace."""
    if not isinstance(text, str):
        return ""
    return " ".join(text.lower().strip().split())


def build_features(df, vectorizer=None, fit=False):
    """
    Build TF-IDF feature vectors for complaint pairs.
    Uses concatenated text and individual text vectors + cosine similarity.
    """
    text_a = df["text_a"].apply(preprocess)
    text_b = df["text_b"].apply(preprocess)

    # Concatenated text for joint representation
    combined = text_a + " " + text_b

    if fit:
        vectorizer = TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=2,
        )
        tfidf_combined = vectorizer.fit_transform(combined)
    else:
        tfidf_combined = vectorizer.transform(combined)

    # Individual vectors for cosine similarity feature
    tfidf_a = vectorizer.transform(text_a)
    tfidf_b = vectorizer.transform(text_b)

    # Cosine similarity between text_a and text_b
    cos_sim = np.array(
        [
            tfidf_a[i].multiply(tfidf_b[i]).sum()
            / (
                max(np.sqrt(tfidf_a[i].multiply(tfidf_a[i]).sum()), 1e-8)
                * max(np.sqrt(tfidf_b[i].multiply(tfidf_b[i]).sum()), 1e-8)
            )
            for i in range(tfidf_a.shape[0])
        ]
    ).reshape(-1, 1)

    # Element-wise difference
    diff = abs(tfidf_a - tfidf_b)

    features = hstack([tfidf_combined, diff, cos_sim])
    return features, vectorizer


def train(data_path, output_dir):
    """Train and evaluate the model."""
    print(f"Loading data from {data_path}...")
    df = pd.read_csv(data_path)

    print(f"Dataset: {len(df)} pairs, {df['is_overlap'].sum()} overlaps")
    print(f"Overlap ratio: {df['is_overlap'].mean():.2%}")

    # Build features
    X, vectorizer = build_features(df, fit=True)
    y = df["is_overlap"].values

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Train logistic regression
    model = LogisticRegression(
        max_iter=1000,
        C=1.0,
        class_weight="balanced",  # Handle class imbalance
        solver="lbfgs",
        random_state=42,
    )

    print("\nTraining model...")
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print("\n=== Classification Report ===")
    print(classification_report(y_test, y_pred, target_names=["Not Overlap", "Overlap"]))

    print("=== Confusion Matrix ===")
    print(confusion_matrix(y_test, y_pred))

    # Cross-validation
    cv_scores = cross_val_score(model, X, y, cv=5, scoring="f1")
    print(f"\n5-Fold CV F1: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # False positive analysis
    fp_mask = (y_pred == 1) & (y_test == 0)
    fp_count = fp_mask.sum()
    print(f"\nFalse positives: {fp_count} / {(y_test == 0).sum()} negatives ({fp_count / max((y_test == 0).sum(), 1) * 100:.1f}%)")

    # Save model
    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(output_dir, "overlap_model.pkl")
    vectorizer_path = os.path.join(output_dir, "tfidf_vectorizer.pkl")

    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    with open(vectorizer_path, "wb") as f:
        pickle.dump(vectorizer, f)

    print(f"\nModel saved to {model_path}")
    print(f"Vectorizer saved to {vectorizer_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train overlap classification model")
    parser.add_argument("--data", required=True, help="Path to training CSV")
    parser.add_argument("--output", default="model/", help="Output directory for saved model")
    args = parser.parse_args()
    train(args.data, args.output)
