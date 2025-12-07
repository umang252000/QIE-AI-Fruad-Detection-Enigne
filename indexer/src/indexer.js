require("dotenv").config();
const { ethers } = require("ethers");
const { Client } = require("pg");

// ----------------------------------------------
// 🔐 ENV VALIDATION
// ----------------------------------------------
if (!process.env.QIE_RPC_URL) throw new Error("Missing QIE_RPC_URL");
if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL");
if (!process.env.CONTRACT_ADDRESS) throw new Error("Missing CONTRACT_ADDRESS");

// ----------------------------------------------
// 🔗 ETHERS PROVIDER
// ----------------------------------------------
let provider = new ethers.providers.JsonRpcProvider(process.env.QIE_RPC_URL);

async function refreshProvider() {
  provider = new ethers.providers.JsonRpcProvider(process.env.QIE_RPC_URL);
  console.log("♻️ Provider reconnected");
}

// ----------------------------------------------
// 🗄️ POSTGRES
// ----------------------------------------------
const pg = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function connectPostgres() {
  try {
    await pg.connect();
    console.log("📦 Connected to Postgres");
  } catch (err) {
    console.error("❌ Postgres connection failed, retrying...");
    setTimeout(connectPostgres, 3000);
  }
}

connectPostgres();

// ----------------------------------------------
// 📌 CONTRACT ABI (only events needed)
// ----------------------------------------------
const FRAUD_ABI = [
  "event ReportCreated(uint256 indexed id, address indexed reporter, address indexed wallet, uint8 score, bytes32 evidenceHash)",
  "event ReportVoted(uint256 indexed id, address indexed voter, bool support, uint256 weight)",
  "event ReportResolved(uint256 indexed id, bool valid, uint32 votesFor, uint32 votesAgainst)"
];

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(CONTRACT_ADDRESS, FRAUD_ABI, provider);

// ----------------------------------------------
// 📝 DB INSERT HELPERS
// ----------------------------------------------

// Insert block transactions
async function saveTx(tx) {
  const query = `
    INSERT INTO txs(hash, from_addr, to_addr, value, block_number)
    VALUES($1, $2, $3, $4, $5)
    ON CONFLICT DO NOTHING
  `;

  try {
    await pg.query(query, [
      tx.hash,
      tx.from,
      tx.to || "",
      tx.value.toString(),
      tx.blockNumber,
    ]);
  } catch (err) {
    console.error("❌ DB insert tx error:", err);
  }
}

// Insert fraud report creation
async function saveReport(event) {
  const query = `
    INSERT INTO fraud_reports(id, reporter, wallet, score, evidence_hash, block_number)
    VALUES($1, $2, $3, $4, $5, $6)
    ON CONFLICT DO NOTHING
  `;

  const { id, reporter, wallet, score, evidenceHash } = event.args;

  try {
    await pg.query(query, [
      id.toString(),
      reporter,
      wallet,
      score,
      evidenceHash,
      event.blockNumber,
    ]);
  } catch (err) {
    console.error("❌ DB insert report error:", err);
  }
}

// Insert votes
async function saveVote(event) {
  const query = `
    INSERT INTO fraud_votes(report_id, voter, support, weight, block_number)
    VALUES($1, $2, $3, $4, $5)
  `;

  const { id, voter, support, weight } = event.args;

  try {
    await pg.query(query, [
      id.toString(),
      voter,
      support,
      weight.toString(),
      event.blockNumber,
    ]);
  } catch (err) {
    console.error("❌ DB insert vote error:", err);
  }
}

// Insert resolution
async function saveResolution(event) {
  const query = `
    INSERT INTO fraud_resolutions(report_id, valid, votes_for, votes_against, block_number)
    VALUES($1, $2, $3, $4, $5)
  `;

  const { id, valid, votesFor, votesAgainst } = event.args;

  try {
    await pg.query(query, [
      id.toString(),
      valid,
      votesFor.toString(),
      votesAgainst.toString(),
      event.blockNumber,
    ]);
  } catch (err) {
    console.error("❌ DB insert resolution error:", err);
  }
}

// ----------------------------------------------
// 🔥 MAIN BLOCK LISTENER
// ----------------------------------------------
provider.on("block", async (blockNumber) => {
  try {
    console.log(`🧱 Block ${blockNumber}`);

    const block = await provider.getBlockWithTransactions(blockNumber);

    // Save all normal transactions
    for (const tx of block.transactions) {
      saveTx(tx);
    }
  } catch (err) {
    console.error("❌ Block processing error:", err);
    refreshProvider();
  }
});

// ----------------------------------------------
// 🔥 CONTRACT EVENT LISTENERS
// ----------------------------------------------

contract.on("ReportCreated", async (...args) => {
  const event = args[args.length - 1];
  console.log("🆕 Fraud Report:", event.args.id.toString());
  saveReport(event);
});

contract.on("ReportVoted", async (...args) => {
  const event = args[args.length - 1];
  console.log("🗳 Vote on Report:", event.args.id.toString());
  saveVote(event);
});

contract.on("ReportResolved", async (...args) => {
  const event = args[args.length - 1];
  console.log("✔️ Report Resolved:", event.args.id.toString());
  saveResolution(event);
});

console.log("🔍 Fraud indexer started...");
console.log("Listening to:");
console.log(" - QIE Blocks");
console.log(" - FraudAlerts contract events");