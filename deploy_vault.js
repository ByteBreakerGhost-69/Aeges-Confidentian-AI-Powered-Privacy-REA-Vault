// scripts/deploy_vault.js
const hre = require("hardhat");
const { networkConfig } = require("../frontend/constants/chainlinkConfig");

async function main() {
    console.log("🚀 Starting AegisVault deployment...");
    
    const network = hre.network.name;
    console.log(`📡 Network: ${network}`);
    
    const config = networkConfig[network];
    
    // ========== 1. DEPLOY ACCESS CONTROL ==========
    console.log("\n1️⃣ Deploying AegisAccessControl...");
    const AccessControl = await hre.ethers.getContractFactory("AegisAccessControl");
    const accessControl = await AccessControl.deploy();
    await accessControl.deployed();
    console.log(`✅ AegisAccessControl deployed: ${accessControl.address}`);
    
    // ========== 2. DEPLOY VAULT ==========
    console.log("\n2️⃣ Deploying AegisVault...");
    const Vault = await hre.ethers.getContractFactory("AegisVault");
    const vault = await Vault.deploy(
        config.priceFeed,      // Chainlink Price Feed
        accessControl.address  // Access Control
    );
    await vault.deployed();
    console.log(`✅ AegisVault deployed: ${vault.address}`);
    
    // ========== 3. DEPLOY AI CONTROLLER ==========
    console.log("\n3️⃣ Deploying AegisAIController (Functions Client)...");
    const AIController = await hre.ethers.getContractFactory("AegisAIController");
    const aiController = await AIController.deploy(
        config.functionsRouter,
        config.subscriptionId,
        config.donId,
        vault.address
    );
    await aiController.deployed();
    console.log(`✅ AegisAIController deployed: ${aiController.address}`);
    
    // ========== 4. SET FUNCTIONS CLIENT IN VAULT ==========
    console.log("\n4️⃣ Connecting Vault to Functions Client...");
    await vault.setFunctionsClient(aiController.address);
    console.log(`✅ Functions client set`);
    
    // ========== 5. GRANT ROLES ==========
    console.log("\n5️⃣ Granting roles...");
    // GANTI DENGAN:
    const [deployer] = await hre.ethers.getSigners();  // ← TAMBAHIN INI DI ATAS!
    await accessControl.grantRole(await accessControl.DEFAULT_ADMIN_ROLE(), deployer.address);
    console.log(`✅ Admin role granted`);
    
    // ========== 6. VERIFY CONTRACTS (OPTIONAL) ==========
    if (network !== "hardhat" && network !== "localhost") {
        console.log("\n🔍 Verifying contracts...");
        await hre.run("verify:verify", { address: accessControl.address });
        await hre.run("verify:verify", { 
            address: vault.address,
            constructorArguments: [config.priceFeed, accessControl.address]
        });
        await hre.run("verify:verify", {
            address: aiController.address,
            constructorArguments: [
                config.functionsRouter,
                config.subscriptionId,
                config.donId,
                vault.address
            ]
        });
    }
    
    // ========== 7. SAVE DEPLOYMENT INFO ==========
    console.log("\n📝 Saving deployment info...");
    const deploymentInfo = {
        network,
        accessControl: accessControl.address,
        vault: vault.address,
        aiController: aiController.address,
        timestamp: new Date().toISOString()
    };
    
    const fs = require("fs");
    fs.writeFileSync(
        `deployments/${network}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n🎉 Deployment complete!");
    console.table(deploymentInfo);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
