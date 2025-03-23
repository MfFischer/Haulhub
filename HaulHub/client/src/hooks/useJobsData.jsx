import { useState, useEffect, useCallback, useContext } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import LocationContext from '../context/LocationContext';
import AuthContext from '../context/AuthContext';

/**
 * Custom hook to manage jobs data with filtering and sorting
 * @param {string} type - Type of jobs to fetch ('available', 'my', or a specific ID)
 * @returns {Object} - Jobs data, loading state, filter functions, etc.
 */
const useJobsData = (type = 'available') => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState('nearest'); // 'nearest', 'price', 'weight', 'recent'
  const [searchQuery, setSearchQuery] = useState('');
  
  const { currentLocation, getDistance } = useContext(LocationContext);
  const { userRole } = useContext(AuthContext);
  
  // Fetch jobs based on type
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let endpoint;
      let params = {};
      
      // Determine endpoint and params based on type
      if (type === 'available') {
        endpoint = '/jobs/available';
        
        // Include location params if available
        if (currentLocation) {
          params = {
            lat: currentLocation.latitude,
            lng: currentLocation.longitude
          };
        }
      } else if (type === 'my') {
        // My jobs endpoint changes based on role
        endpoint = userRole === 'hauler' ? '/jobs/hauler' : '/jobs/poster';
      } else if (type.match(/^[0-9a-fA-F]{24}$/)) {
        // If type is a valid ObjectId, fetch specific job
        endpoint = `/jobs/${type}`;
      } else {
        throw new Error('Invalid jobs type');
      }
      
      const response = await api.get(endpoint, { params });
      
      // Handle different response formats
      let jobsData;
      if (Array.isArray(response.data)) {
        jobsData = response.data;
      } else if (response.data.jobs) {
        jobsData = response.data.jobs;
      } else if (response.data.id || response.data._id) {
        // Single job response
        jobsData = [response.data];
      } else {
        jobsData = [];
      }
      
      // Process jobs data (add distance if we have location)
      const processedJobs = jobsData.map(job => {
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
      
      setJobs(processedJobs);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError(error.message || 'Failed to fetch jobs');
      toast.error(error.response?.data?.message || 'Failed to fetch jobs');
      setIsLoading(false);
    }
  }, [type, currentLocation, getDistance, userRole]);
  
  // Apply filters and sorting whenever jobs, filter mode, or search query changes
  useEffect(() => {
    if (!jobs.length) {
      setFilteredJobs([]);
      return;
    }
    
    // Apply search filter first
    let filtered = jobs;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = jobs.filter(job => 
        job.title?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.pickup?.toLowerCase().includes(query) ||
        job.dropoff?.toLowerCase().includes(query)
      );
    }
    
    // Then apply sorting
    let sorted = [...filtered];
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
      case 'recent':
        // Sort by created date (newest first)
        sorted = sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }
    
    setFilteredJobs(sorted);
  }, [jobs, filterMode, searchQuery]);
  
  // Fetch jobs on mount and when dependencies change
  useEffect(() => {
    fetchJobs();
    
    // If type is 'available', set up polling for updates
    let intervalId;
    if (type === 'available') {
      intervalId = setInterval(() => {
        fetchJobs();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchJobs, type]);
  
  return {
    jobs: filteredJobs,
    allJobs: jobs,
    isLoading,
    error,
    filterMode,
    setFilterMode,
    searchQuery,
    setSearchQuery,
    refreshJobs: fetchJobs
  };
};

export default useJobsData;