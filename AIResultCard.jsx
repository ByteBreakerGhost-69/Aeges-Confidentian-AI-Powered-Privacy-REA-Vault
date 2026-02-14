// frontend/src/components/AI/AIResultCard.jsx
import React from 'react';

const AIResultCard = ({ insight, getRecommendationColor, getConfidenceColor }) => {
  if (!insight) return null;

  const timeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="space-y-4">
      {/* Recommendation Badge */}
      <div className={`p-4 rounded-lg border-2 ${getRecommendationColor(insight.recommendation)}`}>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">AI Recommendation</span>
          <span className="text-3xl font-black">{insight.recommendation}</span>
        </div>
      </div>

      {/* Confidence Meter */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Confidence Score</span>
          <span className={`text-sm font-bold ${getConfidenceColor(insight.confidence)}`}>
            {insight.confidence}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000"
            style={{ width: `${insight.confidence}%` }}
          />
        </div>
      </div>

      {/* Risk Level */}
      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600">Risk Level</span>
        <span className={`font-bold ${
          insight.riskLevel === 'LOW' ? 'text-green-600' :
          insight.riskLevel === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {insight.riskLevel}
        </span>
      </div>

      {/* Timestamp */}
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>Generated {timeAgo(insight.timestamp)}</span>
        <span>{insight.timestamp.toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default AIResultCard;
