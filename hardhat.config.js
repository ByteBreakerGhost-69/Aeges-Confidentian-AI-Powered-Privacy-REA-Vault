// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
require("solidity-coverage");
require("hardhat-gas-reporter");

// ========== ENVIRONMENT VARIABLES ==========
// Buat file .env dan isi:
// PRIVATE_KEY=your_private_key_here
// SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
// MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/your_api_key
// ETHERSCAN_API_KEY=your_etherscan_api_key
// POLYGONSCAN_API_KEY=your_polygonscan_api_key
// COINMARKETCAP_API_KEY=your_coinmarketcap_api_key (optional untuk gas reporter)

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/your_project_id";
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL || "https://polygon-mumbai.g.alchemy.com/v2/your_api_key";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // ========== SOLIDITY CONFIGURATION ==========
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true, // Untuk contract yang kompleks
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "metadata"],
          "": ["ast"]
        }
      }
    }
  },

  // ========== NETWORK CONFIGURATION ==========
  networks: {
    // Local development
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,
        interval: 5000
      },
      gasPrice: 20000000000, // 20 gwei
      accounts: {
        mnemonic: "test test test test test test test test test test test junk"
      }
    },
    
    // Local node (ganache)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: [PRIVATE_KEY]
    },
    
    // Sepolia Testnet (Ethereum)
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gasPrice: 50000000000, // 50 gwei
      timeout: 60000,
      verify: {
        etherscan: {
          apiUrl: "https://api-sepolia.etherscan.io"
        }
      }
    },
    
    // Mumbai Testnet (Polygon)
    mumbai: {
      url: MUMBAI_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 80001,
      gasPrice: 35000000000, // 35 gwei
      timeout: 60000,
      verify: {
        etherscan: {
          apiUrl: "https://api-testnet.polygonscan.com"
        }
      }
    },
    
    // Amoy Testnet (Polygon baru - recommended)
    amoy: {
      url: "https://rpc-amoy.polygon.technology",
      accounts: [PRIVATE_KEY],
      chainId: 80002,
      gasPrice: 35000000000,
      timeout: 60000
    }
  },

  // ========== GAS REPORTER ==========
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
    gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    token: "ETH",
    showTimeSpent: true,
    showMethodSig: true,
    outputFile: "gas-report.txt",
    noColors: false
  },

  // ========== ETHERSCAN CONFIGURATION ==========
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      mumbai: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
      amoy: POLYGONSCAN_API_KEY
    },
    customChains: [
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io"
        }
      },
      {
        network: "mumbai",
        chainId: 80001,
        urls: {
          apiURL: "https://api-testnet.polygonscan.com/api",
          browserURL: "https://mumbai.polygonscan.com"
        }
      },
      {
        network: "amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        }
      }
    ]
  },

  // ========== PATHS CONFIGURATION ==========
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deployments: "./deployments"
  },

  // ========== MOCHA TEST CONFIGURATION ==========
  mocha: {
    timeout: 60000, // 60 seconds
    parallel: true,
    recursive: true,
    reporter: "spec"
  },

  // ========== TYPEKIT CONFIGURATION (optional) ==========
  typekit: {
    enabled: false
  },

  // ========== DOCGEN CONFIGURATION ==========
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: false
  },

  // ========== CUSTOM TASKS ==========
  tasks: {
    accounts: {
      description: "Prints list of accounts",
      action: async (taskArgs, hre) => {
        const accounts = await hre.ethers.getSigners();
        for (const account of accounts) {
          console.log(account.address);
        }
      }
    },
    balances: {
      description: "Prints balances of accounts",
      action: async (taskArgs, hre) => {
        const accounts = await hre.ethers.getSigners();
        for (const account of accounts) {
          const balance = await account.getBalance();
          console.log(`${account.address}: ${hre.ethers.utils.formatEther(balance)} ETH`);
        }
      }
    }
  }
};

// ========== CUSTOM HARDHAT EXTENSIONS ==========
task("deploy-vault", "Deploys AegisVault and related contracts")
  .addParam("network", "Network to deploy on")
  .setAction(async (taskArgs, hre) => {
    await hre.run("compile");
    const deployScript = require("./scripts/deploy_vault.js");
    await deployScript();
  });

task("request-ai", "Requests AI insight from OpenAI")
  .addParam("asset", "Asset type")
  .addParam("risk", "Risk profile")
  .setAction(async (taskArgs, hre) => {
    const { asset, risk } = taskArgs;
    const requestScript = require("./scripts/request_ai_insight.js");
    process.env.ASSET_TYPE = asset;
    process.env.RISK_PROFILE = risk;
    await requestScript();
  });

task("check-subscription", "Checks Functions subscription balance")
  .addParam("subid", "Subscription ID")
  .setAction(async (taskArgs, hre) => {
    const { subid } = taskArgs;
    const config = require("./frontend/constants/chainlinkConfig");
    const network = hre.network.name;
    
    const functionsRouter = await hre.ethers.getContractAt(
      "FunctionsRouter",
      config[network].functionsRouter
    );
    
    const info = await functionsRouter.getSubscription(subid);
    console.log(`Subscription ${subid}:`);
    console.log(`- Balance: ${hre.ethers.utils.formatEther(info.balance)} LINK`);
    console.log(`- Owner: ${info.owner}`);
    console.log(`- Consumers: ${info.consumers.length}`);
  });
