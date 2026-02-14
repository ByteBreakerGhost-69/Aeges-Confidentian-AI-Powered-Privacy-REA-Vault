// frontend/src/components/AI/ModelSwitcher.jsx
import React from 'react';

const ModelSwitcher = ({ currentModel, onSwitch, loading }) => {
  const providers = [
    { id: 'openai', name: 'OpenAI GPT-4', icon: '🤖', color: 'green' },
    { id: 'google', name: 'Google Gemini', icon: '✨', color: 'blue' }
  ];

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">Active AI Provider</p>
      <div className="grid grid-cols-2 gap-2">
        {providers.map(({ id, name, icon, color }) => (
          <button
            key={id}
            onClick={() => onSwitch(id)}
            disabled={loading || currentModel.provider === id}
            className={`p-3 rounded-lg border-2 transition ${
              currentModel.provider === id
                ? `border-${color}-500 bg-${color}-50`
                : 'border-gray-200 hover:border-gray-300'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-center">
              <span className="text-2xl block mb-1">{icon}</span>
              <span className={`text-xs font-medium ${
                currentModel.provider === id ? `text-${color}-700` : 'text-gray-600'
              }`}>
                {name}
              </span>
            </div>
          </button>
        ))}
      </div>
      
      {/* Model Info */}
      {currentModel.version && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Version:</span>
            <span className="font-mono">{currentModel.version}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-500">Accuracy:</span>
            <span className="font-medium">{currentModel.accuracy}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSwitcher;
