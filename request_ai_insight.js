/**
 * @file request_ai_insight.js
 * @description Request AI insight via Chainlink Functions
 * @dev Demo script untuk judges - shows end-to-end Functions flow
 */

// scripts/request_ai_insight.js
const hre = require("hardhat");

async function main() {
    console.log("🤖 Requesting AI Insight from OpenAI/Gemini...");
    
    // ========== GET CONTRACTS ==========
    const deployment = require(`../deployments/${hre.network.name}.json`);
    
    const aiController = await hre.ethers.getContractAt(
        "AegisAIController",
        deployment.aiController
    );
    
    const vault = await hre.ethers.getContractAt(
        "AegisVault",
        deployment.vault
    );
    
    // ========== GET USER ==========
    const [user] = await hre.ethers.getSigners();
    console.log(`👤 User: ${user.address}`);
    
    // ========== REQUEST AI ANALYSIS ==========
    console.log("\n📤 Sending request to OpenAI via Chainlink Functions...");
    
    const assetType = process.env.ASSET_TYPE || "Real Estate";
    const riskProfile = process.env.RISK_PROFILE || "Moderate";
    
    console.log(`   Asset Type: ${assetType}`);
    console.log(`   Risk Profile: ${riskProfile}`);
    
    const tx = await aiController.requestAIAnalysis(
        user.address,
        assetType,
        riskProfile
    );
    
    const receipt = await tx.wait();
    
    // ========== PARSE REQUEST ID ==========
    const event = receipt.events.find(e => e.event === "AIRequested");
    const requestId = event.args.requestId;
    
    console.log(`✅ AI Request sent!`);
    console.log(`📎 Request ID: ${requestId}`);
    console.log(`🔗 Tx Hash: ${tx.hash}`);
    
    // ========== WAIT FOR RESPONSE ==========
    console.log("\n⏳ Waiting for Chainlink Functions response (15-30 seconds)...");
    
    // Listen for AIResponseReceived event
    const filter = aiController.filters.AIResponseReceived(user.address);
    
    const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Timeout waiting for AI response"));
        }, 60000); // 60 seconds timeout
        
        aiController.once(filter, (user, recommendation, confidence, event) => {
            clearTimeout(timeout);
            resolve({ recommendation, confidence, event });
        });
    });
    
    // ========== DISPLAY RESULT ==========
    console.log("\n🎯 AI INSIGHT RECEIVED!");
    console.log("═══════════════════════════");
    console.log(`🤖 Recommendation: ${response.recommendation}`);
    console.log(`📊 Confidence: ${response.confidence}%`);
    console.log(`⏱️  Timestamp: ${new Date().toLocaleString()}`);
    console.log("═══════════════════════════\n");
    
    // ========== VERIFY ON VAULT ==========
    const insight = await vault.userInsights(user.address);
    console.log("📦 Stored in Vault:");
    console.log(`   Recommendation: ${insight.recommendation}`);
    console.log(`   Confidence: ${inset.insight.confidence}`);
    console.log(`   Risk Level: ${["LOW", "MEDIUM", "HIGH"][insight.riskLevel]}`);
}

main().catch(console.error);
