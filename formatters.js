// frontend/src/utils/formatters.js

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatNumber = (num, decimals = 2) => {
  if (!num) return '0';
  
  const n = parseFloat(num);
  if (isNaN(n)) return '0';
  
  if (n >= 1e9) return (n / 1e9).toFixed(decimals) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(decimals) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(decimals) + 'K';
  
  return n.toFixed(decimals);
};

export const formatCurrency = (amount, currency = 'USD') => {
  if (!amount) return `$0.00`;
  
  const num = parseFloat(amount);
  if (isNaN(num)) return `$0.00`;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

export const formatPercentage = (value) => {
  if (!value) return '0%';
  const num = parseFloat(value);
  return `${num.toFixed(1)}%`;
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};

export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const truncateMiddle = (str, start = 6, end = 4) => {
  if (!str) return '';
  if (str.length <= start + end) return str;
  
  return `${str.slice(0, start)}...${str.slice(-end)}`;
};
