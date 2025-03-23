/**
 * Formatting utility functions for HaulHub application
 */

/**
 * Formats a number as currency (USD by default)
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - Currency code (default: 'USD')
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD', locale = 'en-US') => {
    if (amount === null || amount === undefined) return '-';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  /**
   * Formats cryptocurrency amounts (ETH, tokens)
   * @param {number} amount - The amount to format
   * @param {string} symbol - Currency symbol (default: 'ETH')
   * @param {number} decimals - Number of decimal places to show (default: 6)
   * @returns {string} - Formatted crypto amount
   */
  export const formatCrypto = (amount, symbol = 'ETH', decimals = 6) => {
    if (amount === null || amount === undefined) return '-';
    
    // Format the number with the specified decimal places
    const formattedNumber = parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
    
    return `${formattedNumber} ${symbol}`;
  };
  
  /**
   * Formats a date in a readable format
   * @param {Date|string|number} date - Date to format
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} - Formatted date string
   */
  export const formatDate = (date, options = {}) => {
    if (!date) return '-';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Default options
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    return new Intl.DateTimeFormat('en-US', mergedOptions).format(dateObj);
  };
  
  /**
   * Formats a date relative to the current time (e.g., "5 minutes ago")
   * @param {Date|string|number} date - Date to format
   * @returns {string} - Relative time string
   */
  export const formatRelativeTime = (date) => {
    if (!date) return '-';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    // Less than a minute
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Less than a month
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    
    // Less than a year
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    
    // More than a year
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  };
  
  /**
   * Format a distance in miles or kilometers
   * @param {number} distance - Distance in miles
   * @param {boolean} useMetric - Whether to use kilometers instead of miles
   * @returns {string} - Formatted distance string
   */
  export const formatDistance = (distance, useMetric = false) => {
    if (distance === null || distance === undefined) return '-';
    
    if (useMetric) {
      // Convert miles to kilometers (1 mile = 1.60934 km)
      const kilometers = distance * 1.60934;
      return `${kilometers.toFixed(2)} km`;
    }
    
    return `${distance.toFixed(2)} mi`;
  };
  
  /**
   * Format a duration in a human-readable format
   * @param {number} minutes - Duration in minutes
   * @returns {string} - Formatted duration string
   */
  export const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return '-';
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }
    
    return `${hours} hr ${remainingMinutes} min`;
  };
  
  /**
   * Formats a file size in a human-readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} - Formatted size string
   */
  export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    if (!bytes) return '-';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  /**
   * Formats a blockchain transaction hash for display
   * @param {string} hash - Transaction hash
   * @param {number} startChars - Number of starting characters to show (default: 6)
   * @param {number} endChars - Number of ending characters to show (default: 4)
   * @returns {string} - Formatted transaction hash
   */
  export const formatTransactionHash = (hash, startChars = 6, endChars = 4) => {
    if (!hash) return '-';
    
    if (hash.length <= startChars + endChars) {
      return hash;
    }
    
    return `${hash.substring(0, startChars)}...${hash.substring(hash.length - endChars)}`;
  };
  
  /**
   * Formats a phone number into a standardized format
   * @param {string} phoneNumber - Raw phone number
   * @returns {string} - Formatted phone number
   */
  export const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '-';
    
    // Strip all non-numeric characters
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    
    // Check if the number has the expected length for US numbers
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
    }
    
    // Handle international numbers with country code
    if (cleaned.length > 10) {
      const countryCode = cleaned.substring(0, cleaned.length - 10);
      const areaCode = cleaned.substring(cleaned.length - 10, cleaned.length - 7);
      const firstPart = cleaned.substring(cleaned.length - 7, cleaned.length - 4);
      const lastPart = cleaned.substring(cleaned.length - 4);
      
      return `+${countryCode} (${areaCode}) ${firstPart}-${lastPart}`;
    }
    
    // Return as is if we can't format it
    return phoneNumber;
  };
  
  export default {
    formatCurrency,
    formatCrypto,
    formatDate,
    formatRelativeTime,
    formatDistance,
    formatDuration,
    formatFileSize,
    formatTransactionHash,
    formatPhoneNumber
  };