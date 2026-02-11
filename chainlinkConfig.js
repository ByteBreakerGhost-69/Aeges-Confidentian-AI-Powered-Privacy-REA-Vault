/**
 * @file chainlinkConfig.js
 * @description Chainlink configuration untuk frontend
 * @dev Network-specific addresses dan configuration
 */

// Contract addresses (ganti dengan deployed addresses kamu)
export const CONTRACT_ADDRESSES = {
  AegisVault: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Localhost
  RWAToken: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Localhost
  AegisAIController: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' // Localhost
};

// Sepolia Testnet addresses (contoh)
export const SEPOLIA_ADDRESSES = {
  AegisVault: '0x...', // Ganti dengan address deployed
  RWAToken: '0x...',
  AegisAIController: '0x...',
  ChainlinkPriceFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306', // ETH/USD
  ChainlinkToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789', // LINK
  FunctionsOracle: '0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD'
};

// Chainlink configuration
export const CHAINLINK_CONFIG = {
  networks: {
    localhost: {
      chainId: 31337,
      name: 'Localhost',
      rpcUrl: 'http://localhost:8545',
      explorer: '',
      priceFeeds: {
        ethUsd: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // Mainnet address untuk mock
        linkUsd: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c'
      }
    },
    sepolia: {
      chainId: 11155111,
      name: 'Sepolia',
      rpcUrl: 'https://rpc.sepolia.org',
      explorer: 'https://sepolia.etherscan.io',
      priceFeeds: {
        ethUsd: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
        linkUsd: '0xc59E3633BAAC79493d908e63626716e204A45EdF'
      },
      functions: {
        router: '0xb83E47C2bC239B3bf370bc41e1459A34b41238D0',
        donId: 'fun-ethereum-sepolia-1'
      },
      ccip: {
        router: '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59'
      }
    },
    polygonMumbai: {
      chainId: 80001,
      name: 'Polygon Mumbai',
      rpcUrl: 'https://rpc-mumbai.maticvigil.com',
      explorer: 'https://mumbai.polygonscan.com',
      priceFeeds: {
        maticUsd: '0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada',
        linkUsd: '0x12162c3E810393dEC01362aBf156D7ecf6159528'
      }
    }
  },

  // Default network
  defaultNetwork: 'sepolia',

  // Current configuration (akan di-set berdasarkan network)
  get current() {
    const networkName = localStorage.getItem('network') || this.defaultNetwork;
    return this.networks[networkName] || this.networks[this.defaultNetwork];
  },

  // Set current network
  setNetwork(networkName) {
    if (this.networks[networkName]) {
      localStorage.setItem('network', networkName);
      window.location.reload(); // Refresh untuk apply new network
    }
  },

  // Contract ABIs (akan di-import dari artifacts)
  abis: {
    // Akan di-populate saat build
  }
};

// Utility functions
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const getExplorerUrl = (type, value) => {
  const { explorer } = CHAINLINK_CONFIG.current;
  if (!explorer) return '#';
  
  switch(type) {
    case 'address':
      return `${explorer}/address/${value}`;
    case 'tx':
      return `${explorer}/tx/${value}`;
    case 'token':
      return `${explorer}/token/${value}`;
    default:
      return explorer;
  }
};

export const getNetworkName = (chainId) => {
  for (const [name, config] of Object.entries(CHAINLINK_CONFIG.networks)) {
    if (config.chainId === chainId) {
      return config.name;
    }
  }
  return 'Unknown Network';
};

// Export default
export default CHAINLINK_CONFIG;
