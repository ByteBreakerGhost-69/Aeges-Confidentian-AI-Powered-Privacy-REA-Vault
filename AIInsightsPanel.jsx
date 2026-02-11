/**
 * @file AIInsightsPanel.jsx
 * @description Display AI insights from Chainlink Functions
 * @dev Shows real AI analysis results dengan visualization
 */

import React, { useState, useEffect } from 'react';
import { useAIInsights } from '../hooks/useAIInsights';
import './AIInsightsPanel.css';

const AIInsightsPanel = () => {
  const { insights, loading, error, fetchInsights, clearInsights } = useAIInsights();
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh insights setiap 30 detik
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchInsights();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchInsights]);

  // Load insights on component mount
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  // Get risk level color
  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 0: return '#10B981'; // LOW - green
      case 1: return '#F59E0B'; // MEDIUM - yellow
      case 2: return '#EF4444'; // HIGH - red
      default: return '#6B7280'; // DEFAULT - gray
    }
  };

  // Get risk label
  const getRiskLabel = (riskLevel) => {
    switch(riskLevel) {
      case 0: return 'LOW';
      case 1: return 'MEDIUM';
      case 2: return 'HIGH';
      default: return 'UNKNOWN';
    }
  };

  // Render confidence bar
  const ConfidenceBar = ({ confidence }) => {
    const width = Math.min(100, Math.max(0, confidence));
    
    let color;
    if (confidence >= 80) color = '#10B981'; // High confidence - green
    else if (confidence >= 60) color = '#F59E0B'; // Medium confidence - yellow
    else color = '#EF4444'; // Low confidence - red

    return (
      <div className="confidence-bar-container">
        <div 
          className="confidence-bar-fill"
          style={{ width: `${width}%`, backgroundColor: color }}
        ></div>
        <div className="confidence-bar-text">{confidence}%</div>
      </div>
    );
  };

  if (loading && !insights.length) {
    return (
      <div className="ai-insights-loading">
        <div className="spinner"></div>
        <p>Loading AI Insights from Chainlink Functions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-insights-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Insights</h3>
        <p>{error}</p>
        <button className="btn btn-retry" onClick={fetchInsights}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="ai-insights-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <h2 className="panel-title">🤖 AI Investment Insights</h2>
        <div className="panel-controls">
          <div className="refresh-control">
            <label className="switch">
              <input 
                type="checkbox" 
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
            <span className="control-label">Auto-refresh</span>
          </div>
          <button className="btn btn-refresh" onClick={fetchInsights}>
            🔄 Refresh
          </button>
          <button className="btn btn-clear" onClick={clearInsights}>
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Insights Grid */}
      {insights.length > 0 ? (
        <div className="insights-container">
          {/* Selected Insight Detail */}
          {selectedInsight && (
            <div className="insight-detail">
              <div className="detail-header">
                <h3>Detailed Analysis</h3>
                <button 
                  className="btn-close"
                  onClick={() => setSelectedInsight(null)}
                >
                  ×
                </button>
              </div>
              
              <div className="detail-content">
                <div className="detail-row">
                  <span className="detail-label">Recommendation:</span>
                  <span className="detail-value">{selectedInsight.recommendation}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Confidence:</span>
                  <div className="detail-value">
                    <ConfidenceBar confidence={selectedInsight.confidence} />
                  </div>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Risk Level:</span>
                  <span 
                    className="risk-badge"
                    style={{ backgroundColor: getRiskColor(selectedInsight.riskLevel) }}
                  >
                    {getRiskLabel(selectedInsight.riskLevel)}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Generated:</span>
                  <span className="detail-value">{formatTime(selectedInsight.timestamp)}</span>
                </div>
                
                <div className="detail-row full-width">
                  <span className="detail-label">Analysis Source:</span>
                  <span className="detail-value">
                    {selectedInsight.isAIGenerated ? 
                      '🤖 OpenAI GPT-4 + Chainlink Functions' : 
                      '📊 Rule-based Analysis + Chainlink Data Feeds'}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="detail-actions">
                  <button className="btn btn-follow">
                    📈 Follow This Advice
                  </button>
                  <button className="btn btn-ignore">
                    🙅 Ignore
                  </button>
                  <button className="btn btn-share">
                    ↗️ Share Analysis
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Insights Grid */}
          <div className="insights-grid">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={`insight-card ${selectedInsight === insight ? 'selected' : ''}`}
                onClick={() => setSelectedInsight(insight)}
              >
                <div className="insight-card-header">
                  <div className="insight-icon">
                    {insight.isAIGenerated ? '🤖' : '📊'}
                  </div>
                  <div className="insight-title">
                    <h4>AI Insight #{index + 1}</h4>
                    <span className="insight-time">
                      {formatTime(insight.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="insight-content">
                  <p className="insight-recommendation">
                    {insight.recommendation}
                  </p>
                  
                  <div className="insight-metrics">
                    <div className="metric">
                      <span className="metric-label">Confidence</span>
                      <ConfidenceBar confidence={insight.confidence} />
                    </div>
                    
                    <div className="metric">
                      <span className="metric-label">Risk</span>
                      <div className="risk-indicator">
                        <div 
                          className="risk-dot"
                          style={{ backgroundColor: getRiskColor(insight.riskLevel) }}
                        ></div>
                        <span>{getRiskLabel(insight.riskLevel)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="insight-tags">
                    <span className="tag chainlink-tag">Chainlink Functions</span>
                    <span className="tag ai-tag">
                      {insight.isAIGenerated ? 'AI-Powered' : 'Rule-Based'}
                    </span>
                    <span className="tag privacy-tag">🔒 Privacy-Preserving</span>
                  </div>
                </div>

                <div className="insight-actions">
                  <button className="btn btn-view" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedInsight(insight);
                  }}>
                    View Details
                  </button>
                  <button className="btn btn-action">
                    {insight.recommendation.includes('BUY') ? '💰 Buy' : 
                     insight.recommendation.includes('SELL') ? '💸 Sell' : '📊 Hold'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-insights">
          <div className="no-insights-icon">🤖</div>
          <h3>No AI Insights Yet</h3>
          <p>
            Request your first AI investment insight using Chainlink Functions.
            The AI will analyze market data and provide personalized recommendations.
          </p>
          <div className="no-insights-features">
            <div className="feature">
              <span className="feature-icon">🔮</span>
              <span className="feature-text">Predictive Analysis</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📈</span>
              <span className="feature-text">Market Intelligence</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🔒</span>
              <span className="feature-text">Privacy-First</span>
            </div>
          </div>
        </div>
      )}

      {/* Chainlink Functions Process */}
      <div className="functions-process">
        <h3 className="process-title">⚡ How Chainlink Functions Powers AI Insights</h3>
        <div className="process-steps">
          <div className="process-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>On-Chain Request</h4>
              <p>User requests AI insight via smart contract</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Chainlink DON</h4>
              <p>Decentralized Oracle Network picks up request</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>AI Analysis</h4>
              <p>Our JavaScript function analyzes market data</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>On-Chain Result</h4>
              <p>AI recommendation stored on blockchain</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPanel;
