// frontend/src/hooks/useAegisVault.js
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { VAULT_ABI, CONTRACT_ADDRESSES } from '../constants/abi';
import { toast } from 'react-hot-toast';

export const useAegisVault = () => {
  const { provider, signer, account, chainId } = useWeb3();
  const [vault, setVault] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAssets: '0',
    totalShares: '0',
    userShares: '0',
    userValueUSD: '0',
    hasSubscription: false
  });

  // ========== INITIALIZE CONTRACT ==========
  useEffect(() => {
    if (provider && chainId) {
      const address = CONTRACT_ADDRESSES[chainId]?.vault;
      if (address) {
        const contract = new ethers.Contract(address, VAULT_ABI, provider);
        setVault(contract);
      }
    }
  }, [provider, chainId]);

  // ========== LOAD VAULT STATS ==========
  const loadStats = useCallback(async () => {
    if (!vault || !account) return;

    try {
      const [totalAssets, totalShares, userShares, subscription] = await Promise.all([
        vault.totalAssets(),
        vault.totalShares(),
        vault.shares(account),
        vault.hasActiveSubscription(account)
      ]);

      // Get ETH price in USD
      let userValueUSD = '0';
      if (userShares > 0) {
        const price = await vault.getAssetValueInUSD(userShares);
        userValueUSD = ethers.utils.formatEther(price);
      }

      setStats({
        totalAssets: ethers.utils.formatEther(totalAssets),
        totalShares: ethers.utils.formatEther(totalShares),
        userShares: ethers.utils.formatEther(userShares),
        userValueUSD: (parseFloat(userValueUSD) * parseFloat(ethers.utils.formatEther(userShares))).toFixed(2),
        hasSubscription: subscription
      });

    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [vault, account]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ========== DEPOSIT ==========
  const deposit = async (rwaToken, amount) => {
    try {
      setLoading(true);
      
      if (!signer) throw new Error('Please connect wallet');
      if (!stats.hasSubscription) throw new Error('No active subscription');

      const contract = vault.connect(signer);
      const tx = await contract.deposit(rwaToken, ethers.utils.parseEther(amount));
      
      toast.loading('Processing deposit...', { id: 'deposit' });
      
      const receipt = await tx.wait();
      
      toast.success('Deposit successful!', { id: 'deposit' });
      
      await loadStats();
      
      return { success: true, tx, receipt };

    } catch (err) {
      console.error('Deposit error:', err);
      toast.error(err.message, { id: 'deposit' });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== WITHDRAW ==========
  const withdraw = async (rwaToken, shareAmount) => {
    try {
      setLoading(true);
      
      if (!signer) throw new Error('Please connect wallet');

      const contract = vault.connect(signer);
      const tx = await contract.withdraw(rwaToken, ethers.utils.parseEther(shareAmount));
      
      toast.loading('Processing withdrawal...', { id: 'withdraw' });
      
      const receipt = await tx.wait();
      
      toast.success('Withdrawal successful!', { id: 'withdraw' });
      
      await loadStats();
      
      return { success: true, tx, receipt };

    } catch (err) {
      console.error('Withdraw error:', err);
      toast.error(err.message, { id: 'withdraw' });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    vault,
    stats,
    loading,
    deposit,
    withdraw,
    refreshStats: loadStats
  };
};
