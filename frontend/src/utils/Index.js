export const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Format time to readable string
export const formatTime = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Format datetime
export const formatDateTime = (date) => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

// Calculate time ago
export const getTimeAgo = (timestamp) => {
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);

  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate FSSAI license (14 digits)
export const isValidFSSAI = (license) => {
  return /^\d{14}$/.test(license);
};

// Generate unique ID
export const generateUniqueId = (prefix = 'ID') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

// Format number with commas
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Convert kg to other units
export const convertWeight = (kg, unit = 'kg') => {
  switch (unit) {
    case 'g':
      return kg * 1000;
    case 'ton':
      return kg / 1000;
    case 'lb':
      return kg * 2.20462;
    default:
      return kg;
  }
};

// Get status color
export const getStatusColor = (status) => {
  switch (status) {
    case 'In Transit':
      return '#FF9800';
    case 'Delivered':
      return '#4CAF50';
    case 'At Warehouse':
      return '#2196F3';
    case 'At Farm':
      return '#9E9E9E';
    default:
      return '#9E9E9E';
  }
};

// Get severity color (for alerts)
export const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical':
      return '#D32F2F';
    case 'high':
      return '#F57C00';
    case 'medium':
      return '#FBC02D';
    case 'low':
      return '#388E3C';
    default:
      return '#9E9E9E';
  }
};

// Validate batch ID format
export const isValidBatchId = (batchId) => {
  return /^BATCH-\d+-[A-Z0-9]+$/.test(batchId);
};

// Parse QR code data
export const parseQRData = (data) => {
  try {
    const parsed = JSON.parse(data);
    if (parsed.batchId) {
      return parsed;
    }
    throw new Error('Invalid QR code format');
  } catch (error) {
    throw new Error('Failed to parse QR code data');
  }
};

// Calculate expiry warning level
export const getExpiryWarningLevel = (expiryDate) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return { level: 'expired', color: '#D32F2F' };
  if (daysUntilExpiry <= 7) return { level: 'critical', color: '#F57C00' };
  if (daysUntilExpiry <= 30) return { level: 'warning', color: '#FBC02D' };
  return { level: 'normal', color: '#388E3C' };
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default {
  formatDate,
  formatTime,
  formatDateTime,
  getTimeAgo,
  isValidEmail,
  isValidFSSAI,
  generateUniqueId,
  truncateText,
  formatNumber,
  convertWeight,
  getStatusColor,
  getSeverityColor,
  isValidBatchId,
  parseQRData,
  getExpiryWarningLevel,
  debounce,
  deepClone,
  isEmpty,
  capitalize,
};