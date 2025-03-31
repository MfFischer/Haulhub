import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import api from '../../utils/api';


// Set Mapbox access token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const JobTracker = ({ job, onStatusUpdate }) => {
  const [currentStatus, setCurrentStatus] = useState(job.status);
  const [haulerLocation, setHaulerLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(null);
  
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const pollingInterval = useRef(null);
  
  // Display address helper function to safely handle pickup/dropoff objects
  const getAddressString = (locationObj) => {
    if (!locationObj) return 'Address not available';
    if (typeof locationObj === 'string') return locationObj;
    return locationObj.address || 'Address not available';
  };
  
  // Initialize map
  useEffect(() => {
    if (map.current) return; // Map already initialized

    // Add this check
  //const hasPickupCoords = job.pickupCoordinates && job.pickupCoordinates.lat && job.pickupCoordinates.lng;
  //const hasDropoffCoords = job.dropoffCoordinates && job.dropoffCoordinates.lat && job.dropoffCoordinates.lng;
    
  //if (!hasPickupCoords || !hasDropoffCoords) {
    //console.warn('Missing coordinates for map visualization');
   // return; // No coordinates to display
 // }

 if (!job.pickupCoordinates || !job.dropoffCoordinates) {
  return;
}
    
    // Create map instance
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [job.pickupCoordinates.lng, job.pickupCoordinates.lat],
      zoom: 12
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add markers when map loads
    map.current.on('load', () => {
      // Add pickup marker
      const pickupEl = document.createElement('div');
      pickupEl.className = 'pickup-marker';
      pickupEl.style.width = '25px';
      pickupEl.style.height = '25px';
      pickupEl.style.borderRadius = '50%';
      pickupEl.style.backgroundColor = '#10b981'; // Green
      pickupEl.style.border = '3px solid white';
      pickupEl.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.25)';
      
      markersRef.current.pickup = new mapboxgl.Marker(pickupEl)
        .setLngLat([job.pickupCoordinates.lng, job.pickupCoordinates.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<p>Pickup: ${getAddressString(job.pickup)}</p>`
        ))
        .addTo(map.current);
      
      // Add dropoff marker
      const dropoffEl = document.createElement('div');
      dropoffEl.className = 'dropoff-marker';
      dropoffEl.style.width = '25px';
      dropoffEl.style.height = '25px';
      dropoffEl.style.borderRadius = '50%';
      dropoffEl.style.backgroundColor = '#ef4444'; // Red
      dropoffEl.style.border = '3px solid white';
      dropoffEl.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.25)';
      
      markersRef.current.dropoff = new mapboxgl.Marker(dropoffEl)
        .setLngLat([job.dropoffCoordinates.lng, job.dropoffCoordinates.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<p>Dropoff: ${getAddressString(job.dropoff)}</p>`
        ))
        .addTo(map.current);
      
      // Fit map to bounds that include both markers
      const bounds = new mapboxgl.LngLatBounds()
        .extend([job.pickupCoordinates.lng, job.pickupCoordinates.lat])
        .extend([job.dropoffCoordinates.lng, job.dropoffCoordinates.lat]);
      
      map.current.fitBounds(bounds, { padding: 50 });
      
      // Add route line if already in_progress
      if (currentStatus === 'in_progress') {
        fetchRoute();
      }
    });
    
    // Cleanup on unmount
    return () => {
      if (map.current) {
        Object.values(markersRef.current).forEach(marker => {
          if (marker) marker.remove();
        });
        map.current.remove();
        map.current = null;
      }
    };
  }, [job.pickupCoordinates, job.dropoffCoordinates, job.pickup, job.dropoff, currentStatus]);
  
  // Update status and start polling when job status is in_progress
  useEffect(() => {
    setCurrentStatus(job.status);
    
    // Start polling for hauler location if job is in progress
    if (job.status === 'in_progress' && job.hauler) {
      startLocationPolling();
    } else {
      stopLocationPolling();
    }
    
    return () => stopLocationPolling();
  }, [job.status, job.hauler]);
  
  // Start polling for hauler location
  const startLocationPolling = () => {
    // Clear any existing interval
    stopLocationPolling();
    
    // Fetch immediately
    fetchHaulerLocation();
    
    // Then set up interval (every 10 seconds)
    pollingInterval.current = setInterval(fetchHaulerLocation, 10000);
  };
  
  // Stop polling
  const stopLocationPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };
  
  // Fetch hauler's current location
  const fetchHaulerLocation = async () => {
    if (!job.id || !job.hauler) return;
    
    try {
      const response = await api.get(`/jobs/${job.id}/hauler-location`);
      
      if (response.data && response.data.location) {
        const location = response.data.location;
        setHaulerLocation(location);
        
        // Update hauler marker
        updateHaulerMarker(location);
        
        // Update ETA
        if (response.data.eta) {
          setEtaMinutes(response.data.eta);
        }
      }
    } catch (error) {
      console.error('Error fetching hauler location:', error);
      // Don't show error toast to avoid spamming user
    }
  };
  
  // Update or create hauler marker
  const updateHaulerMarker = (location) => {
    if (!map.current || !location) return;
    
    if (markersRef.current.hauler) {
      // Update existing marker
      markersRef.current.hauler.setLngLat([location.longitude, location.latitude]);
    } else {
      // Create new hauler marker
      const haulerEl = document.createElement('div');
      haulerEl.className = 'hauler-marker';
      haulerEl.style.width = '30px';
      haulerEl.style.height = '30px';
      haulerEl.style.borderRadius = '50%';
      haulerEl.style.backgroundColor = '#3b82f6'; // Blue
      haulerEl.style.border = '3px solid white';
      haulerEl.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.25)';
      
      // Add vehicle icon
      const vehicleIcon = document.createElement('div');
      vehicleIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16" style="margin: 4px;">
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h5v1a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-4a1 1 0 00-.293-.707L17.414 7H14V4a1 1 0 00-1-1H3z" />
        </svg>
      `;
      haulerEl.appendChild(vehicleIcon);
      
      // Add pulse animation for hauler
      const pulse = document.createElement('div');
      pulse.className = 'pulse';
      pulse.style.position = 'absolute';
      pulse.style.top = '-10px';
      pulse.style.left = '-10px';
      pulse.style.right = '-10px';
      pulse.style.bottom = '-10px';
      pulse.style.borderRadius = '50%';
      pulse.style.backgroundColor = 'rgba(59, 130, 246, 0.4)';
      pulse.style.animation = 'pulse 2s infinite';
      haulerEl.appendChild(pulse);
      
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <p class="font-medium">Hauler: ${job.haulerName || 'Your Hauler'}</p>
          ${etaMinutes ? `<p class="text-sm">ETA: ${etaMinutes} minutes</p>` : ''}
        </div>
      `);
      
      markersRef.current.hauler = new mapboxgl.Marker(haulerEl)
        .setLngLat([location.longitude, location.latitude])
        .setPopup(popup)
        .addTo(map.current);
    }
  };
  
  // Fetch and display the route
  const fetchRoute = async () => {
    if (!map.current || !job.pickupCoordinates || !job.dropoffCoordinates) {
      return;
    }
    
    try {
      // Get route from API
      const response = await api.get('/location/route', {
        params: {
          startLat: job.pickupCoordinates.lat,
          startLng: job.pickupCoordinates.lng,
          endLat: job.dropoffCoordinates.lat,
          endLng: job.dropoffCoordinates.lng,
          mode: job.vehicleType || 'car'
        }
      });
      
      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        
        // Add the route to the map
        if (!map.current.getSource('route')) {
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: route.geometry.coordinates
              }
            }
          });
          
          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });
        } else {
          // Update existing route
          map.current.getSource('route').setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route.geometry.coordinates
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };
  
  // Handle confirming delivery completion
  const handleConfirmDelivery = async () => {
    if (!job.id) return;
    
    setIsLoading(true);
    
    try {
      await api.post(`/jobs/${job.id}/confirm`);
      toast.success('Delivery confirmed! Thank you.');
      setCurrentStatus('completed');
      
      // Stop polling for location
      stopLocationPolling();
      
      // Callback to update parent component
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast.error('Failed to confirm delivery. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render different content based on job status
  const renderStatusContent = () => {
    switch (currentStatus) {
      case 'created':
        return (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Waiting for a hauler to accept your job...
                </p>
              </div>
            </div>
          </div>
        );
        
      case 'in_progress':
        return (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {job.haulerName || 'Your hauler'} is on the way!
                  {etaMinutes && ` ETA: ${etaMinutes} minutes`}
                </p>
              </div>
            </div>
          </div>
        );
        
      case 'completed':
        return (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Your favor has been completed. Thank you for using Microsender!
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Get appropriate button based on status
  const renderStatusButton = () => {
    if (currentStatus === 'in_progress') {
      return (
        <button
          onClick={handleConfirmDelivery}
          disabled={isLoading}
          className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Confirm Delivery Received
            </>
          )}
        </button>
      );
    }
    
    return null;
  };
  
  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900">Delivery Status</h3>
        
        {renderStatusContent()}
        
        <div className="mt-2">
          <h4 className="text-sm font-medium text-gray-700">Status Timeline</h4>
          <div className="mt-2 relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="h-0.5 w-full bg-gray-200"></div>
            </div>
            <ol className="relative z-10 flex justify-between">
              <li className="flex items-center">
                <span className={`h-6 w-6 rounded-full flex items-center justify-center ${
                  ['created', 'in_progress', 'completed'].includes(currentStatus) 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                <span className="ml-1 text-xs">Created</span>
              </li>
              <li className="flex items-center">
                <span className={`h-6 w-6 rounded-full flex items-center justify-center ${
                  ['in_progress', 'completed'].includes(currentStatus) 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <span className="ml-1 text-xs">Accepted</span>
              </li>
              <li className="flex items-center">
                <span className={`h-6 w-6 rounded-full flex items-center justify-center ${
                  currentStatus === 'completed' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="ml-1 text-xs">Completed</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
      
      <div className="h-64 bg-gray-100">
        <div ref={mapContainer} className="h-full w-full" />
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="text-xs font-medium text-gray-500">Pickup</h4>
            <p className="text-sm text-gray-800">{getAddressString(job.pickup)}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500">Dropoff</h4>
            <p className="text-sm text-gray-800">{getAddressString(job.dropoff)}</p>
          </div>
        </div>
        
        {renderStatusButton()}
      </div>
      
      {/* Styles for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default JobTracker;
