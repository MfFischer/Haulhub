import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Use the same token approach as JobTracker
// This sets the token globally for mapboxgl
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoibWZmaXNjaGVyIiwiYSI6ImNtOG95ZzduazA0Y3Iya3NhZnN3aXFqc3YifQ.6m4i0S97xHmCR8QV4dN1Qw';

const MapView = ({ jobs = [], activeJobId = null, onJobSelect = () => {}, onJobAccept = () => {} }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Helper function to safely get address string
  const getAddressString = (locationObj) => {
    if (!locationObj) return 'Address not available';
    if (typeof locationObj === 'string') return locationObj;
    return locationObj.address || 'Address not available';
  };
  
  // Initialize map
  useEffect(() => {
    if (map.current) return; // Already initialized
    
    try {
      console.log("Initializing map with token:", mapboxgl.accessToken ? "Token found" : "Token missing");
      
      // Create map instance with streets-v11 style like in JobTracker
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11', // Use same style as JobTracker
        center: [8.72, 50.38], // Default coordinates
        zoom: 9
      });
      
      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Set up load and error handlers
      map.current.on('load', () => {
        console.log("Map loaded successfully!");
        setMapLoaded(true);
      });
      
      map.current.on('error', (e) => {
        console.error("Mapbox map error:", e);
        // Only set error for critical errors, not tile loading 404s
        if (!e.error || (e.error.status !== 404 && !e.error.url?.includes('incidents'))) {
          setMapError(true);
        }
      });
      
      // Add error handling for missing images
      map.current.on('styleimagemissing', (e) => {
        const id = e.id;
        console.log(`Creating missing image: ${id}`);
        
        // Create a blank image to satisfy the request
        const img = new Image(1, 1);
        img.onload = () => {
          if (map.current) {
            map.current.addImage(id, img);
          }
        };
        img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=';
      });
    } catch (error) {
      console.error("Error creating map:", error);
      setMapError(true);
    }
    
    return () => {
      // Cleanup on unmount
      Object.values(markersRef.current).forEach(marker => {
        if (marker) marker.remove();
      });
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Update markers when jobs change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    console.log("Updating markers for jobs:", jobs.length);
    
    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      if (marker) marker.remove();
    });
    markersRef.current = {};
    
    // Early return if no jobs
    if (jobs.length === 0) return;
    
    // Create bounds object to fit all markers
    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoordinates = false;
    
    // Add markers for each job
    jobs.forEach(job => {
      // Only add markers if coordinates exist
      if (!job.pickupCoordinates || !job.dropoffCoordinates) {
        console.warn("Job missing coordinates:", job.id);
        return;
      }
      
      try {
        // Add pickup marker
        const pickupEl = document.createElement('div');
        pickupEl.className = 'pickup-marker';
        pickupEl.style.width = '20px';
        pickupEl.style.height = '20px';
        pickupEl.style.borderRadius = '50%';
        pickupEl.style.backgroundColor = '#10b981'; // Green
        pickupEl.style.border = '2px solid white';
        pickupEl.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.25)';
        pickupEl.style.cursor = 'pointer';
        
        // Add the marker to the map
        const pickupMarker = new mapboxgl.Marker(pickupEl)
          .setLngLat([job.pickupCoordinates.lng, job.pickupCoordinates.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 10px;">
              <h3 style="font-weight: bold; margin-bottom: 5px;">${job.title || 'Job'}</h3>
              <p style="margin: 0;">Pickup: ${getAddressString(job.pickup)}</p>
              <p style="margin-top: 5px;"><strong>${job.price?.currencySymbol || '$'}${job.price?.amount?.toFixed(2) || '0.00'}</strong></p>
              <button id="view-job-${job.id}" style="background-color: #10b981; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin-top: 8px; cursor: pointer;">View Job</button>
            </div>
          `))
          .addTo(map.current);
        
        // Add dropoff marker
        const dropoffEl = document.createElement('div');
        dropoffEl.className = 'dropoff-marker';
        dropoffEl.style.width = '20px';
        dropoffEl.style.height = '20px';
        dropoffEl.style.borderRadius = '50%';
        dropoffEl.style.backgroundColor = '#ef4444'; // Red
        dropoffEl.style.border = '2px solid white';
        dropoffEl.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.25)';
        
        const dropoffMarker = new mapboxgl.Marker(dropoffEl)
          .setLngLat([job.dropoffCoordinates.lng, job.dropoffCoordinates.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 10px;">
              <p style="margin: 0;">Dropoff: ${getAddressString(job.dropoff)}</p>
            </div>
          `))
          .addTo(map.current);
        
        // Store markers with job ID
        markersRef.current[`pickup-${job.id}`] = pickupMarker;
        markersRef.current[`dropoff-${job.id}`] = dropoffMarker;
        
        // Add pickup and dropoff points to bounds
        bounds.extend([job.pickupCoordinates.lng, job.pickupCoordinates.lat]);
        bounds.extend([job.dropoffCoordinates.lng, job.dropoffCoordinates.lat]);
        hasValidCoordinates = true;
        
        // Add event listener for the view job button
        pickupMarker.getPopup().on('open', () => {
          setTimeout(() => {
            const button = document.getElementById(`view-job-${job.id}`);
            if (button) {
              button.addEventListener('click', () => {
                onJobSelect(job.id);
              });
            }
          }, 10);
        });
      } catch (error) {
        console.error("Error adding markers for job:", job.id, error);
      }
    });
    
    // Fit map to bounds with padding if we have valid coordinates
    if (hasValidCoordinates && !bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [jobs, mapLoaded, onJobSelect]);
  
  // Highlight active job
  useEffect(() => {
    if (!map.current || !mapLoaded || !activeJobId) return;
    
    // Highlight the active job markers
    Object.entries(markersRef.current).forEach(([key, marker]) => {
      if (!marker || !marker.getElement) return;
      const element = marker.getElement();
      
      // Reset size and shadow
      element.style.width = '20px';
      element.style.height = '20px';
      element.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.25)';
      
      // If this is active marker, highlight it
      if (key === `pickup-${activeJobId}` || key === `dropoff-${activeJobId}`) {
        element.style.width = '24px';
        element.style.height = '24px';
        element.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.7)';
      }
    });
    
    // Draw a line between pickup and dropoff for active job
    const activeJob = jobs.find(job => job.id === activeJobId);
    if (activeJob && activeJob.pickupCoordinates && activeJob.dropoffCoordinates) {
      try {
        // Check if map is fully loaded before adding/updating sources
        if (!map.current.loaded()) {
          console.log("Map not fully loaded yet, skipping route drawing");
          return;
        }
        
        // Create or update route line
        if (map.current.getSource('route')) {
          // Update existing route
          map.current.getSource('route').setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [activeJob.pickupCoordinates.lng, activeJob.pickupCoordinates.lat],
                [activeJob.dropoffCoordinates.lng, activeJob.dropoffCoordinates.lat]
              ]
            }
          });
        } else {
          // Create new route
          try {
            map.current.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [activeJob.pickupCoordinates.lng, activeJob.pickupCoordinates.lat],
                    [activeJob.dropoffCoordinates.lng, activeJob.dropoffCoordinates.lat]
                  ]
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
                'line-opacity': 0.7,
                'line-dasharray': [2, 1]
              }
            });
          } catch (error) {
            console.warn("Could not add route layer:", error.message);
          }
        }
        
        // Fit the map to show active job
        const bounds = new mapboxgl.LngLatBounds()
          .extend([activeJob.pickupCoordinates.lng, activeJob.pickupCoordinates.lat])
          .extend([activeJob.dropoffCoordinates.lng, activeJob.dropoffCoordinates.lat]);
        
        map.current.fitBounds(bounds, {
          padding: 80,
          maxZoom: 15
        });
      } catch (error) {
        console.error("Error drawing route:", error);
      }
    }
  }, [activeJobId, jobs, mapLoaded]);
  
  if (mapError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <h3 className="text-lg font-medium text-red-800 mb-2">Map Error</h3>
        <p className="text-red-600">
          Could not initialize the map. Please check if your Mapbox token is valid or if
          you have an internet connection.
        </p>
        <div className="mt-4">
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full relative">
      <div ref={mapContainer} className="h-full w-full" />
      
      {jobs.length === 0 && mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Jobs Available</h3>
            <p className="mt-2 text-gray-600">
              There are currently no available jobs in your area. Please check back later.
            </p>
          </div>
        </div>
      )}
      
      {activeJobId && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => onJobAccept(activeJobId)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Accept Selected Job
          </button>
        </div>
      )}
    </div>
  );
};

export default MapView;