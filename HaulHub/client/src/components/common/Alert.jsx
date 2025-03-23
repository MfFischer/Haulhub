import React from 'react';

/**
 * Alert Component - Displays contextual messages
 * 
 * @param {Object} props
 * @param {string} props.type - Type of alert (info, success, warning, error)
 * @param {string} props.title - Alert title
 * @param {string} props.message - Alert message
 * @param {Object} props.action - Optional button action (label, onClick)
 * @param {Function} props.onClose - Optional function to call when closing the alert
 * @returns {JSX.Element}
 */
const Alert = ({ type = 'info', title, message, action, onClose }) => {
  // Define styles based on type
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-400',
          iconColor: 'text-green-400',
          titleColor: 'text-green-800',
          textColor: 'text-green-700',
          buttonBgColor: 'bg-green-600 hover:bg-green-700',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-400',
          iconColor: 'text-yellow-400',
          titleColor: 'text-yellow-800',
          textColor: 'text-yellow-700',
          buttonBgColor: 'bg-yellow-600 hover:bg-yellow-700',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-400',
          iconColor: 'text-red-400',
          titleColor: 'text-red-800',
          textColor: 'text-red-700',
          buttonBgColor: 'bg-red-600 hover:bg-red-700',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-400',
          iconColor: 'text-blue-400',
          titleColor: 'text-blue-800',
          textColor: 'text-blue-700',
          buttonBgColor: 'bg-blue-600 hover:bg-blue-700',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };
  
  const styles = getStyles();
  
  return (
    <div className={`rounded-md ${styles.bgColor} p-4 border-l-4 ${styles.borderColor}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <div className={styles.iconColor}>
            {styles.icon}
          </div>
        </div>
        <div className="ml-3">
          <div className="flex justify-between items-start">
            <div>
              {title && <h3 className={`text-sm font-medium ${styles.titleColor}`}>{title}</h3>}
              {message && <div className={`mt-2 text-sm ${styles.textColor}`}>
                <p>{message}</p>
              </div>}
              {action && (
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      type="button"
                      onClick={action.onClick}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium text-white ${styles.buttonBgColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${type}-50 focus:ring-${type}-600`}
                    >
                      {action.label}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                className={`ml-3 ${styles.textColor} hover:${styles.titleColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type}-500`}
                onClick={onClose}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;