import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import PricingCalculator from '../components/PricingCalculator';
import JobTracker from '../components/shared/JobTracker';
import Loading from '../components/common/Loading';
import AuthContext from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:5001/api';

const PosterHome = () => {
  const [activeJobs, setActiveJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  
  // Fetch active jobs
  const fetchActiveJobs = async () => {
    try {
      setIsLoading(true);
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      // Create headers with token if available
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API_BASE_URL}/jobs/poster/active`, { headers });
      setActiveJobs(response.data);
      
      // If there's an active job, select it by default
      if (response.data.length > 0 && !selectedJob) {
        setSelectedJob(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching active jobs:', error);
      toast.error('Failed to fetch your active jobs');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch jobs on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveJobs();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);
  
  // Refresh data every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        fetchActiveJobs();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);
  
  // Handle job selection
  const handleJobSelect = (job) => {
    setSelectedJob(job);
  };
  
  // Display loading state
  if (isLoading) {
    return <Loading message="Loading your active hauls..." />;
  }
  
  // Display for authenticated users
  if (isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Ask for a Favor</h1>
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {showCalculator ? 'Hide Calculator' : 'Price Calculator'}
              </button>
            </div>
            
            {showCalculator && (
              <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing Calculator</h2>
                <PricingCalculator />
              </div>
            )}
            
            {activeJobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Need help with something? Ask your neighbors for a favor!</p>
                <Link
                  to="/create-job"
                  className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Ask for a New Favor
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Your Active Favors</h3>
                    <div className="space-y-2">
                      {activeJobs.map((job) => (
                        <div
                          key={job.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedJob?.id === job.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => handleJobSelect(job)}
                        >
                          <div className="font-medium text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {job.status === 'created' ? 'Waiting for hauler' : `${job.status}`}
                          </div>
                          <div className="flex justify-between mt-2 text-sm">
                            <span>{job.price.currencySymbol}{job.price.amount.toFixed(2)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              job.status === 'created' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : job.status === 'in_progress' 
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {job.status === 'created' 
                                ? 'Pending' 
                                : job.status === 'in_progress'
                                ? 'In Progress'
                                : 'Complete'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Link
                      to="/create-job"
                      className="mt-4 flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Ask for a New Favor
                    </Link>
                  </div>
                  
                  <div className="md:col-span-2">
                    {selectedJob ? (
                      <JobTracker job={selectedJob} onStatusUpdate={fetchActiveJobs} />
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-600">
                          Select a job from the list to view its status.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Display for non-authenticated users (or loading state)
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Need something delivered?
          </h1>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              See how HaulHub works:
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="bg-green-100 text-green-600 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">1. Post a Haul</h3>
                <p className="text-sm text-gray-600">
                  Describe your item and set pickup and delivery locations.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="bg-green-100 text-green-600 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">2. Get Matched</h3>
                <p className="text-sm text-gray-600">
                  Nearby haulers will see your request and accept the job.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="bg-green-100 text-green-600 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">3. Track & Confirm</h3>
                <p className="text-sm text-gray-600">
                  Monitor delivery progress and confirm when completed.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Check our estimated prices:
            </h2>
            <PricingCalculator />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-center"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 bg-green-600 rounded-lg text-white font-medium hover:bg-green-700 transition-colors text-center"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosterHome;
