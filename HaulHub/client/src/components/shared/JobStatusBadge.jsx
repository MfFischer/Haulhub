import React from 'react';

/**
 * A component that displays a badge for job status
 * @param {Object} props
 * @param {string} props.status - Job status (created, accepted, in_progress, completed, cancelled, dispute)
 * @returns {JSX.Element}
 */
const JobStatusBadge = ({ status }) => {
  // Get color and text based on status
  const getBadgeInfo = () => {
    switch (status) {
      case 'created':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          label: 'Pending'
        };
      case 'accepted':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          label: 'Accepted'
        };
      case 'in_progress':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          label: 'In Progress'
        };
      case 'completed':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          label: 'Completed'
        };
      case 'cancelled':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          label: 'Cancelled'
        };
      case 'dispute':
        return {
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          label: 'In Dispute'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          label: 'Unknown'
        };
    }
  };

  const { bgColor, textColor, label } = getBadgeInfo();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {getStatusIcon(status)}
      {label}
    </span>
  );
};

/**
 * Get the appropriate icon for a job status
 * @param {string} status - Job status
 * @returns {JSX.Element|null} - SVG icon or null
 */
const getStatusIcon = (status) => {
  switch (status) {
    case 'created':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'accepted':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'in_progress':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'completed':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'cancelled':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'dispute':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    default:
      return null;
  }
};

export default JobStatusBadge;