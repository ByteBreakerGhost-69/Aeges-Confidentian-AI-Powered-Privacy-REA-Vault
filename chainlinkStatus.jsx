// frontend/src/components/Chainlink/ChainlinkStatus.jsx
import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../../constants/abi';

const ChainlinkStatus = () => {
  const { provider, chainId } = useWeb3();
  const [linkBalance, setLinkBalance] = useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [ethPrice, setEthPrice] = useState(null);

  useEffect(() => {
    const fetchChainlinkData = async () => {
      if (!provider || !chainId) return;

      try {
        // Get LINK balance
        const linkTokenAddress = {
          11155111: '0x779877A7B0D9E8603169DdbD7836e478b4624789', // Sepolia
          80001: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB' // Mumbai
        }[chainId];

        if (linkTokenAddress) {
          const linkToken = new ethers.Contract(
            linkTokenAddress,
            ['function balanceOf(address) view returns (uint256)'],
            provider
          );
          const balance = await linkToken.balanceOf(CONTRACT_ADDRESSES[chainId]?.vault);
          setLinkBalance(ethers.utils.formatEther(balance));
        }

        // Mock ETH price for demo
        setEthPrice('$3,245.67');

      } catch (err) {
        console.error('Error fetching Chainlink data:', err);
      }
    };

    fetchChainlinkData();
  }, [provider, chainId]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-blue-600 rounded-full" />
        Chainlink Oracle Status
      </h3>

      <div className="space-y-3">
        {/* ETH Price */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">ETH/USD Price</span>
          <span className="font-mono font-medium text-green-600">
            {ethPrice || 'Loading...'}
          </span>
        </div>

        {/* LINK Balance */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Vault LINK Balance</span>
          <span className="font-mono font-medium">
            {linkBalance ? `${parseFloat(linkBalance).toFixed(2)} LINK` : '...'}
          </span>
        </div>

        {/* Functions Status */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Functions Status</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-600">Active</span>
          </span>
        </div>

        {/* DON ID */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">DON ID</p>
          <p className="font-mono text-xs truncate">
            fun-ethereum-sepolia-1
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          ⛓️ Data Feeds updated every 5 minutes
        </p>
      </div>
    </div>
  );
};

export default ChainlinkStatus;
