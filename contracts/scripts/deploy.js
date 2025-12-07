const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH");

  // ---------------------------
  // 1. TOKEN ADDRESS REQUIRED
  // ---------------------------
  const tokenAddress = process.env.TOKEN_ADDRESS || hre.ethers.ZeroAddress;

  if (tokenAddress === hre.ethers.ZeroAddress) {
    console.warn("⚠️ WARNING: Deploying with ZERO token address!");
    console.warn("   Staking will NOT work until you update token address.");
  }

  // ---------------------------
  // 2. GET CONTRACT FACTORY
  // ---------------------------
  const FraudAlerts = await hre.ethers.getContractFactory("FraudAlerts");

  console.log("📦 Deploying FraudAlerts contract...");

  // ---------------------------
  // 3. DEPLOY CONTRACT
  // ---------------------------
  const contract = await FraudAlerts.deploy(tokenAddress);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ FraudAlerts deployed at:", contractAddress);

  // ---------------------------
  // 4. SAVE DEPLOYMENT INFO
  // ---------------------------
  const fs = require("fs");
  const deployData = {
    address: contractAddress,
    network: hre.network.name,
    tokenAddress,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./deployments/fraudAlerts.json",
    JSON.stringify(deployData, null, 2)
  );

  console.log("📁 Deployment saved to deployments/fraudAlerts.json");
}

main().catch((err) => {
  console.error("❌ Deployment failed:");
  console.error(err);
  process.exit(1);
});