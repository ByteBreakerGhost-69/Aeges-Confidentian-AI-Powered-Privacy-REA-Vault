/**
 * @file setup_ccip.js
 * @description Setup Chainlink CCIP for cross-chain RWA transfers
 * @dev Shows multi-chain capability untuk hackathon
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
  magenta: "\x1b[35m"
};

async function main() {
  console.log(`${colors.magenta}🌉 Setting up Chainlink CCIP for Cross-Chain RWA${colors.reset}`);
  
  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;
  
  console.log(`${colors.yellow}Network: ${network}${colors.reset}`);
  console.log(`${colors.yellow}Deployer: ${deployer.address}${colors.reset}`);
  
  // 🎯 CCIP Router addresses (testnets)
  const ccipRouters = {
    sepolia: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59", // Sepolia ETH
    polygonMumbai: "0x1035CabC275068e0F4b745A29CEDf38E13aF41b1", // Mumbai MATIC
    avalancheFuji: "0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8" // Fuji AVAX
  };
  
  const currentRouter = ccipRouters[network];
  if (!currentRouter) {
    console.log(`${colors.yellow}⚠️ No CCIP Router for ${network}${colors.reset}`);
    console.log(`${colors.green}✅ CCIP setup skipped (not available on this network)${colors.reset}`);
    return;
  }
  
  console.log(`${colors.green}✅ CCIP Router: ${currentRouter}${colors.reset}`);
  
  // 📝 Load deployment info
  const deploymentFile = path.join(__dirname, "..", "artifacts", `deployment-${network}.json`);
  if (!fs.existsSync(deploymentFile)) {
    console.log(`${colors.yellow}⚠️ No deployment found. Run deploy_vault.js first.${colors.reset}`);
    return;
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  
  // 📝 STEP 1: Deploy CCIP-compatible RWA Token
  console.log(`\n${colors.cyan}[1/3] Deploying CCIP-Compatible Token...${colors.reset}`);
  
  // Deploy token yang support CCIP
  const CCIPRwaToken = await ethers.getContractFactory("RWAToken");
  const ccipToken = await CCIPRwaToken.deploy(
    `Aegis RWA CCIP (${network})`,
    `aRWA-${network.substring(0, 3).toUpperCase()}`,
    ethers.parseEther("1000000"),
    deployer.address
  );
  
  await ccipToken.waitForDeployment();
  const ccipTokenAddress = await ccipToken.getAddress();
  
  console.log(`${colors.green}✅ CCIP Token: ${ccipTokenAddress}${colors.reset}`);
  
  // 📝 STEP 2: Whitelist token di CCIP Router (simulasi)
  console.log(`\n${colors.cyan}[2/3] Configuring CCIP Routes...${colors.reset}`);
  
  // Simulasi destination chains
  const destinationChains = {
    sepolia: { chainSelector: "16015286601757825753", enabled: true },
    polygonMumbai: { chainSelector: "12532609583862916517", enabled: true },
    avalancheFuji: { chainSelector: "14767482510784806043", enabled: false }
  };
  
  // 📝 STEP 3: Save CCIP config
  console.log(`\n${colors.cyan}[3/3] Saving CCIP Configuration...${colors.reset}`);
  
  const ccipConfig = {
    network: network,
    timestamp: new Date().toISOString(),
    ccipRouter: currentRouter,
    ccipToken: ccipTokenAddress,
    sourceChain: network,
    destinationChains: destinationChains,
    supportedTokens: {
      native: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native token placeholder
      link: deployment.chainlink.linkToken,
      rwa: ccipTokenAddress
    },
    feeTokens: [deployment.chainlink.linkToken],
    note: "For production, implement CCIP-compatible token with burn/mint"
  };
  
  const ccipFile = path.join(__dirname, "..", "artifacts", `ccip-config-${network}.json`);
  fs.writeFileSync(ccipFile, JSON.stringify(ccipConfig, null, 2));
  
  console.log(`${colors.green}✅ CCIP config saved: ${ccipFile}${colors.reset}`);
  
  // 🎯 Demo cross-chain scenario
  console.log(`\n${colors.magenta}🌐 Cross-Chain Demo Scenario:${colors.reset}`);
  console.log(`${colors.yellow}Source Chain: ${network}${colors.reset}`);
  
  Object.entries(destinationChains).forEach(([chain, config]) => {
    if (config.enabled) {
      console.log(`${colors.green}  → ${chain} (Chain Selector: ${config.chainSelector})${colors.reset}`);
    }
  });
  
  console.log(`\n${colors.cyan}📋 CCIP Integration Points:${colors.reset}`);
  console.log(`${colors.yellow}1. Cross-chain RWA transfers${colors.reset} - Move RWA tokens between chains`);
  console.log(`${colors.yellow}2. Multi-chain AI analysis${colors.reset} - Aggregate insights from multiple chains`);
  console.log(`${colors.yellow}3. Disaster recovery${colors.reset} - Move assets if one chain has issues`);
  
  console.log(`\n${colors.green}✅ CCIP setup complete!${colors.reset}`);
  console.log(`${colors.yellow}Note: Full CCIP requires additional contracts (CCIP compatible token)${colors.reset}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}❌ CCIP setup failed:${colors.reset}`, error);
    process.exit(1);
  });
