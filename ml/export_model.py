"""
export_model.py
----------------
This script loads your trained Isolation Forest + Scaler,
verifies that everything is valid, and exports a clean
inference package for the API server.
"""

import joblib
import json
import os

MODEL_PATH = "models/isoforest_model.joblib"
SCALER_PATH = "models/scaler.joblib"
META_PATH = "models/model_meta.json"

EXPORT_DIR = "exported_model"


def ensure_paths():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

    if not os.path.exists(SCALER_PATH):
        raise FileNotFoundError(f"Scaler not found: {SCALER_PATH}")

    if not os.path.exists(META_PATH):
        raise FileNotFoundError(f"Metadata not found: {META_PATH}")


def load_artifacts():
    print("📦 Loading model and scaler...")
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

    with open(META_PATH, "r") as f:
        meta = json.load(f)

    return model, scaler, meta


def export_artifacts(model, scaler, meta):
    os.makedirs(EXPORT_DIR, exist_ok=True)

    # Save model
    joblib.dump(model, os.path.join(EXPORT_DIR, "model.joblib"))

    # Save scaler
    joblib.dump(scaler, os.path.join(EXPORT_DIR, "scaler.joblib"))

    # Enhance metadata with export timestamp
    meta["exported"] = True

    with open(os.path.join(EXPORT_DIR, "meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print("✅ Model exported successfully!")
    print(f"📁 Output folder: {EXPORT_DIR}")


if __name__ == "__main__":
    print("🚀 Exporting model...")

    ensure_paths()
    model, scaler, meta = load_artifacts()
    export_artifacts(model, scaler, meta)

    print("✔ Export complete.")