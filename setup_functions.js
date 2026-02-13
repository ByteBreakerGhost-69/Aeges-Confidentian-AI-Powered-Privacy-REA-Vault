// scripts/setup_functions.js
const hre = require("hardhat");
const { networkConfig } = require("../frontend/constants/chainlinkConfig");

async function main() {
    console.log("🔧 Setting up Chainlink Functions...");
    
    const network = hre.network.name;
    const config = networkConfig[network];
    
    // ========== 1. CREATE SUBSCRIPTION ==========
    console.log("\n1️⃣ Creating Functions subscription...");
    const functionsRouter = await hre.ethers.getContractAt(
        "FunctionsRouter",
        config.functionsRouter
    );
    
    const createSubTx = await functionsRouter.createSubscription();
    const createSubReceipt = await createSubTx.wait();
    
    const subscriptionId = createSubReceipt.events[0].args.subscriptionId;
    console.log(`✅ Subscription created! ID: ${subscriptionId}`);
    
    // ========== 2. FUND SUBSCRIPTION ==========
    console.log("\n2️⃣ Funding subscription with LINK...");
    const linkToken = await hre.ethers.getContractAt("LinkToken", config.linkToken);
    
    const fundAmount = hre.ethers.parseEther("10"); // 10 LINK
    // GANTI DENGAN INI:
    const fundTx = await linkToken.transferAndCall(
        functionsRouter.address,
        fundAmount,
        hre.ethers.defaultAbiCoder.encode(["uint64"], [subscriptionId])
    );
    await fundTx.wait();
    console.log(`✅ Funded with 10 LINK`);
    
    // ========== 3. UPLOAD SECRETS ==========
    console.log("\n3️⃣ Encrypting and uploading secrets...");
    const secrets = {
        apiKey: process.env.OPENAI_API_KEY,
        geminiApiKey: process.env.GEMINI_API_KEY
    };
    
    // Ini perlu implementasi dengan Chainlink Functions toolkit
    console.log(`⚠️  Please upload secrets manually using Chainlink CLI:`);
    console.log(`   chainlink functions secrets encrypt`);
    
    // ========== 4. SAVE CONFIG ==========
    console.log("\n📝 Saving subscription info...");
    const fs = require("fs");
    fs.writeFileSync(
        `deployments/${network}-functions.json`,
        JSON.stringify({
            network,
            subscriptionId: subscriptionId.toString(),
            router: config.functionsRouter,
            donId: config.donId,
            timestamp: new Date().toISOString()
        }, null, 2)
    );
    
    console.log(`\n✅ Functions setup complete!`);
    console.log(`📎 Subscription ID: ${subscriptionId}`);
}

main().catch(console.error);
