import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import JobForm from '../components/forms/JobForm';
import PricingPreview from '../components/PricingPreview';
import Loading from '../components/common/Loading';
import AuthContext from '../context/AuthContext';
import LocationContext from '../context/LocationContext';
import WalletContext from '../context/WalletContext';
import api from '../utils/api';
import { geocodeAddress } from '../utils/location';
import { calculatePrice } from '../utils/pricing';

const CreateJob = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pickup: '',
    dropoff: '',
    weight: 5,
    isRush: false,
    vehicleType: 'car',
    paymentMethod: 'crypto', // 'crypto', 'card', 'paypal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickupCoordinates, setPickupCoordinates] = useState(null);
  const [dropoffCoordinates, setDropoffCoordinates] = useState(null);
  const [distance, setDistance] = useState(null);
  const [price, setPrice] = useState(null);
  const [showPricePreview, setShowPricePreview] = useState(false);
  
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const { userRegion, currentLocation } = useContext(LocationContext);
  const { createJob, isConnected, connectWallet } = useContext(WalletContext);
  
  const navigate = useNavigate();
  
  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.warn('Please log in to create a haul request');
      navigate('/login', { state: { returnUrl: '/create-job' } });
    }
  }, [isAuthenticated, navigate]);
  
  // Update price whenever relevant form data changes
  useEffect(() => {
    // Calculate price based on distance, weight, etc.
    if (distance !== null) {
      try {
        const pricingData = calculatePrice(
          userRegion,
          distance,
          formData.weight,
          formData.isRush,
          formData.vehicleType
        );
        
        setPrice(pricingData);
        setShowPricePreview(true);
      } catch (error) {
        console.error('Error calculating price:', error);
        setShowPricePreview(false);
      }
    } else {
      setShowPricePreview(false);
    }
  }, [distance, formData.weight, formData.isRush, formData.vehicleType, userRegion]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  // Handle address changes and geocoding
  const handleAddressChange = async (type, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: value
    }));
    
    // Reset distance if addresses change
    if (distance !== null) {
      setDistance(null);
      setShowPricePreview(false);
    }
  };
  
  // Calculate route and distance between pickup and dropoff
  const calculateRoute = async () => {
    try {
      if (!formData.pickup || !formData.dropoff) {
        toast.warn('Please enter both pickup and dropoff addresses');
        return;
      }
      
      // Geocode addresses if needed
      let pickupCoords = pickupCoordinates;
      let dropoffCoords = dropoffCoordinates;
      
      if (!pickupCoords) {
        const result = await geocodeAddress(formData.pickup);
        pickupCoords = {
          lat: result.lat,
          lng: result.lng
        };
        setPickupCoordinates(pickupCoords);
      }
      
      if (!dropoffCoords) {
        const result = await geocodeAddress(formData.dropoff);
        dropoffCoords = {
          lat: result.lat,
          lng: result.lng
        };
        setDropoffCoordinates(dropoffCoords);
      }
      
      // Calculate route
      const response = await api.get('/location/route', {
        params: {
          startLat: pickupCoords.lat,
          startLng: pickupCoords.lng,
          endLat: dropoffCoords.lat,
          endLng: dropoffCoords.lng,
          mode: formData.vehicleType
        }
      });
      
      // Set distance
      setDistance(response.data.distance);
      
      toast.success('Route calculated successfully');
    } catch (error) {
      console.error('Error calculating route:', error);
      toast.error('Failed to calculate route. Please check addresses and try again.');
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.warn('Please log in to create a haul request');
      navigate('/login', { state: { returnUrl: '/create-job' } });
      return;
    }
    
    // Validate form
    if (!formData.title || !formData.pickup || !formData.dropoff) {
      toast.warn('Please fill out all required fields');
      return;
    }
    
    if (!distance) {
      toast.warn('Please calculate the route first');
      return;
    }
    
    // Check payment method and wallet connection
    if (formData.paymentMethod === 'crypto' && !isConnected) {
      toast.warn('Please connect your wallet for crypto payments');
      const connected = await connectWallet();
      if (!connected) return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare job data
      const jobData = {
        title: formData.title,
        description: formData.description,
        pickup: formData.pickup,
        dropoff: formData.dropoff,
        pickupCoordinates,
        dropoffCoordinates,
        weight: formData.weight,
        distance,
        isRush: formData.isRush,
        vehicleType: formData.vehicleType,
        paymentMethod: formData.paymentMethod,
        price: price ? price.priceUSD : null,
        currency: userRegion,
      };
      
      let response;
      
      // Handle blockchain payments
      if (formData.paymentMethod === 'crypto' && createJob) {
        // Create a locationHash for privacy (in production would use IPFS or encrypted data)
        const locationHash = Buffer.from(JSON.stringify({
          pickup: formData.pickup,
          dropoff: formData.dropoff,
          pickupCoordinates,
          dropoffCoordinates
        })).toString('base64');
        
        // Call blockchain method to create job
        const jobId = await createJob(
          { locationHash, isRush: formData.isRush },
          price.priceUSD
        );
        
        if (!jobId) {
          throw new Error('Blockchain transaction failed');
        }
        
        // Save job in backend with blockchain reference
        jobData.onChain = true;
        jobData.chainJobId = jobId;
        
        response = await api.post('/jobs', jobData);
      } else {
        // Regular API job creation
        response = await api.post('/jobs', jobData);
      }
      
      toast.success('Haul request created successfully!');
      navigate(`/jobs/${response.data.id}`);
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error(error.response?.data?.message || 'Failed to create haul request');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If still loading authentication state
  if (isSubmitting) {
    return <Loading message="Creating your haul request..." />;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Ask for a Favor</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <JobForm
                formData={formData}
                onInputChange={handleInputChange}
                onAddressChange={handleAddressChange}
                onCalculateRoute={calculateRoute}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                showPriceCalculated={showPricePreview}
              />
            </div>
            
            <div className="md:col-span-1">
              {showPricePreview && price ? (
                <PricingPreview
                  price={price}
                  distance={distance}
                  weight={formData.weight}
                  isRush={formData.isRush}
                  vehicleType={formData.vehicleType}
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Preview</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Enter pickup and dropoff addresses and click "Calculate Route" to see pricing.
                  </p>
                  <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-gray-500 text-sm">Price calculator</p>
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Haul Tips</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Be specific about your item size and weight for accurate pricing.</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Choose "Rush" for time-sensitive deliveries. Standard for everything else.</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Select "Bicycle" or "E-scooter" for eco-friendly delivery and discounted rates.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;
