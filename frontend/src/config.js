// ===============================
// 🔐 LOAD ENVIRONMENT VARIABLES
// ===============================
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

export const TOKEN_ADDRESS =
  import.meta.env.VITE_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";

export const NETWORK_NAME = import.meta.env.VITE_NETWORK_NAME || "Unknown";


// ===============================
// 📜 FULL ABI (Improved FraudAlerts Contract)
// ===============================
export const CONTRACT_ABI = [
  // --- report creation ---
  {
    "inputs": [
      { "internalType": "address", "name": "wallet", "type": "address" },
      { "internalType": "bytes32", "name": "evidenceHash", "type": "bytes32" },
      { "internalType": "uint8", "name": "score", "type": "uint8" }
    ],
    "name": "reportSuspicious",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // --- stake tokens ---
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // --- withdraw stake ---
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "withdrawStake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // --- vote on a report ---
  {
    "inputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "bool", "name": "support", "type": "bool" }
    ],
    "name": "voteReport",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // --- resolve report ---
  {
    "inputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" }
    ],
    "name": "resolveReport",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // --- view reports ---
  {
    "inputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" }
    ],
    "name": "getReport",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "reporter", "type": "address" },
          { "internalType": "address", "name": "wallet", "type": "address" },
          { "internalType": "bytes32", "name": "evidenceHash", "type": "bytes32" },
          { "internalType": "uint8", "name": "score", "type": "uint8" },
          { "internalType": "uint40", "name": "timestamp", "type": "uint40" },
          { "internalType": "bool", "name": "resolved", "type": "bool" },
          { "internalType": "uint32", "name": "votesFor", "type": "uint32" },
          { "internalType": "uint32", "name": "votesAgainst", "type": "uint32" }
        ],
        "internalType": "struct FraudAlerts.Report",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];