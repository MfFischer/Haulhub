import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import JobStatusBadge from '../components/shared/JobStatusBadge';
import JobTracker from '../components/shared/JobTracker';
import Loading from '../components/common/Loading';
import Alert from '../components/common/Alert';
import AuthContext from '../context/AuthContext';
import LocationContext from '../context/LocationContext';
import WalletContext from '../context/WalletContext';
import api from '../utils/api';

const JobDetail = () => {
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const { isAuthenticated, userRole, currentUser } = useContext(AuthContext);
  const { userRegion } = useContext(LocationContext);
  const { acceptJob, completeJob } = useContext(WalletContext);
  
  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.warn('Please log in to view job details');
      navigate('/login', { state: { returnUrl: `/jobs/${jobId}` } });
      return;
    }
    
    // Load job details
    fetchJobDetails();
  }, [isAuthenticated, jobId, navigate]);
  
  // Fetch job details
  const fetchJobDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/jobs/${jobId}`);
      setJob(response.data);
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError('Failed to load job details. The job may not exist or you may not have permission to view it.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle job acceptance
  const handleAcceptJob = async () => {
    if (!isAuthenticated) {
      toast.warn('Please log in to accept jobs');
      navigate('/login', { state: { returnUrl: `/jobs/${jobId}` } });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if this is a blockchain job
      if (job.onChain && acceptJob) {
        const success = await acceptJob(job.chainJobId);
        if (!success) {
          throw new Error('Blockchain transaction failed');
        }
      }
      
      // Update job status through API
      await api.post(`/jobs/${jobId}/accept`);
      
      toast.success('Job accepted successfully!');
      fetchJobDetails(); // Refresh job data
    } catch (error) {
      console.error('Error accepting job:', error);
      toast.error(error.response?.data?.message || 'Failed to accept job');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle job completion
  const handleCompleteJob = async () => {
    if (!isAuthenticated) {
      toast.warn('Please log in to complete jobs');
      navigate('/login', { state: { returnUrl: `/jobs/${jobId}` } });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if this is a blockchain job
      if (job.onChain && completeJob) {
        const success = await completeJob(job.chainJobId);
        if (!success) {
          throw new Error('Blockchain transaction failed');
        }
      }
      
      // Update job status through API
      await api.post(`/jobs/${jobId}/complete`);
      
      toast.success('Job marked as completed!');
      fetchJobDetails(); // Refresh job data
    } catch (error) {
      console.error('Error completing job:', error);
      toast.error(error.response?.data?.message || 'Failed to complete job');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle job cancellation
  const handleCancelJob = async () => {
    if (!window.confirm('Are you sure you want to cancel this job? This action cannot be undone.')) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update job status through API
      await api.post(`/jobs/${jobId}/cancel`);
      
      toast.success('Job cancelled successfully');
      fetchJobDetails(); // Refresh job data
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel job');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy · h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
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
  
  // Determine if current user is the poster of this job
  const isPoster = job && currentUser && job.poster === currentUser.id;
  
  // Determine if current user is the hauler for this job
  const isHauler = job && currentUser && job.hauler === currentUser.id;
  
  // Determine if job is active
  const isActiveJob = job && ['created', 'accepted', 'in_progress'].includes(job.status);
  
  // Get actions based on user role and job status
  const getJobActions = () => {
    if (!job) return null;
    
    if (userRole === 'hauler') {
      if (job.status === 'created') {
        return (
          <button
            onClick={handleAcceptJob}
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Accept Job
              </>
            )}
          </button>
        );
      }
      
      if (isHauler && job.status === 'in_progress') {
        return (
          <button
            onClick={handleCompleteJob}
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Mark as Completed
              </>
            )}
          </button>
        );
      }
    }
    
    if (userRole === 'poster' && isPoster && job.status === 'created') {
      return (
        <button
          onClick={handleCancelJob}
          disabled={isSubmitting}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Cancel Job
            </>
          )}
        </button>
      );
    }
    
    return null;
  };
  
  if (isLoading) {
    return <Loading message="Loading job details..." />;
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Alert
          type="error"
          title="Error"
          message={error}
          action={{
            label: 'Back to Jobs',
            onClick: () => navigate('/jobs')
          }}
        />
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Alert
          type="warning"
          title="Job Not Found"
          message="The job you're looking for doesn't exist or may have been removed."
          action={{
            label: 'Back to Jobs',
            onClick: () => navigate('/jobs')
          }}
        />
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div className="flex items-center mb-2 sm:mb-0">
              <Link
                to="/jobs"
                className="mr-3 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Job Details</h1>
            </div>
            <JobStatusBadge status={job.status} />
          </div>
          
          <div className="mt-4">
            <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
            <p className="text-gray-600 mt-1">Posted {formatDate(job.createdAt)}</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Job Details */}
            <div className="md:col-span-2">
              {/* Job Description */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700">
                  {job.description || 'No description provided.'}
                </p>
              </div>
              
              {/* Locations */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Locations</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start mb-4">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Pickup</p>
                      <p className="font-medium text-gray-900">{job.pickup}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-red-100 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Dropoff</p>
                      <p className="font-medium text-gray-900">{job.dropoff}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Item Details */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Item Details</h3>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Weight</p>
                    <p className="font-medium text-gray-900">{job.weight} {job.weightUnit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Distance</p>
                    <p className="font-medium text-gray-900">{job.distance.toFixed(1)} {job.distanceUnit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Delivery Type</p>
                    <p className="font-medium text-gray-900">{job.isRush ? 'Rush' : 'Standard'}</p>
                  </div>
                </div>
              </div>
              
              {/* Job Tracking */}
              {isActiveJob && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Job Tracking</h3>
                  <JobTracker job={job} onStatusUpdate={fetchJobDetails} />
                </div>
              )}
              
              {/* Blockchain Info */}
              {job.onChain && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Blockchain Transaction</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm">
                      This job's payment is held in escrow on the Polygon blockchain. Transaction details:
                    </p>
                    <div className="mt-2 text-sm">
                      <div className="flex items-start">
                        <p className="text-gray-500 w-24">Contract:</p>
                        <p className="font-mono text-blue-600 break-all">
                          <a 
                            href={`https://mumbai.polygonscan.com/address/${job.contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {job.contractAddress}
                          </a>
                        </p>
                      </div>
                      {job.transactionHash && (
                        <div className="flex items-start mt-1">
                          <p className="text-gray-500 w-24">Transaction:</p>
                          <p className="font-mono text-blue-600 break-all">
                            <a 
                              href={`https://mumbai.polygonscan.com/tx/${job.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {job.transactionHash}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Column - Pricing & Actions */}
            <div>
              {/* Pricing */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Details</h3>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Base Price:</span>
                  <span className="font-medium">{getCurrencySymbol()}{job.price.baseAmount?.toFixed(2) || '0.00'}</span>
                </div>
                
                {job.price.distanceCharge > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">Distance Charge:</span>
                    <span className="font-medium">{getCurrencySymbol()}{job.price.distanceCharge.toFixed(2)}</span>
                  </div>
                )}
                
                {job.price.weightCharge > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">Weight Charge:</span>
                    <span className="font-medium">{getCurrencySymbol()}{job.price.weightCharge.toFixed(2)}</span>
                  </div>
                )}
                
                {job.isRush && (
                  <div className="flex justify-between items-center mb-3 text-yellow-600">
                    <span>Rush Fee:</span>
                    <span>+{job.price.rushPercentage || 50}%</span>
                  </div>
                )}
                
                {job.vehicleType && (job.vehicleType === 'bike' || job.vehicleType === 'escooter') && (
                  <div className="flex justify-between items-center mb-3 text-green-600">
                    <span>Eco Discount:</span>
                    <span>-{job.price.ecoPercentage || 10}%</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">{getCurrencySymbol()}{job.price.amount.toFixed(2)}</span>
                  </div>
                  <div className="text-right text-sm text-gray-600 mt-1">
                    {job.price.cryptoPrice || job.price.amount.toFixed(2)} USDC
                  </div>
                </div>
              </div>
              
              {/* Payment Method */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Method</h3>
                <div className="flex items-center">
                  {job.paymentMethod === 'crypto' ? (
                    <>
                      <div className="bg-purple-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 7H7v6h6V7z" />
                          <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Cryptocurrency</p>
                        <p className="text-sm text-gray-500">USDC on Polygon</p>
                      </div>
                    </>
                  ) : job.paymentMethod === 'card' ? (
                    <>
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Credit Card</p>
                        <p className="text-sm text-gray-500">Secure payment processing</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">PayPal</p>
                        <p className="text-sm text-gray-500">Fast and secure</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* User Info */}
              {job.status !== 'created' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {isPoster ? 'Hauler Info' : 'Posted By'}
                  </h3>
                  
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      {job.haulerName && isPoster ? (
                        <span className="text-lg font-medium text-gray-600">
                          {job.haulerName.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-lg font-medium text-gray-600">
                          {job.posterName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {isPoster ? job.haulerName || 'Anonymous Hauler' : job.posterName || 'Anonymous User'}
                      </p>
                      {job.userRating && (
                        <div className="flex items-center mt-1">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-4 w-4 ${i < Math.round(job.userRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-1 text-sm text-gray-600">
                            ({job.userRating.toFixed(1)})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="mb-6">
                {getJobActions()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;