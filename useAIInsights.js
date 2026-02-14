// frontend/src/hooks/useAIInsights.js
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { AI_CONTROLLER_ABI, CONTRACT_ADDRESSES } from '../constants/abi';
import { toast } from 'react-hot-toast';

export const useAIInsights = () => {
  const { provider, signer, account, chainId } = useWeb3();
  const [controller, setController] = useState(null);
  const [vault, setVault] = useState(null);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [aiModel, setAiModel] = useState({
    version: '',
    provider: '',
    accuracy: 0,
    active: false
  });
  const [pendingRequest, setPendingRequest] = useState(null);

  // ========== INITIALIZE CONTRACTS ==========
  useEffect(() => {
    if (provider && chainId) {
      const addresses = CONTRACT_ADDRESSES[chainId];
      
      if (addresses?.aiController) {
        const controllerContract = new ethers.Contract(
          addresses.aiController,
          AI_CONTROLLER_ABI,
          provider
        );
        setController(controllerContract);
      }
      
      if (addresses?.vault) {
        const vaultContract = new ethers.Contract(
          addresses.vault,
          ['function userInsights(address) view returns (uint256,string,uint256,uint8)'],
          provider
        );
        setVault(vaultContract);
      }
    }
  }, [provider, chainId]);

  // ========== LOAD AI MODEL INFO ==========
  useEffect(() => {
    const loadModelInfo = async () => {
      if (!controller) return;
      
      try {
        const [version, provider, accuracy, active] = await controller.getActiveModel();
        setAiModel({
          version,
          provider,
          accuracy: accuracy.toNumber(),
          active
        });
      } catch (err) {
        console.error('Error loading AI model:', err);
      }
    };
    
    loadModelInfo();
  }, [controller]);

  // ========== LOAD USER INSIGHT ==========
  const loadUserInsight = useCallback(async () => {
    if (!vault || !account) return;

    try {
      const result = await vault.userInsights(account);
      
      if (result.timestamp > 0) {
        setInsight({
          timestamp: new Date(result.timestamp.toNumber() * 1000),
          recommendation: result.recommendation,
          confidence: result.confidence.toNumber(),
          riskLevel: ['LOW', 'MEDIUM', 'HIGH'][result.riskLevel]
        });
      }
    } catch (err) {
      console.error('Error loading insight:', err);
    }
  }, [vault, account]);

  useEffect(() => {
    loadUserInsight();
  }, [loadUserInsight]);

  // ========== LISTEN FOR AI RESPONSE ==========
  useEffect(() => {
    if (!controller || !account) return;

    const filter = controller.filters.AIResponseReceived(account);
    
    const handler = (user, recommendation, confidence) => {
      toast.success('✨ New AI insight received!');
      loadUserInsight();
      setPendingRequest(null);
    };

    controller.on(filter, handler);

    return () => {
      controller.off(filter, handler);
    };
  }, [controller, account, loadUserInsight]);

  // ========== REQUEST AI ANALYSIS ==========
  const requestAIAnalysis = async (assetType = 'Real Estate', riskProfile = 'Moderate') => {
    try {
      setLoading(true);
      
      if (!controller) throw new Error('AI Controller not initialized');
      if (!signer) throw new Error('Please connect wallet');

      toast.loading('🤖 Requesting AI analysis...', { id: 'ai-request' });

      const contract = controller.connect(signer);
      const tx = await contract.requestAIAnalysis(account, assetType, riskProfile);
      
      const receipt = await tx.wait();
      
      // Find AIRequested event
      const event = receipt.events?.find(e => e.event === 'AIRequested');
      const requestId = event?.args?.requestId;
      
      setPendingRequest({
        requestId,
        timestamp: Date.now(),
        assetType,
        riskProfile
      });

      toast.success('AI analysis requested! Waiting for response...', { id: 'ai-request' });

      return { success: true, requestId, tx };

    } catch (err) {
      console.error('AI request error:', err);
      
      let errorMessage = 'Failed to request AI analysis';
      if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient LINK balance';
      } else if (err.message.includes('user rejected')) {
        errorMessage = 'Transaction cancelled';
      }
      
      toast.error(errorMessage, { id: 'ai-request' });
      
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== SWITCH AI PROVIDER ==========
  const switchProvider = async (provider) => {
    try {
      setLoading(true);
      
      if (!controller) throw new Error('Controller not initialized');
      if (!signer) throw new Error('Please connect wallet');

      const contract = controller.connect(signer);
      const tx = await contract.switchProvider(provider);
      await tx.wait();

      // Reload model info
      const [version, prov, accuracy, active] = await controller.getActiveModel();
      setAiModel({
        version,
        provider: prov,
        accuracy: accuracy.toNumber(),
        active
      });

      toast.success(`Switched to ${provider === 'openai' ? 'OpenAI GPT-4' : 'Google Gemini'}`);

      return { success: true };

    } catch (err) {
      console.error('Switch provider error:', err);
      toast.error(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== HELPER FUNCTIONS ==========
  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'BUY': return 'bg-green-100 text-green-800 border-green-200';
      case 'HOLD': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SELL': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return {
    insight,
    aiModel,
    loading,
    pendingRequest,
    requestAIAnalysis,
    switchProvider,
    getRecommendationColor,
    getConfidenceColor
  };
};
