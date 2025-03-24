import React from 'react';

/**
 * ErrorBadge Component - Displays an error badge with customizable styling
 * 
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {string} props.type - Type of error ('error', 'warning', 'info')
 * @param {string} props.size - Size of the badge ('sm', 'md', 'lg')
 * @param {boolean} props.isDismissable - Whether the badge can be dismissed
 * @param {Function} props.onDismiss - Function to call when badge is dismissed
 * @returns {JSX.Element}
 */
const ErrorBadge = ({ 
  message, 
  type = 'error', 
  size = 'md', 
  isDismissable = false,
  onDismiss = () => {}
}) => {
  // Get styles based on type
  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300',
          iconColor: 'text-yellow-400'
        };
      case 'info':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300',
          iconColor: 'text-blue-400'
        };
      case 'error':
      default:
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-300',
          iconColor: 'text-red-400'
        };
    }
  };

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: 'px-2 py-1',
          fontSize: 'text-xs'
        };
      case 'lg':
        return {
          padding: 'px-4 py-2',
          fontSize: 'text-base'
        };
      case 'md':
      default:
        return {
          padding: 'px-3 py-1.5',
          fontSize: 'text-sm'
        };
    }
  };

  // Get appropriate icon based on type
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const typeStyles = getTypeStyles();
  const sizeStyles = getSizeStyles();

  return (
    <div className={`inline-flex items-center rounded-full ${typeStyles.bgColor} ${typeStyles.borderColor} border ${sizeStyles.padding}`}>
      <span className={`${typeStyles.iconColor} mr-1.5`}>
        {getIcon()}
      </span>
      <span className={`${typeStyles.textColor} ${sizeStyles.fontSize} font-medium`}>
        {message}
      </span>
      {isDismissable && (
        <button
          type="button"
          className={`ml-1.5 ${typeStyles.textColor} hover:${typeStyles.iconColor} focus:outline-none`}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ErrorBadge;