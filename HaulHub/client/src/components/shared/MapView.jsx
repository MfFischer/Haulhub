import React, { useEffect, useRef, useState, useContext } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import LocationContext from '../../context/LocationContext';

// Set Mapbox access token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const MapView = ({ jobs, activeJobId, onJobSelect, onJobAccept }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  
  const { currentLocation, locationPermission, requestLocationPermission } = useContext(LocationContext);
  
  // Initialize map
  useEffect(() => {
    if (map.current) return; // Map already initialized
    
    // Create map instance
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: currentLocation 
        ? [currentLocation.longitude, currentLocation.latitude] 
        : [-74.5, 40], // Default center (NYC area)
      zoom: 10
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add geolocation control if location permission not granted
    if (locationPermission !== 'granted') {
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }),
        'top-right'
      );
    }
    
    // Handle map load complete
    map.current.on('load', () => {
      setIsMapInitialized(true);
    });
    
    // Cleanup on unmount
    return () => {
      if (map.current) {
        // Remove all markers
        Object.values(markersRef.current).forEach(marker => marker.remove());
        map.current.remove();
      }
    };
  }, [currentLocation, locationPermission]);
  
  // Update map center when location changes
  useEffect(() => {
    if (!map.current || !currentLocation) return;
    
    map.current.flyTo({
      center: [currentLocation.longitude, currentLocation.latitude],
      zoom: 13,
      speed: 2
    });
    
    // Add or update user location marker
    if (!markersRef.current.userLocation) {
      // Create user marker element
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#4338ca';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.25)';
      
      // Add pulse animation
      const pulse = document.createElement('div');
      pulse.className = 'pulse';
      pulse.style.position = 'absolute';
      pulse.style.top = '-10px';
      pulse.style.left = '-10px';
      pulse.style.right = '-10px';
      pulse.style.bottom = '-10px';
      pulse.style.borderRadius = '50%';
      pulse.style.backgroundColor = 'rgba(67, 56, 202, 0.4)';
      pulse.style.animation = 'pulse 2s infinite';
      el.appendChild(pulse);
      
      // Create and add marker
      markersRef.current.userLocation = new mapboxgl.Marker(el)
        .setLngLat([currentLocation.longitude, currentLocation.latitude])
        .addTo(map.current);
    } else {
      // Update marker position
      markersRef.current.userLocation
        .setLngLat([currentLocation.longitude, currentLocation.latitude]);
    }
  }, [currentLocation]);
  
  // Update job markers when jobs change
  useEffect(() => {
    if (!map.current || !isMapInitialized || !jobs.length) return;
    
    // Get current marker IDs
    const currentMarkerIds = Object.keys(markersRef.current).filter(id => id !== 'userLocation');
    
    // Find IDs to remove (markers for jobs that no longer exist)
    const jobIds = jobs.map(job => job.id);
    const idsToRemove = currentMarkerIds.filter(id => !jobIds.includes(id));
    
    // Remove old markers
    idsToRemove.forEach(id => {
      if (markersRef.current[id]) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
    
    // Add or update markers for current jobs
    jobs.forEach(job => {
      // Skip if no coordinates
      if (!job.pickupCoordinates) return;
      
      // Check if this job already has a marker
      if (markersRef.current[job.id]) {
        // Update position if needed
        markersRef.current[job.id].setLngLat([
          job.pickupCoordinates.lng,
          job.pickupCoordinates.lat
        ]);
      } else {
        // Create new marker element
        const el = document.createElement('div');
        el.className = 'job-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = job.isRush ? '#ef4444' : '#10b981';
        el.style.color = 'white';
        el.style.fontWeight = 'bold';
        el.style.display = 'flex';
        el.style.justifyContent = 'center';
        el.style.alignItems = 'center';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.border = '2px solid white';
        el.innerHTML = `${job.price.currencySymbol}${Math.round(job.price.amount)}`;
        
        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2">
            <h3 class="font-medium text-gray-900">${job.title}</h3>
            <p class="text-sm text-gray-600">${job.distance ? `${job.distance.toFixed(1)} ${job.distanceUnit}` : 'Distance unknown'}</p>
            <p class="text-sm text-gray-600">${job.weight} ${job.weightUnit}</p>
            <div class="mt-2 flex justify-end">
              <button id="accept-btn-${job.id}" class="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                Accept Job
              </button>
            </div>
          </div>
        `);
        
        // Create and add marker
        markersRef.current[job.id] = new mapboxgl.Marker(el)
          .setLngLat([job.pickupCoordinates.lng, job.pickupCoordinates.lat])
          .setPopup(popup)
          .addTo(map.current);
        
        // Add click event
        el.addEventListener('click', () => {
          onJobSelect(job.id);
        });
        
        // Add event listener for accept button in popup
        popup.on('open', () => {
          setTimeout(() => {
            const acceptBtn = document.getElementById(`accept-btn-${job.id}`);
            if (acceptBtn) {
              acceptBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onJobAccept(job.id);
              });
            }
          }, 0);
        });
      }
      
      // Handle active job state
      const marker = markersRef.current[job.id];
      if (marker) {
        const element = marker.getElement();
        
        if (job.id === activeJobId) {
          element.style.width = '40px';
          element.style.height = '40px';
          element.style.zIndex = 2;
          element.style.border = '3px solid #fcd34d';
          
          // Show popup for active marker
          marker.togglePopup();
          
          // Pan to this marker
          map.current.flyTo({
            center: [job.pickupCoordinates.lng, job.pickupCoordinates.lat],
            zoom: 14,
            speed: 1.5
          });
        } else {
          element.style.width = '30px';
          element.style.height = '30px';
          element.style.zIndex = 1;
          element.style.border = '2px solid white';
          
          // Hide popup if it was showing
          if (marker.getPopup().isOpen()) {
            marker.togglePopup();
          }
        }
      }
    });
  }, [jobs, activeJobId, isMapInitialized, onJobSelect, onJobAccept]);
  
  // Handle location permission request
  const handleRequestLocation = async () => {
    const granted = await requestLocationPermission();
    if (!granted) {
      alert('Location permission is required for best experience. Please enable location services.');
    }
  };
  
  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="h-full w-full" />
      
      {/* No location permission message */}
      {locationPermission === 'denied' && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
          <h3 className="text-gray-800 font-medium">Location Access Needed</h3>
          <p className="text-gray-600 text-sm mt-1">
            Enable location services for the best experience and to see jobs near you.
          </p>
          <button
            onClick={handleRequestLocation}
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm w-full hover:bg-green-700 transition-colors"
          >
            Enable Location
          </button>
        </div>
      )}
      
      {/* Styles for pulse animation */}
      <style jsx>{`
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

export default MapView;