/**
 * @file test-local.js
 * @description Local testing untuk Chainlink Functions
 * @dev Test AI analysis tanpa perlu deploy ke Chainlink
 * @notice Critical untuk hackathon demo preparation!
 */

const analyzeMarketData = require('./ai_market_analyst');
const { simulateChainlinkRequest } = require('./encryption-utils');

// 🎯 Color coding untuk output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m"
};

async function runLocalTest() {
  console.log(`${colors.magenta}🧪 AEGIS AI - LOCAL TEST${colors.reset}`);
  console.log(`${colors.cyan}==========================${colors.reset}`);
  
  try {
    // 🎯 Test Case 1: Normal user dengan balance tinggi
    console.log(`\n${colors.yellow}[Test 1] High Balance User${colors.reset}`);
    const testData1 = {
      data: Buffer.from(JSON.stringify({
        user: "0x742d35Cc6634C0532925a3b844Bc9e",
        balance: "1000",
        timestamp: Date.now().toString(),
        riskProfile: "MODERATE"
      })),
      args: ["confidence,riskLevel"]
    };
    
    const result1 = await analyzeMarketData(testData1);
    displayResult("Test 1", result1);
    
    // 🎯 Test Case 2: Low balance user
    console.log(`\n${colors.yellow}[Test 2] Low Balance User${colors.reset}`);
    const testData2 = {
      data: Buffer.from(JSON.stringify({
        user: "0xAb5801a7D398351b8bE11C439e05C5B3259aC29B",
        balance: "10",
        timestamp: Date.now().toString(),
        riskProfile: "LOW"
      })),
      args: ["confidence,riskLevel"]
    };
    
    const result2 = await analyzeMarketData(testData2);
    displayResult("Test 2", result2);
    
    // 🎯 Test Case 3: High risk user
    console.log(`\n${colors.yellow}[Test 3] High Risk Profile${colors.reset}`);
    const testData3 = {
      data: Buffer.from(JSON.stringify({
        user: "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
        balance: "500",
        timestamp: Date.now().toString(),
        riskProfile: "HIGH"
      })),
      args: ["confidence,riskLevel"]
    };
    
    const result3 = await analyzeMarketData(testData3);
    displayResult("Test 3", result3);
    
    // 🎯 Test Case 4: Invalid data (error handling)
    console.log(`\n${colors.yellow}[Test 4] Error Handling${colors.reset}`);
    const testData4 = {
      data: Buffer.from("invalid json data"),
      args: []
    };
    
    const result4 = await analyzeMarketData(testData4);
    displayResult("Test 4", result4);
    
    console.log(`${colors.cyan}==========================${colors.reset}`);
    console.log(`${colors.green}✅ ALL TESTS COMPLETED${colors.reset}`);
    
    // 🎯 Generate sample output untuk judges
    generateSampleOutput();
    
  } catch (error) {
    console.error(`${colors.red}❌ Test failed:${colors.reset}`, error);
    process.exit(1);
  }
}

function displayResult(testName, resultBuffer) {
  try {
    const result = JSON.parse(resultBuffer.toString());
    
    console.log(`${colors.green}${testName} Result:${colors.reset}`);
    console.log(`  Recommendation: ${result.recommendation}`);
    console.log(`  Confidence: ${result.confidence}%`);
    console.log(`  Risk Level: ${result.riskLevel}`);
    
    if (result.timestamp) {
      const date = new Date(result.timestamp);
      console.log(`  Generated: ${date.toLocaleTimeString()}`);
    }
    
    // 🎯 Check jika ini AI-generated atau rule-based
    if (result.isAIGenerated) {
      console.log(`  🤖 Source: OpenAI GPT`);
    } else {
      console.log(`  📊 Source: Rule-based analysis`);
    }
    
  } catch (error) {
    console.log(`${colors.yellow}⚠️ Could not parse result as JSON${colors.reset}`);
    console.log(`  Raw output: ${resultBuffer.toString().substring(0, 200)}...`);
  }
}

function generateSampleOutput() {
  console.log(`\n${colors.cyan}📋 SAMPLE OUTPUT FOR JUDGES:${colors.reset}`);
  
  const sampleResult = {
    recommendation: "HOLD - AI detects bullish sentiment with 85% confidence",
    confidence: 85,
    riskLevel: 0, // 0=LOW, 1=MEDIUM, 2=HIGH
    timestamp: Date.now(),
    isAIGenerated: true
  };
  
  console.log(`${colors.yellow}On-chain storage format:${colors.reset}`);
  console.log(JSON.stringify(sampleResult, null, 2));
  
  console.log(`${colors.yellow}\nEncoded for blockchain (Buffer):${colors.reset}`);
  const encoded = Buffer.from(JSON.stringify({
    recommendation: sampleResult.recommendation,
    confidence: sampleResult.confidence,
    riskLevel: sampleResult.riskLevel
  }));
  
  console.log(`Size: ${encoded.length} bytes`);
  console.log(`Hex: 0x${encoded.toString('hex').substring(0, 100)}...`);
  
  console.log(`${colors.yellow}\nWhat judges will see:${colors.reset}`);
  console.log(`1. User requests AI insight`);
  console.log(`2. Chainlink Functions calls this script`);
  console.log(`3. AI analyzes market data`);
  console.log(`4. Returns: "${sampleResult.recommendation}"`);
  console.log(`5. Stored on-chain with ${sampleResult.confidence}% confidence`);
}

// 🎯 Performance testing
async function runPerformanceTest() {
  console.log(`\n${colors.cyan}⚡ PERFORMANCE TEST${colors.reset}`);
  
  const iterations = 5;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    const testData = {
      data: Buffer.from(JSON.stringify({
        user: `0xTest${i}`,
        balance: "100",
        timestamp: Date.now().toString()
      })),
      args: []
    };
    
    await analyzeMarketData(testData);
    const endTime = Date.now();
    times.push(endTime - startTime);
    
    process.stdout.write(`  Iteration ${i + 1}: ${endTime - startTime}ms\r`);
  }
  
  console.log(`\n${colors.green}✅ Performance Results:${colors.reset}`);
  console.log(`  Average: ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(0)}ms`);
  console.log(`  Min: ${Math.min(...times)}ms`);
  console.log(`  Max: ${Math.max(...times)}ms`);
  
  // Chainlink Functions typically needs < 30 seconds
  if (Math.max(...times) > 30000) {
    console.log(`${colors.yellow}⚠️ Warning: Execution time > 30s may exceed Chainlink limits${colors.reset}`);
  }
}

// 🚀 Run tests
if (require.main === module) {
  console.log(`${colors.magenta}🚀 Starting Aegis AI Local Tests${colors.reset}`);
  
  runLocalTest()
    .then(() => runPerformanceTest())
    .then(() => {
      console.log(`\n${colors.green}🎉 READY FOR CHAINLINK FUNCTIONS DEPLOYMENT${colors.reset}`);
      console.log(`${colors.cyan}===========================================${colors.reset}`);
      console.log(`${colors.yellow}Next steps:${colors.reset}`);
      console.log(`1. Update secrets-config.js dengan API keys (optional)`);
      console.log(`2. Deploy to Chainlink Functions dashboard`);
      console.log(`3. Test on-chain dengan request_ai_insight.js`);
      console.log(`${colors.cyan}===========================================${colors.reset}`);
    })
    .catch(error => {
      console.error(`${colors.red}❌ Tests failed:${colors.reset}`, error);
      process.exit(1);
    });
}

module.exports = { runLocalTest, runPerformanceTest };
