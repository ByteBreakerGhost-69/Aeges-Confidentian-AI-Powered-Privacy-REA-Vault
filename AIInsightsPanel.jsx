// frontend/src/components/AI/AIInsightsPanel.jsx
import React, { useState } from 'react';
import { useAIInsights } from '../../hooks/useAIInsights';
import AIRequestForm from './AIRequestForm';
import AIResultCard from './AIResultCard';
import ModelSwitcher from './ModelSwitcher';

const AIInsightsPanel = () => {
  const {
    insight,
    aiModel,
    loading,
    pendingRequest,
    requestAIAnalysis,
    switchProvider,
    getRecommendationColor,
    getConfidenceColor
  } = useAIInsights();

  const [showRequestForm, setShowRequestForm] = useState(!insight);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI Investment Advisor
          </h2>
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs text-white">
            {aiModel.provider === 'openai' ? 'GPT-4' : 'Gemini Pro'}
          </div>
        </div>
        <p className="text-white/80 text-sm mt-1">
          Powered by Chainlink Functions + {aiModel.provider === 'openai' ? 'OpenAI' : 'Google Gemini'}
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* AI Result */}
        {insight && (
          <div className="mb-6">
            <AIResultCard 
              insight={insight}
              getRecommendationColor={getRecommendationColor}
              getConfidenceColor={getConfidenceColor}
            />
          </div>
        )}

        {/* Request Form */}
        {showRequestForm ? (
          <AIRequestForm
            onSubmit={requestAIAnalysis}
            loading={loading}
            pendingRequest={pendingRequest}
          />
        ) : (
          <button
            onClick={() => setShowRequestForm(true)}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Request New Analysis
          </button>
        )}

        {/* Model Switcher */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <ModelSwitcher
            currentModel={aiModel}
            onSwitch={switchProvider}
            loading={loading}
          />
        </div>

        {/* Status Info */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>⚡ Gas Limit: 300,000</span>
          <span>🎯 Confidence Threshold: 50%</span>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPanel;
