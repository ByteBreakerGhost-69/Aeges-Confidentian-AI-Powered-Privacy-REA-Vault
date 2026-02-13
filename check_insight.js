// scripts/check_insight.js
const hre = require("hardhat");

async function main() {
    const [user] = await hre.ethers.getSigners();
    const deployment = require(`../deployments/${hre.network.name}.json`);
    
    const vault = await hre.ethers.getContractAt(
        "AegisVault",
        deployment.vault
    );
    
    console.log(`🔍 Checking AI insight for ${user.address}...\n`);
    
    const insight = await vault.userInsights(user.address);
    
    if (insight.timestamp == 0) {
        console.log("❌ No AI insight found for this user.");
        console.log("   Run: npx hardhat run scripts/request_ai_insight.js");
        return;
    }
    
    console.log("🎯 LATEST AI INSIGHT");
    console.log("════════════════════");
    console.log(`⏱️  Timestamp: ${new Date(Number(insight.timestamp) * 1000).toLocaleString()}`);
    console.log(`🤖 Recommendation: ${insight.recommendation}`);
    console.log(`📊 Confidence: ${insight.confidence}%`);
    console.log(`⚠️  Risk Level: ${["LOW", "MEDIUM", "HIGH"][insight.riskLevel]}`);
    console.log("════════════════════");
}

main().catch(console.error);  
  
