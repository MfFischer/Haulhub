import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import Loading from '../components/common/Loading';
import JobStatusBadge from '../components/shared/JobStatusBadge';
import AuthContext from '../context/AuthContext';
import LocationContext from '../context/LocationContext';
import api from '../utils/api';

const MyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'completed', 'all'
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'date-asc', 'price-desc', 'price-asc'
  
  const { isAuthenticated, userRole } = useContext(AuthContext);
  const { userRegion } = useContext(LocationContext);
  
  const navigate = useNavigate();
  
  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      toast.warn('Please log in to view your jobs');
      navigate('/login', { state: { returnUrl: '/jobs' } });
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        // Different endpoint based on user role
        // Using the correct endpoints from your backend
        const endpoint = userRole === 'hauler' ? '/jobs/hauler' : '/jobs/poster/active';
        console.log('Fetching jobs from endpoint:', endpoint);
        
        const response = await api.get(endpoint);
        
        setJobs(response.data);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        toast.error('Failed to load job history');
        
        // Add mock data for development in case of failure
        if (process.env.NODE_ENV === 'development') {
          setJobs([
            {
              id: 'mock-job-1',
              title: 'Furniture Delivery',
              description: 'Deliver a sofa to customer location',
              price: { amount: 45.00, currencySymbol: '$' },
              weight: 30,
              weightUnit: 'kg',
              distance: 3.5,
              distanceUnit: 'mi',
              isRush: false,
              vehicleType: 'Van',
              pickup: '123 Main St',
              dropoff: '456 Elm St',
              status: 'in_progress',
              createdAt: new Date().toISOString(),
              postedAt: new Date().toISOString()
            },
            {
              id: 'mock-job-2',
              title: 'Urgent Package',
              description: 'Deliver a package ASAP',
              price: { amount: 35.00, currencySymbol: '$' },
              weight: 5,
              weightUnit: 'kg',
              distance: 2.1,
              distanceUnit: 'mi',
              isRush: true,
              vehicleType: 'Car',
              pickup: '789 Oak St',
              dropoff: '101 Pine St',
              status: 'completed',
              createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              postedAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            }
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchJobs();
    }
  }, [isAuthenticated, userRole]);
  
  // Filter jobs based on active tab
  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'all') return true;
    
    if (activeTab === 'current') {
      return ['created', 'accepted', 'in_progress', 'open'].includes(job.status);
    }
    
    if (activeTab === 'completed') {
      return ['completed', 'cancelled'].includes(job.status);
    }
    
    return true;
  });
  
  // Sort filtered jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.createdAt || b.postedAt) - new Date(a.createdAt || a.postedAt);
      case 'date-asc':
        return new Date(a.createdAt || a.postedAt) - new Date(b.createdAt || b.postedAt);
      case 'price-desc':
        return (b.price?.amount || 0) - (a.price?.amount || 0);
      case 'price-asc':
        return (a.price?.amount || 0) - (b.price?.amount || 0);
      default:
        return new Date(b.createdAt || b.postedAt) - new Date(a.createdAt || a.postedAt);
    }
  });
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy · h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Helper function to safely get address string
  const getAddressString = (locationObj) => {
    if (!locationObj) return 'Address not available';
    if (typeof locationObj === 'string') return locationObj;
    if (locationObj.address) return locationObj.address;
    if (locationObj.latitude && locationObj.longitude) 
      return `${locationObj.latitude.toFixed(6)}, ${locationObj.longitude.toFixed(6)}`;
    return 'Address not available';
  };
  
  // Get currency symbol for region
  const getCurrencySymbol = () => {
    const symbols = {
      'us': '$',
      'ph': '₱',
      'id': 'Rp',
      'vn': '₫',
      'eu': '€',
      'uk': '£',
      'ca': 'C$'
    };
    return symbols[userRegion] || '$';
  };
  
  if (isLoading) {
    return <Loading message="Loading your jobs..." />;
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
            
            <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
              {userRole === 'poster' && (
                <Link
                  to="/create-job"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  New Haul Request
                </Link>
              )}
              
              <select
                className="py-2 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="price-desc">Highest Price</option>
                <option value="price-asc">Lowest Price</option>
              </select>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('current')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'current'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Current
                <span className="ml-2 py-0.5 px-2 text-xs rounded-full bg-gray-100">
                  {jobs.filter(job => ['created', 'accepted', 'in_progress', 'open'].includes(job.status)).length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('completed')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'completed'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Completed
                <span className="ml-2 py-0.5 px-2 text-xs rounded-full bg-gray-100">
                  {jobs.filter(job => ['completed', 'cancelled'].includes(job.status)).length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Jobs
                <span className="ml-2 py-0.5 px-2 text-xs rounded-full bg-gray-100">
                  {jobs.length}
                </span>
              </button>
            </nav>
          </div>
          
          {/* Job listing */}
          {sortedJobs.length === 0 ? (
            <div className="bg-gray-50 p-8 text-center rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No jobs found</h3>
              <p className="mt-2 text-gray-600">
                {activeTab === 'current' 
                  ? 'You don\'t have any active jobs.' 
                  : activeTab === 'completed' 
                  ? 'You don\'t have any completed jobs yet.' 
                  : 'You haven\'t created or accepted any jobs yet.'}
              </p>
              {userRole === 'poster' && (
                <Link
                  to="/create-job"
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Create Your First Job
                </Link>
              )}
              {userRole === 'hauler' && (
                <Link
                  to="/hauler"
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Find Available Jobs
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 gap-4">
                {sortedJobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{job.title || 'Untitled Job'}</h3>
                          <p className="text-sm text-gray-500">{formatDate(job.createdAt || job.postedAt || new Date())}</p>
                        </div>
                        <JobStatusBadge status={job.status || 'created'} />
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">From</p>
                          <p className="font-medium">{getAddressString(job.pickup)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">To</p>
                          <p className="font-medium">{getAddressString(job.dropoff)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Distance</p>
                          <p className="font-medium">{job.distance ? `${job.distance.toFixed(1)} ${job.distanceUnit || 'km'}` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Weight</p>
                          <p className="font-medium">{job.weight || 'N/A'} {job.weightUnit || 'kg'}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center">
                          {job.isRush && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mr-2">
                              Rush
                            </span>
                          )}
                          {job.vehicleType && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full capitalize">
                              {job.vehicleType}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-green-600">
                          {getCurrencySymbol()}{job.price?.amount ? job.price.amount.toFixed(2) : '0.00'}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyJobs;