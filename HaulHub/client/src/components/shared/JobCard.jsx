import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const JobCard = ({ job, isActive, onClick, onAccept }) => {
  // Prevent event bubbling for accept button
  const handleAcceptClick = (e) => {
    e.stopPropagation();
    onAccept();
  };
  
  // Format date to relative time (e.g. "5 minutes ago")
  const formatCreatedAt = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  // Helper function to safely get address string
  const getAddressString = (locationObj) => {
    if (!locationObj) return 'Address not available';
    if (typeof locationObj === 'string') return locationObj;
    return locationObj.address || 'Address not available';
  };
  
  // Helper function to safely handle price display
  const formatPrice = () => {
    if (!job.price) return '$0.00';
    const symbol = job.price.currencySymbol || '$';
    const amount = typeof job.price.amount === 'number' ? job.price.amount.toFixed(2) : '0.00';
    return `${symbol}${amount}`;
  };
  
  // Get appropriate icons based on job properties
  const getJobIcon = () => {
    if (job.isRush) {
      return (
        <div className="bg-red-100 p-2 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    
    return (
      <div className="bg-green-100 p-2 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h5v1a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-4a1 1 0 00-.293-.707L17.414 7H14V4a1 1 0 00-1-1H3z" />
        </svg>
      </div>
    );
  };
  
  // Add defensive checks for missing data
  if (!job) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <p className="text-red-500">Error: Invalid job data</p>
      </div>
    );
  }
  
  return (
    <div
      className={`bg-white rounded-lg shadow-sm transition-all ${
        isActive
          ? 'ring-2 ring-green-500 shadow-md scale-[1.02]'
          : 'hover:shadow-md hover:scale-[1.01]'
      }`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start">
          {getJobIcon()}
          
          <div className="ml-3 flex-grow">
            <h3 className="text-lg font-medium text-gray-900">{job.title || 'Untitled Job'}</h3>
            <p className="text-sm text-gray-500">
              Posted {formatCreatedAt(job.postedAt || job.createdAt || new Date())}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-semibold text-green-600">
              {formatPrice()}
            </div>
            <div className="text-xs text-gray-500">{job.price?.cryptoPrice || 'N/A'} USDC</div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-500">Distance</div>
            <div className="font-medium">
              {job.distance ? `${job.distance.toFixed(1)} ${job.distanceUnit || 'mi'}` : 'Unknown'}
            </div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-500">Weight</div>
            <div className="font-medium">{job.weight || 'N/A'} {job.weightUnit || 'kg'}</div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-500">Type</div>
            <div className="font-medium">{job.isRush ? 'Rush' : 'Standard'}</div>
          </div>
        </div>
        
        {/* Location details */}
        <div className="mt-4 space-y-2">
          <div className="flex items-start">
            <div className="bg-green-100 p-1 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-2 text-sm">
              <div className="text-gray-500">Pickup</div>
              <div className="font-medium"><p>{getAddressString(job.pickup)}</p></div>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-red-100 p-1 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-2 text-sm">
              <div className="text-gray-500">Dropoff</div>
              <div className="font-medium">{getAddressString(job.dropoff)}</div>
            </div>
          </div>
        </div>
        
        {/* Description if available */}
        {job.description && (
          <div className="mt-3 text-sm text-gray-600">
            <p className="line-clamp-2">{job.description}</p>
          </div>
        )}
        
        {/* Badges/tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {job.vehicleType && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {job.vehicleType}
            </span>
          )}
          
          {job.isRush && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
              Rush
            </span>
          )}
          
          {job.posterRating && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              {job.posterRating}
            </span>
          )}
        </div>
      </div>
      
      {/* Action button */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        <button
          onClick={handleAcceptClick}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Accept Job
        </button>
      </div>
    </div>
  );
};

export default JobCard;