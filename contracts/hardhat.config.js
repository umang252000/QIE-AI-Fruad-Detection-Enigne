require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("dotenv").config();

// Load environment variables safely
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const QIE_RPC_URL = process.env.QIE_RPC_URL || "";
const EXPLORER_API_KEY = process.env.EXPLORER_API_KEY || "";  // Optional

module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 300, // recommended for production / testnet
      },
    },
  },

  defaultNetwork: "hardhat",

  networks: {
    hardhat: {
      chainId: 31337,
    },

    qieTestnet: {
      url: QIE_RPC_URL || "https://rpc.qie-testnet.example", 
      accounts: PRIVATE_KEY !== "" ? [PRIVATE_KEY] : [],
      chainId: 3939, // change to the real QIE chainId if needed
      gasPrice: "auto",
    },
  },

  etherscan: {
    apiKey: {
      qieTestnet: EXPLORER_API_KEY, 
    },
    customChains: [
      {
        network: "qieTestnet",
        chainId: 3939,
        urls: {
          apiURL: "https://explorer.qiechain.io/api",
          browserURL: "https://explorer.qiechain.io",
        },
      },
    ],
  },

  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: process.env.CMC_API_KEY || "", // optional
    showTimeSpent: true,
    noColors: false,
  },
};