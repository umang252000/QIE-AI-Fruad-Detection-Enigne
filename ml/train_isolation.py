import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import json
import os

# -------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------
MODEL_PATH = "models/isoforest_model.joblib"
SCALER_PATH = "models/scaler.joblib"
META_PATH = "models/model_meta.json"

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)


# -------------------------------------------------------
# Synthetic Training Data (MVP)
# Later replace this block with REAL blockchain statistics
# -------------------------------------------------------
def generate_synthetic_data(n=2000):
    """
    Creates semi-realistic wallet behavior data:
    [tx_count, avg_value, max_value, incoming, outgoing]
    """
    mean = np.array([50, 1000, 5000, 25, 25])
    std = np.array([20, 300, 2000, 10, 10])

    normal = np.random.normal(loc=mean, scale=std, size=(n, 5))

    # Add some rare anomalies for the model to learn structure
    anomalies = np.random.normal(
        loc=[200, 5000, 25000, 5, 200],
        scale=[40, 2000, 12000, 2, 50],
        size=(int(n * 0.05), 5)
    )

    data = np.vstack([normal, anomalies])
    np.random.shuffle(data)
    return data


# -------------------------------------------------------
# Train Isolation Forest Model
# -------------------------------------------------------
def train_model(X):
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=300,
        contamination=0.05,
        max_samples="auto",
        random_state=RANDOM_SEED,
        bootstrap=False,
    )

    model.fit(X_scaled)
    return model, scaler


# -------------------------------------------------------
# Save Model + Metadata
# -------------------------------------------------------
def save_artifacts(model, scaler):
    os.makedirs("models", exist_ok=True)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    meta = {
        "model": "IsolationForest",
        "version": "1.0",
        "features": [
            "tx_count",
            "avg_value",
            "max_value",
            "incoming",
            "outgoing",
        ],
        "contamination": 0.05,
        "n_estimators": 300,
    }

    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)

    print("📁 Model saved:", MODEL_PATH)
    print("📁 Scaler saved:", SCALER_PATH)
    print("📄 Metadata saved:", META_PATH)


# -------------------------------------------------------
# MAIN EXECUTION
# -------------------------------------------------------
if __name__ == "__main__":
    print("🚀 Generating synthetic training data...")
    X = generate_synthetic_data()

    print("🧠 Training Isolation Forest model...")
    model, scaler = train_model(X)

    print("💾 Saving model files...")
    save_artifacts(model, scaler)

    print("✔ Training complete!")