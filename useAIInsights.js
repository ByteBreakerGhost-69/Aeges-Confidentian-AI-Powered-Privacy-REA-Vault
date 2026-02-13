// frontend/hooks/useAIInsights.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useEthereum } from './useEthereum';

// ✅ ABI untuk AegisAIController
const AI_CONTROLLER_ABI = [
  "function requestAIAnalysis(address user, string calldata assetType, string calldata riskProfile) external returns (bytes32)",
  "function getRequestStatus(bytes32 requestId) external view returns (address user, uint256 timestamp, bool exists)",
  "function getActiveModel() external view returns (string version, string provider, uint256 accuracy, bool active)",
  "function switchProvider(string calldata provider) external",
  
  "event AIRequested(address indexed user, bytes32 indexed requestId)",
  "event AIResponseReceived(address indexed user, string recommendation, uint256 confidence)",
  "event AIRequestFailed(bytes32 indexed requestId, string error)"
];

// ✅ ABI untuk AegisVault (bagian AI)
const VAULT_AI_ABI = [
  "function userInsights(address user) external view returns (uint256 timestamp, string recommendation, uint256 confidence, uint8 riskLevel)"
];

export const useAIInsights = (controllerAddress, vaultAddress) => {
  const { provider, signer, account } = useEthereum();
  const [controller, setController] = useState(null);
  const [vault, setVault] = useState(null);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiModel, setAiModel] = useState({ version: '', provider: '', accuracy: 0 });
  
  // ========== INITIALIZE ==========
  useEffect(() => {
    if (provider) {
      if (controllerAddress) {
        const controllerContract = new ethers.Contract(
          controllerAddress,
          AI_CONTROLLER_ABI,
          provider
        );
        setController(controllerContract);
      }
      
      if (vaultAddress) {
        const vaultContract = new ethers.Contract(
          vaultAddress,
          VAULT_AI_ABI,
          provider
        );
        setVault(vaultContract);
      }
    }
  }, [provider, controllerAddress, vaultAddress]);
  
  // ========== LOAD AI MODEL INFO ==========
  useEffect(() => {
    const loadModelInfo = async () => {
      if (!controller) return;
      
      try {
        const [version, provider, accuracy, active] = await controller.getActiveModel();
        setAiModel({ version, provider, accuracy: accuracy.toNumber(), active });
      } catch (err) {
        console.error('Error loading AI model:', err);
      }
    };
    
    loadModelInfo();
  }, [controller]);
  
  // ========== LOAD USER INSIGHT ==========
  useEffect(() => {
    const loadUserInsight = async () => {
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
    };
    
    loadUserInsight();
    
    // Listen untuk AI response
    if (controller) {
      const filter = controller.filters.AIResponseReceived(account);
      
      controller.on(filter, (user, recommendation, confidence) => {
        console.log('🎯 AI Insight Received!', { recommendation, confidence });
        loadUserInsight(); // Reload insight
      });
      
      return () => {
        controller.removeAllListeners(filter);
      };
    }
  }, [vault, controller, account]);
  
  // ========== REQUEST AI ANALYSIS ==========
  const requestAIAnalysis = async (assetType = 'Real Estate', riskProfile = 'Moderate') => {
    try {
      setLoading(true);
      setError(null);
      
      if (!controller) throw new Error('AI Controller not initialized');
      if (!account) throw new Error('No account connected');
      
      console.log(`🤖 Requesting AI analysis...`, { assetType, riskProfile });
      
      const contract = controller.connect(signer);
      const tx = await contract.requestAIAnalysis(account, assetType, riskProfile);
      const receipt = await tx.wait();
      
      // Cari event AIRequested
      const event = receipt.events?.find(e => e.event === 'AIRequested');
      const requestId = event?.args?.requestId;
      
      console.log(`✅ AI Request sent! Request ID: ${requestId}`);
      
      setLoading(false);
      return { success: true, requestId, tx, receipt };
      
    } catch (err) {
      console.error('❌ AI Request failed:', err);
      
      // User-friendly error messages
      let errorMessage = 'Failed to get AI insight';
      
      if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient LINK balance. Please fund subscription.';
      } else if (err.message.includes('user rejected')) {
        errorMessage = 'Transaction cancelled';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'AI request timeout. Please try again.';
      } else if (err.message.includes('API key')) {
        errorMessage = 'OpenAI API key configuration issue';
      }
      
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };
  
  // ========== SWITCH AI PROVIDER ==========
  const switchProvider = async (provider) => {
    try {
      setLoading(true);
      
      const contract = controller.connect(signer);
      const tx = await contract.switchProvider(provider);
      await tx.wait();
      
      console.log(`✅ Switched to ${provider}`);
      
      // Reload model info
      const [version, prov, accuracy, active] = await controller.getActiveModel();
      setAiModel({ version, provider: prov, accuracy: accuracy.toNumber(), active });
      
      setLoading(false);
      return { success: true };
      
    } catch (err) {
      console.error('❌ Failed to switch provider:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };
  
  // ========== FORMAT RECOMMENDATION ==========
  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'BUY': return 'text-green-600 bg-green-100';
      case 'HOLD': return 'text-yellow-600 bg-yellow-100';
      case 'SELL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  return {
    insight,
    loading,
    error,
    aiModel,
    requestAIAnalysis,
    switchProvider,
    getRecommendationColor,
    getRiskLevelColor,
    isConnected: !!account
  };
};
