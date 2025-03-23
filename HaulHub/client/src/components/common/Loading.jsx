import React from 'react';

/**
 * Loading Component - Displays a loading spinner with optional message
 * 
 * @param {Object} props
 * @param {string} props.message - Optional loading message
 * @param {string} props.size - Size of the spinner ('sm', 'md', 'lg')
 * @param {string} props.color - Color of the spinner ('green', 'blue', 'gray')
 * @param {boolean} props.fullScreen - Whether to display full screen
 * @returns {JSX.Element}
 */
const Loading = ({ 
  message = 'Loading...', 
  size = 'md', 
  color = 'green',
  fullScreen = false 
}) => {
  // Define spinner size based on prop
  const getSpinnerSize = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-16 w-16';
      case 'md':
      default:
        return 'h-12 w-12';
    }
  };
  
  // Define color based on prop
  const getColor = () => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'gray':
        return 'text-gray-600';
      case 'green':
      default:
        return 'text-green-600';
    }
  };
  
  const spinnerSize = getSpinnerSize();
  const spinnerColor = getColor();
  
  // For full screen loading
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="flex justify-center">
            <div className={`${spinnerSize} animate-spin rounded-full border-t-2 border-b-2 ${spinnerColor}`}></div>
          </div>
          {message && (
            <p className="mt-4 text-lg text-white font-medium">{message}</p>
          )}
        </div>
      </div>
    );
  }
  
  // For inline loading
  return (
    <div className="py-16 flex flex-col items-center justify-center">
      <div className={`${spinnerSize} animate-spin rounded-full border-t-2 border-b-2 ${spinnerColor}`}></div>
      {message && (
        <p className="mt-4 text-gray-700">{message}</p>
      )}
    </div>
  );
};

export default Loading;