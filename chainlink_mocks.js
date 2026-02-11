/**
 * @file chainlink_mocks.js
 * @description Mock contracts untuk testing Chainlink integration
 * @dev Provides mock implementations untuk testing tanpa real Chainlink
 */

const { ethers } = require("hardhat");

/**
 * Mock LINK Token untuk testing
 */
async function deployMockLinkToken() {
  const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
  const linkToken = await MockLinkToken.deploy();
  await linkToken.waitForDeployment();
  return linkToken;
}

/**
 * Mock Chainlink Oracle untuk testing Functions
 */
async function deployMockOracle(linkTokenAddress) {
  const MockOracle = await ethers.getContractFactory("MockOracle");
  const oracle = await MockOracle.deploy(linkTokenAddress);
  await oracle.waitForDeployment();
  return oracle;
}

/**
 * Mock Chainlink Price Feed
 */
async function deployMockPriceFeed() {
  const MockAggregator = await ethers.getContractFactory("MockAggregator");
  const priceFeed = await MockAggregator.deploy(8); // 8 decimals
  await priceFeed.waitForDeployment();
  
  // Set initial price: $2500 ETH/USD
  await priceFeed.updateAnswer(250000000000);
  return priceFeed;
}

/**
 * Mock Chainlink VRF Coordinator
 */
async function deployMockVRFCoordinator(linkTokenAddress) {
  const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinator");
  const vrfCoordinator = await MockVRFCoordinator.deploy(linkTokenAddress);
  await vrfCoordinator.waitForDeployment();
  return vrfCoordinator;
}

/**
 * Mock Chainlink Automation Registry
 */
async function deployMockAutomationRegistry() {
  const MockAutomationRegistry = await ethers.getContractFactory("MockAutomationRegistry");
  const registry = await MockAutomationRegistry.deploy();
  await registry.waitForDeployment();
  return registry;
}

/**
 * Setup complete mock Chainlink environment
 */
async function setupMockChainlinkEnvironment() {
  console.log("🔗 Setting up mock Chainlink environment...");
  
  const [deployer] = await ethers.getSigners();
  
  // Deploy semua mock contracts
  const linkToken = await deployMockLinkToken();
  const priceFeed = await deployMockPriceFeed();
  const oracle = await deployMockOracle(linkToken.target);
  const vrfCoordinator = await deployMockVRFCoordinator(linkToken.target);
  const automationRegistry = await deployMockAutomationRegistry();
  
  console.log("✅ Mock Chainlink environment setup complete!");
  console.log("   LINK Token:", linkToken.target);
  console.log("   Price Feed:", priceFeed.target);
  console.log("   Oracle:", oracle.target);
  console.log("   VRF Coordinator:", vrfCoordinator.target);
  console.log("   Automation Registry:", automationRegistry.target);
  
  return {
    linkToken,
    priceFeed,
    oracle,
    vrfCoordinator,
    automationRegistry,
    
    // Helper untuk testing
    getConfig: () => ({
      priceFeed: priceFeed.target,
      linkToken: linkToken.target,
      oracle: oracle.target,
      vrfCoordinator: vrfCoordinator.target,
      automationRegistry: automationRegistry.target,
      
      // Default values untuk testing
      jobId: ethers.hexlify(ethers.randomBytes(32)),
      fee: ethers.parseEther("0.1"),
      keyHash: "0x" + "00".repeat(32),
      subscriptionId: 1
    }),
    
    // Fund account dengan LINK
    fundWithLINK: async (address, amount) => {
      await linkToken.transfer(address, amount);
      console.log(`💰 Funded ${address} with ${ethers.formatEther(amount)} LINK`);
    },
    
    // Simulate price update
    updatePrice: async (newPrice) => {
      await priceFeed.updateAnswer(newPrice);
      console.log(`📈 Updated price feed to $${ethers.formatUnits(newPrice, 8)}`);
    },
    
    // Simulate Functions fulfillment
    fulfillFunctionsRequest: async (requestId, callbackAddress, callbackFunction, response) => {
      await oracle.fulfillOracleRequest(
        requestId,
        ethers.parseEther("0.1"),
        callbackAddress,
        callbackFunction,
        response
      );
      console.log(`🤖 Fulfilled Functions request ${requestId}`);
    },
    
    // Simulate VRF randomness
    fulfillRandomness: async (requestId, randomness) => {
      await vrfCoordinator.fulfillRandomness(requestId, randomness);
      console.log(`🎲 Fulfilled VRF request with randomness: ${randomness}`);
    }
  };
}

// Mock contract definitions
const MOCK_CONTRACT_DEFINITIONS = {
  MockLinkToken: `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.19;
    
    contract MockLinkToken {
        mapping(address => uint256) private balances;
        
        function transfer(address to, uint256 amount) external returns (bool) {
            balances[msg.sender] -= amount;
            balances[to] += amount;
            return true;
        }
        
        function balanceOf(address account) external view returns (uint256) {
            return balances[account];
        }
    }
  `,
  
  MockOracle: `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.19;
    
    contract MockOracle {
        address public linkToken;
        
        constructor(address _linkToken) {
            linkToken = _linkToken;
        }
        
        function fulfillOracleRequest(
            bytes32 requestId,
            uint256 payment,
            address callbackAddress,
            bytes4 callbackFunctionId,
            bytes memory data
        ) external {
            // Simplified mock - just call the callback
            (bool success, ) = callbackAddress.call(
                abi.encodeWithSelector(callbackFunctionId, requestId, data)
            );
            require(success, "Callback failed");
        }
    }
  `,
  
  MockAggregator: `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.19;
    
    contract MockAggregator {
        uint8 public decimals;
        int256 private answer;
        
        constructor(uint8 _decimals) {
            decimals = _decimals;
            answer = 2500 * 10 ** _decimals; // $2500 default
        }
        
        function latestRoundData() external view returns (
            uint80 roundId,
            int256 _answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            return (1, answer, block.timestamp, block.timestamp, 1);
        }
        
        function updateAnswer(int256 newAnswer) external {
            answer = newAnswer;
        }
    }
  `
};

module.exports = {
  deployMockLinkToken,
  deployMockOracle,
  deployMockPriceFeed,
  deployMockVRFCoordinator,
  deployMockAutomationRegistry,
  setupMockChainlinkEnvironment,
  MOCK_CONTRACT_DEFINITIONS
};
