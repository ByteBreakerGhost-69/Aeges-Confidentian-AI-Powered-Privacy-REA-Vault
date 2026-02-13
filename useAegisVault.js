// frontend/hooks/useAegisVault.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useEthereum } from './useEthereum';

// ✅ ABI LENGKAP dengan fungsi AI
const VAULT_ABI = [
  // ========== CORE FUNCTIONS ==========
  "function deposit(address rwaToken, uint256 amount) external returns (uint256)",
  "function withdraw(address rwaToken, uint256 shareAmount) external returns (uint256)",
  
  // ========== AI FUNCTIONS ==========
  "function storeAIInsight(address user, string calldata recommendation, uint256 confidence) external",
  "function userInsights(address user) external view returns (uint256 timestamp, string recommendation, uint256 confidence, uint8 riskLevel)",
  
  // ========== VIEW FUNCTIONS ==========
  "function totalAssets() external view returns (uint256)",
  "function totalShares() external view returns (uint256)",
  "function shares(address user) external view returns (uint256)",
  "function getAssetValueInUSD(uint256 ethAmount) external view returns (uint256)",
  "function hasActiveSubscription(address user) external view returns (bool)",
  
  // ========== EVENTS ==========
  "event Deposit(address indexed user, uint256 assets, uint256 shares)",
  "event Withdraw(address indexed user, uint256 assets, uint256 shares)",
  "event AIReceived(address indexed user, string recommendation, uint256 confidence)"
];

export const useAegisVault = (vaultAddress) => {
  const { provider, signer, account } = useEthereum();
  const [vault, setVault] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ========== INITIALIZE ==========
  useEffect(() => {
    if (provider && vaultAddress) {
      const vaultContract = new ethers.Contract(
        vaultAddress,
        VAULT_ABI,
        provider
      );
      setVault(vaultContract);
    }
  }, [provider, vaultAddress]);
  
  // ========== VAULT FUNCTIONS ==========
  
  const deposit = async (rwaToken, amount) => {
    try {
      setLoading(true);
      setError(null);
      
      const contract = vault.connect(signer);
      const tx = await contract.deposit(rwaToken, amount);
      const receipt = await tx.wait();
      
      // Cari event Deposit
      const event = receipt.events?.find(e => e.event === 'Deposit');
      const shares = event?.args?.shares;
      
      setLoading(false);
      return { success: true, tx, shares, receipt };
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };
  
  const withdraw = async (rwaToken, shareAmount) => {
    try {
      setLoading(true);
      setError(null);
      
      const contract = vault.connect(signer);
      const tx = await contract.withdraw(rwaToken, shareAmount);
      const receipt = await tx.wait();
      
      setLoading(false);
      return { success: true, tx, receipt };
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };
  
  // ========== VIEW FUNCTIONS ==========
  
  const getUserShares = async (userAddress) => {
    try {
      if (!vault) return 0;
      return await vault.shares(userAddress || account);
    } catch (err) {
      console.error('Error getting shares:', err);
      return 0;
    }
  };
  
  const getTotalAssets = async () => {
    try {
      if (!vault) return 0;
      return await vault.totalAssets();
    } catch (err) {
      console.error('Error getting total assets:', err);
      return 0;
    }
  };
  
  const getAssetValue = async (ethAmount) => {
    try {
      if (!vault) return 0;
      return await vault.getAssetValueInUSD(ethAmount);
    } catch (err) {
      console.error('Error getting asset value:', err);
      return 0;
    }
  };
  
  // ========== SUBSCRIPTION ==========
  
  const checkSubscription = async (userAddress) => {
    try {
      if (!vault) return false;
      return await vault.hasActiveSubscription(userAddress || account);
    } catch (err) {
      console.error('Error checking subscription:', err);
      return false;
    }
  };
  
  return {
    vault,
    loading,
    error,
    deposit,
    withdraw,
    getUserShares,
    getTotalAssets,
    getAssetValue,
    checkSubscription
  };
};
