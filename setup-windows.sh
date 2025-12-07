python -m venv .venv
source .venv/Scripts/activate
pip install --upgrade pip
pip install -r backend/requirements.txt || true
cat > .env <<EOF
QIE_RPC_URL=https://REPLACE_WITH_QIE_TESTNET_RPC
PRIVATE_KEY=REPLACE_WITH_YOUR_PRIVATE_KEY
IPFS_API=http://127.0.0.1:5001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fraud
EOF
echo "Setup complete. Edit .env with real values before continuing."