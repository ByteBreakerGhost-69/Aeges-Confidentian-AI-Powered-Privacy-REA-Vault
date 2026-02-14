// frontend/src/components/Layout/Footer.jsx
import React from 'react';
import { useWeb3 } from '../../contexts/Web3Context';

const Footer = () => {
  const { chainId, getExplorerUrl } = useWeb3();

  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left */}
          <div>
            <h4 className="font-bold text-gray-800 mb-2">Aegis Confidential</h4>
            <p className="text-sm text-gray-600">
              AI-Powered Privacy RWA Vault with Chainlink Functions
            </p>
          </div>

          {/* Center */}
          <div>
            <h4 className="font-bold text-gray-800 mb-2">Network</h4>
            <p className="text-sm text-gray-600">
              {chainId === 11155111 && 'Sepolia Testnet'}
              {chainId === 80001 && 'Mumbai Testnet'}
              {!chainId && 'Not Connected'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Chainlink Functions • OpenAI GPT-4 • Google Gemini
            </p>
          </div>

          {/* Right */}
          <div>
            <h4 className="font-bold text-gray-800 mb-2">Resources</h4>
            <div className="space-y-1">
              <a 
                href="https://chain.link/functions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline block"
              >
                Chainlink Functions
              </a>
              <a 
                href="https://platform.openai.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline block"
              >
                OpenAI GPT-4
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>© 2026 Aegis Confidential - Built for Chainlink Hackathon</p>
          <p className="mt-1">
            🤖 Real AI • ⛓️ Chainlink Functions • 🔐 Privacy RWA
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
