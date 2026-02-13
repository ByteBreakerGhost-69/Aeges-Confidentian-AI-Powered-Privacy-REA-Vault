/**
 * @file ai_market_analyst.js
 * @description REAL OpenAI GPT-4 Integration for AegisVault
 * @dev Chainlink Functions source code
 */

// ========== ARGUMENTS ==========
// args[0]: userAddress (string)
// args[1]: assetType (string) - "Real Estate", "Stocks", "Commodities", etc
// args[2]: riskProfile (string) - "Conservative", "Moderate", "Aggressive"
// args[3]: userBalance (string) - Amount of assets
// args[4]: modelVersion (string) - AI model version

const userAddress = args[0];
const assetType = args[1];
const riskProfile = args[2];
const userBalance = args[3];
const modelVersion = args[4];

// ========== CONFIGURATION ==========
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const API_KEY = secrets.apiKey;  // 🔐 From Chainlink Functions secrets

// ========== SYSTEM PROMPT ==========
const systemPrompt = `
You are an expert AI investment advisor specialized in Real World Assets (RWA).
Your task is to analyze investment scenarios and provide clear, actionable recommendations.

ANALYSIS CRITERIA:
1. Market conditions for ${assetType}
2. User risk profile: ${riskProfile}
3. Investment amount: ${userBalance}
4. Current market trends and economic indicators

RESPONSE FORMAT (STRICT JSON):
{
  "recommendation": "BUY" | "HOLD" | "SELL",
  "confidence": <number 0-100>,
  "reasoning": "<brief explanation max 100 chars>",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "suggestedAction": "<specific advice>"
}

RULES:
- Confidence MUST be 0-100
- Recommendation MUST be exactly BUY/HOLD/SELL
- Be conservative with SELL recommendations
- Consider risk profile in analysis
`;

// ========== USER PROMPT ==========
const userPrompt = `
INVESTMENT SCENARIO:
- Asset Class: ${assetType}
- Risk Tolerance: ${riskProfile}
- Investment Size: ${userBalance}
- Timestamp: ${Date.now()}
- AI Model: ${modelVersion}

Please provide your analysis.
`;

// ========== API REQUEST ==========
const request = {
  model: 'gpt-4-turbo-preview',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  temperature: 0.3,        // Low temperature for consistent results
  max_tokens: 250,         // Enough for detailed response
  response_format: { type: "json_object" }
};

// ========== EXECUTE REQUEST ==========
const response = await Functions.makeHttpRequest({
  url: OPENAI_ENDPOINT,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  data: request,
  timeout: 15000  // 15 seconds max
});

// ========== ERROR HANDLING ==========
if (response.error) {
  console.error(`OpenAI API Error: ${response.error}`);
  throw new Error(`OpenAI request failed: ${response.error.message || response.error}`);
}

if (!response.data || !response.data.choices || response.data.choices.length === 0) {
  throw new Error('Invalid response from OpenAI');
}

// ========== PARSE RESPONSE ==========
const aiResponse = JSON.parse(response.data.choices[0].message.content);

// ========== VALIDATION ==========
// Ensure recommendation is valid
const validRecommendations = ['BUY', 'HOLD', 'SELL'];
if (!validRecommendations.includes(aiResponse.recommendation)) {
  aiResponse.recommendation = 'HOLD';  // Default to HOLD if invalid
}

// Ensure confidence is within range
if (aiResponse.confidence < 0 || aiResponse.confidence > 100) {
  aiResponse.confidence = 50;  // Default to 50%
}

// Ensure riskLevel is valid
const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH'];
if (!validRiskLevels.includes(aiResponse.riskLevel)) {
  aiResponse.riskLevel = 'MEDIUM';  // Default to MEDIUM
}

// ========== ENCODE RESPONSE ==========
const encodedResponse = Functions.encodeString(JSON.stringify({
  recommendation: aiResponse.recommendation,
  confidence: Math.floor(aiResponse.confidence),  // Ensure integer
  reasoning: aiResponse.reasoning || 'AI analysis complete',
  riskLevel: aiResponse.riskLevel,
  suggestedAction: aiResponse.suggestedAction || 'Monitor market conditions',
  model: 'gpt-4-turbo',
  provider: 'openai',
  timestamp: Date.now()
}));

return encodedResponse;
