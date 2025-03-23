import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 404 Not Found page
 * @returns {JSX.Element}
 */
const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="max-w-md">
        {/* 404 Icon */}
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-green-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-4">404</h1>
        <p className="text-xl font-semibold text-gray-800 mb-2">Page not found</p>
        <p className="text-gray-600 mb-8">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            Go to Home
          </Link>
          
          <Link
            to="/hauler"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Find Jobs
          </Link>
        </div>
        
        <div className="mt-8">
          <p className="text-gray-500 text-sm">
            If you think this is an error, please{' '}
            <Link to="/contact" className="text-green-600 hover:text-green-500">
              contact support
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;