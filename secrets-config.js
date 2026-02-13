/**
 * @file secrets-config.js
 * @description Chainlink Functions secrets configuration for AegisVault
 * 
 * 🚀 UNTUK HACKATHON CHAINLINK 2026
 * 
 * CARA SETUP API KEYS:
 * 
 * 1️⃣ DAPATKAN OPENAI API KEY (Bayar):
 *    - Buka: https://platform.openai.com/api-keys
 *    - Create new secret key
 *    - Copy key (mulai dengan "sk-")
 *    - Minimal deposit: $5 (cukup untuk 1000+ requests)
 * 
 * 2️⃣ DAPATKAN GEMINI API KEY (GRATIS!):
 *    - Buka: https://makersuite.google.com/app/apikey
 *    - Create API key
 *    - Copy key (mulai dengan "AIza")
 *    - GRATIS! 60 requests per menit
 * 
 * 3️⃣ SET ENVIRONMENT VARIABLES:
 *    - Buat file .env di root project
 *    - Isi:
 *      OPENAI_API_KEY=sk-xxxx...
 *      GEMINI_API_KEY=AIzaxxxx...
 * 
 * 4️⃣ ENCRYPT & UPLOAD KE CHAINLINK:
 *    npx hardhat run scripts/setup_functions.js --network sepolia
 */

module.exports = {
    // ========== OPENAI CONFIGURATION (PRIMARY) ==========
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4-turbo-preview',
        maxTokens: 250,
        temperature: 0.3,
        description: 'GPT-4 Turbo untuk analisis RWA investment'
    },
    
    // ========== GOOGLE GEMINI CONFIGURATION (FALLBACK) ==========
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        model: 'gemini-pro',
        temperature: 0.3,
        description: 'Gemini Pro - GRATIS! untuk testing'
    },
    
    // ========== DEFAULT SETTINGS ==========
    default: {
        timeout: 15000,      // 15 detik
        retries: 3,          // Coba ulang 3x kalau gagal
        minConfidence: 50,   // Minimal confidence score
        gasLimit: 300000,    // Gas limit untuk Functions
        donId: 'fun-ethereum-sepolia-1' // Chainlink DON ID
    },
    
    // ========== NETWORK CONFIGURATION ==========
    networks: {
        sepolia: {
            functionsRouter: '0xb83E47C2bC239B3bf370bc41e1459A34b41238D0',
            linkToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
            donId: 'fun-ethereum-sepolia-1'
        },
        mumbai: {
            functionsRouter: '0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C',
            linkToken: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
            donId: 'fun-polygon-mumbai-1'
        }
    }
};

// ========== VALIDASI API KEYS ==========
if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    console.warn(`
    ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
    ⚠️                                                 ⚠️
    ⚠️   TIDAK ADA API KEY DITEMUKAN!                 ⚠️
    ⚠️   AI INSIGHTS TIDAK AKAN BEKERJA               ⚠️
    ⚠️                                                 ⚠️
    ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
    
    🔑 CARA MENDAPATKAN API KEY:
    
    📌 OPTION A: OpenAI (Rp 80.000-an)
    1. Buka https://platform.openai.com/api-keys
    2. Create new secret key
    3. Isi saldo minimal $5
    4. Copy key (sk-...)
    
    📌 OPTION B: Gemini (GRATIS!)
    1. Buka https://makersuite.google.com/app/apikey
    2. Create API key
    3. Copy key (AIza...)
    
    📌 SETUP ENVIRONMENT:
    1. Buat file .env di root project
    2. Isi:
       OPENAI_API_KEY=sk-xxxx...
       GEMINI_API_KEY=AIzaxxxx...
    
    📌 UPLOAD KE CHAINLINK:
    npx hardhat run scripts/setup_functions.js --network sepolia
    `);
}

// ========== EXPORT FOR SCRIPTS ==========
module.exports.getOpenAIConfig = () => {
    return {
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4-turbo-preview'
    };
};

module.exports.getGeminiConfig = () => {
    return {
        apiKey: process.env.GEMINI_API_KEY,
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        model: 'gemini-pro'
    };
};
