AI Fraud Detection Engine — QIE Blockchain Hackathon 2025

An end-to-end Fraud Detection System built for the QIE Blockchain, combining:

Smart Contracts

AI/ML (Isolation Forest Model)

Blockchain Indexer

React + Vite Frontend

FastAPI Backend

IPFS Evidence Storage

This project provides automated fraud risk scoring, on-chain reporting, and real-time monitoring of suspicious activity.

Key Features
1. Fraud Score Analysis (AI-Powered)

Uses Isolation Forest ML model

Extracts blockchain transaction patterns:

tx_count

incoming / outgoing tx

avg value

max value

Produces a fraud risk score (0–100)

2. On-Chain Fraud Reporting (Smart Contract)

Users can report suspicious wallets

Generates evidence hash stored on IPFS

Writes an immutable record on QIE chain using:

reportSuspicious(address wallet, bytes32 evidenceHash, uint8 score)

3. Blockchain Indexer (Node.js + Postgres)

Listens to QIE blockchain in real-time

Saves all transactions into PostgreSQL

Enables fast ML feature extraction

4. Frontend Dashboard (React + Vite)

Includes:

Fraud Score Search

Fraud Alerts Feed

Submit Fraud Report

Connect Wallet (MetaMask/QIE Wallet)

5. Backend API (FastAPI)

Main endpoints:

Get Fraud Score
POST /score
{
  "wallet": "0x123..."
}

✔ Fetch Recent Fraud Reports
GET /reports

System Architecture
              
                ┌──────────────────────┐
                │      Frontend        │
                │ React + Vite         │
                └─────────┬────────────┘
                          │ REST API
                          ▼
          ┌──────────────────────────────────┐
          │             Backend               │
          │ FastAPI + ML Model                │
          └─────────┬──────────┬─────────────┘
                    │          │
                    ▼          ▼
            PostgreSQL     Isolation Forest
            (Transaction      (Fraud ML)
              History)
                    ▲
                    │
       ┌────────────┴─────────────┐
       │       Blockchain Indexer  │
       │ Node.js + ethers.js v6    │
       └────────────┬─────────────┘
                    │
                    ▼
            QIE Blockchain RPC
                    │
                    ▼
            Smart Contract (Solidity)

Tech Stack
Layer	Technology
Frontend	React, Vite, Axios, Ethers.js v6
Backend	FastAPI, Python, Pandas, NumPy, Joblib
Smart Contract	Solidity, Hardhat
AI Model	Isolation Forest
Indexer	Node.js, Ethers.js v6, PostgreSQL
Storage	IPFS
Deployment	Replit / Docker / GitHub

Project Structure

AI_Fraud_Detection_Engine/

│── backend/

│   ├── app/main.py

│   ├── exported_model/

│   ├── requirements.txt

│

│── frontend/

│   ├── src/

│   ├── index.html

│   ├── vite.config.js

│

│── indexer/

│   ├── src/indexer.js

│   ├── package.json
│

│── contracts/

│   ├── FraudAlerts.sol

│   ├── hardhat.config.js
│

│── ml/

│   ├── train_isolation.py

│   ├── export_model.py

Environment Variables

Create a .env file inside backend/:

DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME
QIE_RPC_URL=https://qie-rpc-endpoint
CONTRACT_ADDRESS=0xYourContract
PRIVATE_KEY=your_private_key
MODEL_PATH=exported_model/model.joblib
SCALER_PATH=exported_model/scaler.joblib
META_PATH=exported_model/meta.json
IPFS_API_URL=https://ipfs.io/api/v0

Running the Project
1. Install Dependencies
Backend:
cd backend
pip install -r requirements.txt

Frontend:
cd frontend
npm install
npm run dev

Indexer:
cd indexer
npm install
node src/indexer.js

ML Model Training

Train isolation forest:

cd ml
python train_isolation.py
python export_model.py

Demo Flow (Screenshots)

Screenshots (uploaded in repo or README):

Search Wallet Page

Fraud Alerts Feed

Report Fraud Page

Fraud Score Result (78/100 mock demo)

These demonstrate the user flow required for hackathon submission.

Summary

This project:

✔ Detects suspicious wallets using machine learning

✔ Stores immutable fraud reports on QIE blockchain

✔ Uses IPFS for evidence management

✔ Indexes blockchain data in real-time

✔ Provides a polished dashboard for end users

It Have:

Innovation

Technical depth

Real-world impact

Scalability

Clean architecture

UI/UX quality

Documentation (this README)

Deployability
