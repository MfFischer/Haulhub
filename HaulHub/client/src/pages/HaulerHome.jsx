import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import MapView from '../components/shared/MapView';
import JobCard from '../components/shared/JobCard';
import Loading from '../components/common/Loading';
import AuthContext from '../context/AuthContext';
import LocationContext from '../context/LocationContext';
import WalletContext from '../context/WalletContext';
import api, { jobsAPI } from '../utils/api';

const HaulerHome = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeJobId, setActiveJobId] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [filterMode, setFilterMode] = useState('nearest'); // 'nearest', 'price', 'weight'
  
  const { currentUser } = useContext(AuthContext);
  const { currentLocation, getDistance } = useContext(LocationContext);
  const { acceptJob } = useContext(WalletContext);
  
  const navigate = useNavigate();
  
  // Fetch available jobs
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      // If we have location, include it for better job recommendations
      const lat = currentLocation ? currentLocation.latitude : null;
      const lng = currentLocation ? currentLocation.longitude : null;
      
      // Use the jobsAPI helper - make sure lat/lng are numbers and not null
      const response = await jobsAPI.getAvailable(
        lat || undefined, 
        lng || undefined
      );
      
      // Ensure response.data is an array
      const jobsData = Array.isArray(response.data) ? response.data : [];
      
      // Calculate distance for each job if we have location
      const jobsWithDistance = jobsData.map(job => {
        let distance = null;
        
        if (currentLocation && job.pickupCoordinates) {
          distance = getDistance(
            currentLocation,
            {
              latitude: job.pickupCoordinates.lat,
              longitude: job.pickupCoordinates.lng
            }
          );
        }
        
        return {
          ...job,
          distance
        };
      });
      
      setJobs(jobsWithDistance);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch available jobs');
      setJobs([]); // Set empty array on error
      setIsLoading(false);
    }
  }, [currentLocation, getDistance]);
  
  // Apply filters whenever jobs or filter mode changes
  useEffect(() => {
    if (!jobs.length) {
      setFilteredJobs([]);
      return;
    }
    
    let sorted = [...jobs];
    
    switch (filterMode) {
      case 'nearest':
        // Sort by distance (if available)
        sorted = sorted.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
        break;
      case 'price':
        // Sort by price (highest first)
        sorted = sorted.sort((a, b) => b.price.amount - a.price.amount);
        break;
      case 'weight':
        // Sort by weight (lightest first)
        sorted = sorted.sort((a, b) => a.weight - b.weight);
        break;
      default:
        break;
    }
    
    setFilteredJobs(sorted);
  }, [jobs, filterMode]);
  
  // Load jobs on initial mount
  useEffect(() => {
    fetchJobs();
    
    // Set up periodic refresh (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchJobs();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchJobs]);
  
  // Handle job selection
  const handleJobSelect = (jobId) => {
    setActiveJobId(jobId === activeJobId ? null : jobId);
  };
  
  // Handle job acceptance
  const handleAcceptJob = async (jobId) => {
    // Check if user is authenticated
    if (!currentUser) {
      toast.warn('Please log in to accept jobs');
      navigate('/login');
      return;
    }
    
    try {
      // First try blockchain acceptance if applicable
      if (acceptJob) {
        const onChainJob = await api.get(`/jobs/${jobId}/blockchain`);
        if (onChainJob.data.onChain) {
          const success = await acceptJob(onChainJob.data.chainJobId);
          if (!success) {
            throw new Error('Blockchain transaction failed');
          }
        }
      }
      
      // Then API acceptance
      await api.post(`/jobs/${jobId}/accept`);
      
      toast.success('Job accepted successfully!');
      fetchJobs(); // Refresh job list
      navigate(`/jobs/${jobId}`); // Navigate to job details
    } catch (error) {
      console.error('Error accepting job:', error);
      toast.error(error.response?.data?.message || 'Failed to accept job');
    }
  };
  
  if (isLoading && jobs.length === 0) {
    return <Loading message="Finding available jobs near you..." />;
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* View toggle and filters */}
      <div className="p-4 bg-white shadow-sm z-10">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                viewMode === 'map'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Map View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              List View
            </button>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Filter:</span>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="text-sm border border-gray-300 rounded p-1"
            >
              <option value="nearest">Nearest First</option>
              <option value="price">Highest Paying</option>
              <option value="weight">Lightest First</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Main content - Map or List view */}
      <div className="flex-grow overflow-hidden">
        {viewMode === 'map' ? (
          <MapView
            jobs={filteredJobs}
            activeJobId={activeJobId}
            onJobSelect={handleJobSelect}
            onJobAccept={handleAcceptJob}
          />
        ) : (
          <div className="h-full overflow-y-auto p-4 bg-gray-100">
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No jobs found</h3>
                <p className="mt-2 text-gray-600">
                  There are no available jobs at the moment. Please check back soon!
                </p>
                <button
                  onClick={fetchJobs}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Refresh Jobs
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isActive={job.id === activeJobId}
                    onClick={() => handleJobSelect(job.id)}
                    onAccept={() => handleAcceptJob(job.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="bg-white p-4 shadow-md flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} available
        </div>
        <button
          onClick={fetchJobs}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
};

export default HaulerHome;
