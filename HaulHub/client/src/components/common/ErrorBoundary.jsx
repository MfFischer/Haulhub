import React, { Component } from 'react';
import { Link } from 'react-router-dom';

/**
 * Error Boundary Component - Catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  // Update state when errors are caught
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // Catch errors and get error details
  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // In production, you would send this to your error tracking service
    // E.g., Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production' && typeof window.trackError === 'function') {
      window.trackError(error, errorInfo);
    }
  }

  // Handle refresh button click
  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    // Show error UI if there's an error
    if (this.state.hasError) {
      // Check if a custom fallback is provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-md">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-red-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-8">
              We're sorry, but there was an error loading this page. Our team has been notified.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
              <button
                onClick={this.handleRefresh}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh Page
              </button>
              
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Go to Homepage
              </Link>
            </div>
            
            {/* Error details for development */}
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="mt-8 text-left">
                <p className="text-gray-900 font-medium mb-2">Error Details:</p>
                <div className="bg-gray-100 p-4 rounded-md overflow-auto text-sm text-red-800 font-mono">
                  <p>{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <p className="mt-2 text-gray-700">
                      {this.state.errorInfo.componentStack}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;