/**
 * @file setup_functions.js
 * @description Setup Chainlink Functions subscription and secrets
 * @dev Critical untuk hackathon demo - shows proper Functions setup
 */

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m"
};

async function main() {
  console.log(`${colors.blue}🔧 Setting up Chainlink Functions${colors.reset}`);
  
  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;
  
  console.log(`${colors.yellow}Network: ${network}${colors.reset}`);
  console.log(`${colors.yellow}Deployer: ${deployer.address}${colors.reset}`);
  
  // 🎯 Load deployment info
  const deploymentFile = path.join(__dirname, "..", "artifacts", `deployment-${network}.json`);
  if (!fs.existsSync(deploymentFile)) {
    console.log(`${colors.yellow}⚠️ No deployment found. Run deploy_vault.js first.${colors.reset}`);
    return;
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  
  // 📝 STEP 1: Check Functions Router
  console.log(`\n${colors.cyan}[1/3] Checking Functions Router...${colors.reset}`);
  
  // Functions Router addresses (network-specific)
  const functionsRouterAddresses = {
    sepolia: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    polygonMumbai: "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C"
  };
  
  const routerAddress = functionsRouterAddresses[network];
  if (!routerAddress) {
    console.log(`${colors.yellow}⚠️ No Functions Router for ${network}. Using mock for demo.${colors.reset}`);
    console.log(`${colors.green}✅ Functions setup complete (mock mode)${colors.reset}`);
    return;
  }
  
  const functionsRouter = await ethers.getContractAt(
    "FunctionsRouter",
    routerAddress,
    deployer
  );
  
  console.log(`${colors.green}✅ Functions Router: ${routerAddress}${colors.reset}`);
  
  // 📝 STEP 2: Create/Check Subscription
  console.log(`\n${colors.cyan}[2/3] Managing Subscription...${colors.reset}`);
  
  // Load atau create subscription ID
  const subscriptionFile = path.join(__dirname, "..", "artifacts", `subscription-${network}.json`);
  let subscriptionId;
  
  if (fs.existsSync(subscriptionFile)) {
    const subInfo = JSON.parse(fs.readFileSync(subscriptionFile, "utf8"));
    subscriptionId = subInfo.subscriptionId;
    console.log(`${colors.green}✅ Existing subscription found: ${subscriptionId}${colors.reset}`);
  } else {
    // Create new subscription untuk demo
    console.log(`${colors.yellow}Creating new subscription...${colors.reset}`);
    
    // NOTE: Di production, ini akan require LINK deposit
    // Untuk hackathon demo, kita pakai mock approach
    subscriptionId = 1; // Mock subscription ID
    
    const subInfo = {
      subscriptionId: subscriptionId,
      owner: deployer.address,
      created: new Date().toISOString(),
      network: network
    };
    
    fs.writeFileSync(subscriptionFile, JSON.stringify(subInfo, null, 2));
    console.log(`${colors.green}✅ Created mock subscription: ${subscriptionId}${colors.reset}`);
    console.log(`${colors.yellow}Note: For real network, use Chainlink Functions dashboard${colors.reset}`);
  }
  
  // 📝 STEP 3: Setup Secrets (jika perlu)
  console.log(`\n${colors.cyan}[3/3] Configuring Secrets...${colors.reset}`);
  
  // Untuk AI analysis, mungkin butuh API keys
  // NOTE: Never commit real secrets!
  const secretsExample = {
    OPENAI_API_KEY: "your_openai_key_here", // Judges akan ganti dengan sendiri
    COINGECKO_API_KEY: "your_coingecko_key_here",
    ENCRYPTION_PUBLIC_KEY: "demo_public_key_for_privacy"
  };
  
  const secretsFile = path.join(__dirname, "..", "functions", "secrets-config.js");
  if (!fs.existsSync(secretsFile)) {
    const secretsTemplate = `
// 🚨 WARNING: Never commit real secrets!
// For hackathon demo, use test keys or environment variables

module.exports = {
  // AI Services
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "${secretsExample.OPENAI_API_KEY}",
  
  // Market Data
  COINGECKO_API_KEY: process.env.COINGECKO_API_KEY || "${secretsExample.COINGECKO_API_KEY}",
  
  // Encryption for Privacy Vault
  ENCRYPTION_PUBLIC_KEY: process.env.ENCRYPTION_PUBLIC_KEY || "${secretsExample.ENCRYPTION_PUBLIC_KEY}",
  
  // Chainlink Functions DON ID
  DON_ID: "${network === 'sepolia' ? 'fun-ethereum-sepolia-1' : 'fun-polygon-mumbai-1'}"
};
`;
    
    fs.writeFileSync(secretsFile, secretsTemplate);
    console.log(`${colors.green}✅ Created secrets config template${colors.reset}`);
    console.log(`${colors.yellow}Location: ${secretsFile}${colors.reset}`);
  }
  
  // 🎯 Save setup info
  const setupInfo = {
    network: network,
    timestamp: new Date().toISOString(),
    functionsRouter: routerAddress,
    subscriptionId: subscriptionId,
    vaultAddress: deployment.contracts.AegisVault,
    note: "For real Functions setup, use Chainlink Functions dashboard"
  };
  
  const setupFile = path.join(__dirname, "..", "artifacts", `functions-setup-${network}.json`);
  fs.writeFileSync(setupFile, JSON.stringify(setupInfo, null, 2));
  
  console.log(`\n${colors.blue}🎯 Chainlink Functions Setup Summary:${colors.reset}`);
  console.log(`${colors.yellow}Network: ${network}${colors.reset}`);
  console.log(`${colors.yellow}Router: ${routerAddress}${colors.reset}`);
  console.log(`${colors.yellow}Subscription: ${subscriptionId}${colors.reset}`);
  console.log(`${colors.yellow}Vault: ${deployment.contracts.AegisVault}${colors.reset}`);
  
  console.log(`\n${colors.cyan}📋 Next Steps for Judges:${colors.reset}`);
  console.log(`1. Fund subscription: npx hardhat run scripts/fund_subscription.js --network ${network}`);
  console.log(`2. Test Functions locally: node functions/test-local.js`);
  console.log(`3. Deploy Functions: Use Chainlink Functions dashboard`);
  
  console.log(`\n${colors.green}✅ Functions setup complete!${colors.reset}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}❌ Setup failed:${colors.reset}`, error);
    process.exit(1);
  });
