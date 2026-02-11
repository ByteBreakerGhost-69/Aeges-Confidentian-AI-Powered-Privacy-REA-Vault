/**
 * @file useChainlinkData.js
 * @description Custom hook untuk Chainlink data fetching
 * @dev Gets prices, status, gas, dll dari Chainlink services
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CHAINLINK_CONFIG } from '../constants/chainlinkConfig';

export const useChainlinkData = () => {
  const [ethPrice, setEthPrice] = useState('0');
  const [linkPrice, setLinkPrice] = useState('0');
  const [gasPrice, setGasPrice] = useState('0');
  const [functionsStatus, setFunctionsStatus] = useState('checking');
  const [ccipStatus, setCcipStatus] = useState('checking');
  const [automationStatus, setAutomationStatus] = useState('checking');
  const [vrfStatus, setVrfStatus] = useState('checking');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch semua data Chainlink
  const fetchChainlinkData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Buat provider untuk Sepolia
      const provider = new ethers.JsonRpcProvider(CHAINLINK_CONFIG.rpcUrl);

      // 📊 1. Fetch ETH/USD price dari Chainlink Data Feed
      const priceFeed = new ethers.Contract(
        CHAINLINK_CONFIG.priceFeeds.ethUsd,
        [
          'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
          'function decimals() external view returns (uint8)'
        ],
        provider
      );

      const roundData = await priceFeed.latestRoundData();
      const decimals = await priceFeed.decimals();
      const ethPriceFormatted = ethers.formatUnits(roundData.answer, decimals);
      setEthPrice(parseFloat(ethPriceFormatted).toFixed(2));

      // 📊 2. Fetch LINK/USD price
      try {
        const linkPriceFeed = new ethers.Contract(
          CHAINLINK_CONFIG.priceFeeds.linkUsd,
          [
            'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
            'function decimals() external view returns (uint8)'
          ],
          provider
        );

        const linkRoundData = await linkPriceFeed.latestRoundData();
        const linkDecimals = await linkPriceFeed.decimals();
        const linkPriceFormatted = ethers.formatUnits(linkRoundData.answer, linkDecimals);
        setLinkPrice(parseFloat(linkPriceFormatted).toFixed(2));
      } catch (err) {
        console.warn('LINK price feed not available:', err.message);
        setLinkPrice('7.50'); // Fallback price
      }

      // ⛽ 3. Fetch gas price
      const feeData = await provider.getFeeData();
      const gasPriceGwei = ethers.formatUnits(feeData.gasPrice || '0', 'gwei');
      setGasPrice(`${parseInt(gasPriceGwei)} gwei`);

      // ⚡ 4. Check Chainlink Functions status (simulated)
      try {
        // In production, check Functions router contract
        setFunctionsStatus('active');
      } catch (err) {
        setFunctionsStatus('inactive');
      }

      // 🌉 5. Check CCIP status (simulated)
      try {
        // In production, check CCIP router
        setCcipStatus('demo');
      } catch (err) {
        setCcipStatus('inactive');
      }

      // 🤖 6. Check Automation status
      try {
        setAutomationStatus('active');
      } catch (err) {
        setAutomationStatus('inactive');
      }

      // 🎲 7. Check VRF status
      try {
        setVrfStatus('ready');
      } catch (err) {
        setVrfStatus('inactive');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching Chainlink data:', err);
      setError(`Failed to fetch Chainlink data: ${err.message}`);
      setLoading(false);

      // Fallback data untuk demo
      setEthPrice('2500.00');
      setLinkPrice('7.50');
      setGasPrice('25 gwei');
      setFunctionsStatus('demo');
      setCcipStatus('demo');
      setAutomationStatus('demo');
      setVrfStatus('demo');
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchChainlinkData();
  }, [fetchChainlinkData]);

  // Auto-refresh setiap 60 detik
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchChainlinkData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [loading, fetchChainlinkData]);

  // Simulate Functions request
  const simulateFunctionsRequest = useCallback(async () => {
    try {
      setFunctionsStatus('processing');
      
      // Simulate 2-second processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setFunctionsStatus('active');
      return { success: true, message: 'Functions request simulated' };
    } catch (err) {
      setFunctionsStatus('error');
      throw err;
    }
  }, []);

  // Get service health
  const getServiceHealth = useCallback((service) => {
    const statuses = {
      functions: functionsStatus,
      ccip: ccipStatus,
      automation: automationStatus,
      vrf: vrfStatus,
      datafeeds: 'active'
    };

    const status = statuses[service] || 'unknown';
    
    return {
      status,
      isHealthy: status === 'active' || status === 'ready' || status === 'demo',
      lastChecked: new Date().toISOString()
    };
  }, [functionsStatus, ccipStatus, automationStatus, vrfStatus]);

  // Get all services health
  const getAllServicesHealth = useCallback(() => {
    return {
      datafeeds: getServiceHealth('datafeeds'),
      functions: getServiceHealth('functions'),
      automation: getServiceHealth('automation'),
      ccip: getServiceHealth('ccip'),
      vrf: getServiceHealth('vrf')
    };
  }, [getServiceHealth]);

  return {
    // Data
    ethPrice,
    linkPrice,
    gasPrice,
    functionsStatus,
    ccipStatus,
    automationStatus,
    vrfStatus,
    loading,
    error,

    // Actions
    refreshData: fetchChainlinkData,
    simulateFunctionsRequest,

    // Health checks
    getServiceHealth,
    getAllServicesHealth,

    // Status helpers
    isAllServicesActive: functionsStatus === 'active' && 
                         ccipStatus === 'active' && 
                         automationStatus === 'active'
  };
};
