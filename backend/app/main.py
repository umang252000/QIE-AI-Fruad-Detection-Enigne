from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import psycopg2
import psycopg2.pool
import pandas as pd
import numpy as np
import joblib
import json

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

MODEL_PATH = "../exported_model/model.joblib"
SCALER_PATH = "../exported_model/scaler.joblib"
META_PATH = "../exported_model/meta.json"

# -------------------------------------------------------
# FASTAPI APP
# -------------------------------------------------------
app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # You can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------
# POSTGRES CONNECTION POOL (SAFE)
# -------------------------------------------------------
pg_pool = psycopg2.pool.SimpleConnectionPool(
    1, 10, dsn=DB_URL
)

def get_conn():
    try:
        return pg_pool.getconn()
    except:
        return pg_pool.getconn()


# -------------------------------------------------------
# LOAD ML MODEL + SCALER + META
# -------------------------------------------------------
model = None
scaler = None
meta = None

try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    with open(META_PATH, "r") as f:
        meta = json.load(f)
    print("✔ ML model + scaler loaded")
except Exception as e:
    print("⚠ ML Model not loaded – fallback scoring mode")
    print("Error:", e)


# -------------------------------------------------------
# FEATURE EXTRACTOR
# -------------------------------------------------------
def extract_features(wallet: str):
    conn = get_conn()
    query = """
    SELECT value, from_addr, to_addr 
    FROM txs
    WHERE from_addr = %s OR to_addr = %s
    ORDER BY block_number DESC
    """

    try:
        df = pd.read_sql(query, conn, params=(wallet, wallet))
    except Exception as e:
        print("DB error:", e)
        return None
    finally:
        pg_pool.putconn(conn)

    if df.empty:
        return None

    df["value"] = df["value"].astype(float)

    tx_count = len(df)
    avg_value = df["value"].mean()
    max_value = df["value"].max()
    incoming = (df["to_addr"] == wallet).sum()
    outgoing = tx_count - incoming

    features = np.array([tx_count, avg_value, max_value, incoming, outgoing], dtype=float)

    return features


# -------------------------------------------------------
# REQUEST BODY MODEL
# -------------------------------------------------------
class WalletQuery(BaseModel):
    wallet: str


# -------------------------------------------------------
# FRAUD SCORE API
# -------------------------------------------------------
@app.post("/score")
def score_wallet(data: WalletQuery):
    wallet = data.wallet.lower()

    features = extract_features(wallet)
    if features is None:
        return {
            "wallet": wallet,
            "risk_score": 0,
            "message": "No transactions found"
        }

    # reshape for model
    X = features.reshape(1, -1)

    # fallback
    if not model or not scaler:
        return {
            "wallet": wallet,
            "risk_score": 50,
            "features": features.tolist(),
            "model_based": False,
        }

    # scale first
    X_scaled = scaler.transform(X)

    # model output (Isolation Forest anomaly function)
    anomaly = model.decision_function(X_scaled)[0]

    # Convert anomaly to 0–100 risk score
    # Higher anomaly = lower risk → invert it
    risk_raw = 1 - anomaly
    risk_score = int(np.clip(risk_raw * 100, 0, 100))

    return {
        "wallet": wallet,
        "risk_score": risk_score,
        "features": features.tolist(),
        "model_based": True,
        "model_version": meta.get("version", "unknown")
    }


# -------------------------------------------------------
# REPORTS API (used by Dashboard)
# -------------------------------------------------------
@app.get("/reports")
def list_reports():
    conn = get_conn()
    query = """
        SELECT 
            hash AS tx_hash,
            from_addr AS reporter,
            to_addr AS wallet,
            block_number AS block
        FROM txs
        WHERE to_addr IS NOT NULL
        ORDER BY block_number DESC
        LIMIT 20
    """

    try:
        df = pd.read_sql(query, conn)
    except Exception as e:
        print("DB error:", e)
        return []
    finally:
        pg_pool.putconn(conn)

    return df.to_dict(orient="records")


# -------------------------------------------------------
# HOME
# -------------------------------------------------------
@app.get("/")
def home():
    return {"status": "backend running", "model_loaded": model is not None}