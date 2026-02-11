/**
 * @file secrets-config.js
 * @description Configuration and secrets management
 * @dev NEVER commit real secrets! Use environment variables.
 * @notice For hackathon demo, use test keys or mock data
 */

// 🚨 SECURITY WARNING 🚨
// This file should be in .gitignore
// Use environment variables in production

module.exports = {
  // ========== AI SERVICES ==========
  
  // OpenAI API (for GPT-based analysis)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "your_openai_key_here",
  
  // Alternative AI services (fallback)
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  COHERE_API_KEY: process.env.COHERE_API_KEY || "",
  
  // ========== MARKET DATA APIs ==========
  
  // CoinGecko for crypto prices
  COINGECKO_API_KEY: process.env.COINGECKO_API_KEY || "",
  
  // Alpha Vantage for traditional markets
  ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY || "",
  
  // ========== PRIVACY & ENCRYPTION ==========
  
  // Public key for encrypting sensitive data
  ENCRYPTION_PUBLIC_KEY: process.env.ENCRYPTION_PUBLIC_KEY || 
    "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyour_public_key_here\n-----END PUBLIC KEY-----",
  
  // Encryption algorithm
  ENCRYPTION_ALGORITHM: "RSA-OAEP",
  
  // ========== CHAINLINK CONFIG ==========
  
  // Chainlink Functions DON ID
  DON_ID: process.env.DON_ID || getDefaultDonId(),
  
  // Network configuration
  NETWORK: process.env.NETWORK || "sepolia",
  
  // ========== DEMO MODE ==========
  
  // Enable demo mode untuk hackathon presentation
  DEMO_MODE: process.env.DEMO_MODE || true,
  
  // Mock data untuk demo jika APIs fail
  USE_MOCK_DATA: process.env.USE_MOCK_DATA || true,
  
  // ========== RATE LIMITING ==========
  
  // API rate limits
  RATE_LIMITS: {
    coingecko: 50,    // requests per minute
    openai: 60,       // requests per minute
    alphavantage: 5   // requests per minute
  }
};

// Helper function untuk get DON ID berdasarkan network
function getDefaultDonId() {
  const network = process.env.NETWORK || "sepolia";
  
  const donIds = {
    sepolia: "fun-ethereum-sepolia-1",
    polygonMumbai: "fun-polygon-mumbai-1",
    avalancheFuji: "fun-avalanche-fuji-1"
  };
  
  return donIds[network] || "fun-ethereum-sepolia-1";
}

// 🔧 Validation function
function validateConfig() {
  const config = module.exports;
  const warnings = [];
  
  if (config.OPENAI_API_KEY === "your_openai_key_here") {
    warnings.push("⚠️ Using demo OpenAI API key");
  }
  
  if (config.DEMO_MODE) {
    warnings.push("⚠️ Running in DEMO MODE - using mock data");
  }
  
  if (warnings.length > 0) {
    console.log("🔧 Configuration Warnings:");
    warnings.forEach(w => console.log(`  ${w}`));
  }
  
  return warnings.length === 0;
}

// Run validation
if (require.main === module) {
  validateConfig();
}
