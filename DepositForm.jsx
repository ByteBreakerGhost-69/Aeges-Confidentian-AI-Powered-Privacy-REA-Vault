// frontend/src/components/Vault/DepositForm.jsx
import React, { useState } from 'react';
import { CONTRACT_ADDRESSES } from '../../constants/abi';
import { useWeb3 } from '../../contexts/Web3Context';

const DepositForm = ({ onSubmit, loading }) => {
  const { chainId } = useWeb3();
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('');

  // Available RWA tokens (from deployed contracts)
  const rwaTokens = chainId ? CONTRACT_ADDRESSES[chainId]?.rwaTokens || [] : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !token) return;
    
    const result = await onSubmit(token, amount);
    if (result?.success) {
      setAmount('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Token Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select RWA Token
        </label>
        <select
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Choose token...</option>
          {rwaTokens.map((rwa, index) => (
            <option key={index} value={rwa.address}>
              {rwa.symbol} - {rwa.name}
            </option>
          ))}
        </select>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount to Deposit
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button
            type="button"
            onClick={() => setAmount('100')}
            className="absolute right-2 top-2 text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
          >
            Max
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !amount || !token}
        className={`w-full py-3 px-4 rounded-lg text-white font-medium transition ${
          loading || !amount || !token
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          'Deposit Assets'
        )}
      </button>

      {/* Info */}
      <p className="text-xs text-gray-500 text-center mt-2">
        💡 1:1 share ratio. AI analysis will be triggered after deposit.
      </p>
    </form>
  );
};

export default DepositForm;
