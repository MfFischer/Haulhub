import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Get token from environment variable instead of hardcoding
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

if (!MAPBOX_TOKEN) {
  console.error('Mapbox token is missing! Make sure REACT_APP_MAPBOX_TOKEN is set in your .env file');
}

mapboxgl.accessToken = MAPBOX_TOKEN;

const MapView = ({ jobs = [], activeJobId = null, onJobSelect = () => {}, onJobAccept = () => {} }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map on component mount
  useEffect(() => {
    if (map.current) return; // Map already initialized
    
    try {
      // Ensure container exists and has dimensions
      if (!mapContainer.current) {
        console.error("Map container not found");
        return;
      }

      console.log("Initializing map with token:", MAPBOX_TOKEN ? "Token present" : "Token missing");
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11', // Use streets style like JobTracker
        center: [8.72, 50.38],
        zoom: 12,
        attributionControl: true // Enable attribution control
      });

      // Add navigation controls like in JobTracker
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.current.on('load', () => {
        console.log("Map loaded successfully!");
        setMapLoaded(true);
        addJobClusters();
      });

      map.current.on('error', (e) => {
        console.error("Map error:", e);
        setMapError(true);
      });

    } catch (error) {
      console.error("Failed to initialize map:", error);
      setMapError(true);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Function to add markers with clustering
  const addJobClusters = () => {
    if (!map.current || !mapLoaded || jobs.length === 0) return;
    
    console.log("Adding clustered markers for jobs:", jobs.length);

    // First, remove any existing sources and layers for jobs
    if (map.current.getSource('pickups')) {
      map.current.removeLayer('pickup-clusters');
      map.current.removeLayer('pickup-cluster-count');
      map.current.removeLayer('pickup-unclustered-point');
      map.current.removeSource('pickups');
    }
    
    if (map.current.getSource('dropoffs')) {
      map.current.removeLayer('dropoff-clusters');
      map.current.removeLayer('dropoff-cluster-count');
      map.current.removeLayer('dropoff-unclustered-point');
      map.current.removeSource('dropoffs');
    }
    
    // Transform jobs into GeoJSON format
    const pickupPoints = {
      type: 'FeatureCollection',
      features: jobs.filter(job => job.pickupCoordinates).map(job => ({
        type: 'Feature',
        properties: {
          id: job.id,
          title: job.title || 'Job',
          isPickup: true,
          isActive: job.id === activeJobId
        },
        geometry: {
          type: 'Point',
          coordinates: [job.pickupCoordinates.lng, job.pickupCoordinates.lat]
        }
      }))
    };
    
    const dropoffPoints = {
      type: 'FeatureCollection',
      features: jobs.filter(job => job.dropoffCoordinates).map(job => ({
        type: 'Feature',
        properties: {
          id: job.id,
          title: job.title || 'Job',
          isPickup: false,
          isActive: job.id === activeJobId
        },
        geometry: {
          type: 'Point',
          coordinates: [job.dropoffCoordinates.lng, job.dropoffCoordinates.lat]
        }
      }))
    };
    
    // Only proceed if we have valid points
    if (!pickupPoints.features.length && !dropoffPoints.features.length) {
      console.warn("No valid coordinates found in jobs data");
      return;
    }
    
    try {
      // Add pickup points source with clustering
      map.current.addSource('pickups', {
        type: 'geojson',
        data: pickupPoints,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points
      });
      
      // Add dropoff points source with clustering
      map.current.addSource('dropoffs', {
        type: 'geojson',
        data: dropoffPoints,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });
      
      // Add pickup clusters layer
      map.current.addLayer({
        id: 'pickup-clusters',
        type: 'circle',
        source: 'pickups',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#10b981', // Green for pickup clusters
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20, // radius for 1-9 points
            10, 
            30, // radius for 10-49 points
            50,
            40 // radius for 50+ points
          ],
          'circle-opacity': 0.8
        }
      });
      
      // Add pickup cluster count layer
      map.current.addLayer({
        id: 'pickup-cluster-count',
        type: 'symbol',
        source: 'pickups',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });
      
      // Add unclustered pickup points layer
      map.current.addLayer({
        id: 'pickup-unclustered-point',
        type: 'circle',
        source: 'pickups',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#10b981', // Green for pickup points
          'circle-radius': 10,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
      
      // Add dropoff clusters layer
      map.current.addLayer({
        id: 'dropoff-clusters',
        type: 'circle',
        source: 'dropoffs',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#ef4444', // Red for dropoff clusters
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            30,
            50,
            40
          ],
          'circle-opacity': 0.8
        }
      });
      
      // Add dropoff cluster count layer
      map.current.addLayer({
        id: 'dropoff-cluster-count',
        type: 'symbol',
        source: 'dropoffs',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });
      
      // Add unclustered dropoff points layer
      map.current.addLayer({
        id: 'dropoff-unclustered-point',
        type: 'circle',
        source: 'dropoffs',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#ef4444', // Red for dropoff points
          'circle-radius': 10,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
      
      // Add click event for pickup and dropoff clusters - zoom in when a cluster is clicked
      map.current.on('click', 'pickup-clusters', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, { layers: ['pickup-clusters'] });
        const clusterId = features[0].properties.cluster_id;
        map.current.getSource('pickups').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.current.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        });
      });
      
      map.current.on('click', 'dropoff-clusters', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, { layers: ['dropoff-clusters'] });
        const clusterId = features[0].properties.cluster_id;
        map.current.getSource('dropoffs').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.current.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        });
      });
      
      // Add click event for individual job markers
      map.current.on('click', 'pickup-unclustered-point', (e) => {
        const jobId = e.features[0].properties.id;
        onJobSelect(jobId);
      });
      
      map.current.on('click', 'dropoff-unclustered-point', (e) => {
        const jobId = e.features[0].properties.id;
        onJobSelect(jobId);
      });
      
      // Change cursor when hovering over points and clusters
      map.current.on('mouseenter', 'pickup-clusters', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'pickup-clusters', () => {
        map.current.getCanvas().style.cursor = '';
      });
      
      map.current.on('mouseenter', 'pickup-unclustered-point', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'pickup-unclustered-point', () => {
        map.current.getCanvas().style.cursor = '';
      });
      
      map.current.on('mouseenter', 'dropoff-clusters', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'dropoff-clusters', () => {
        map.current.getCanvas().style.cursor = '';
      });
      
      map.current.on('mouseenter', 'dropoff-unclustered-point', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'dropoff-unclustered-point', () => {
        map.current.getCanvas().style.cursor = '';
      });
      
      // Fit the map to show all points
      if (pickupPoints.features.length > 0 || dropoffPoints.features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        
        pickupPoints.features.forEach(feature => {
          bounds.extend(feature.geometry.coordinates);
        });
        
        dropoffPoints.features.forEach(feature => {
          bounds.extend(feature.geometry.coordinates);
        });
        
        if (!bounds.isEmpty()) {
          map.current.fitBounds(bounds, {
            padding: 80,
            maxZoom: 15
          });
        }
      }
    } catch (error) {
      console.error("Error adding clustered markers:", error);
    }
  };
  
  // Add route line for active job
  const addRouteForActiveJob = () => {
    if (!map.current || !mapLoaded || !activeJobId) return;
    
    const activeJob = jobs.find(job => job.id === activeJobId);
    if (!activeJob || !activeJob.pickupCoordinates || !activeJob.dropoffCoordinates) return;
    
    // Remove existing route if any
    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    
    try {
      // Add route source
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
      
      // Add route layer
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
      
      // Fit map to show the active job
      const bounds = new mapboxgl.LngLatBounds()
        .extend([activeJob.pickupCoordinates.lng, activeJob.pickupCoordinates.lat])
        .extend([activeJob.dropoffCoordinates.lng, activeJob.dropoffCoordinates.lat]);
      
      map.current.fitBounds(bounds, {
        padding: 100,
        maxZoom: 15
      });
    } catch (error) {
      console.error("Error adding route for active job:", error);
    }
  };
  
  // Update clusters when jobs change
  useEffect(() => {
    if (map.current && mapLoaded) {
      addJobClusters();
    }
  }, [jobs, mapLoaded]);
  
  // Update active job visualization
  useEffect(() => {
    if (map.current && mapLoaded) {
      // Update clusters to reflect the new active job
      addJobClusters();
      
      // Add route for active job
      addRouteForActiveJob();
    }
  }, [activeJobId, mapLoaded]);
  
  // Show error message if map fails to load
  if (mapError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <h3 className="text-lg font-medium text-red-800 mb-2">Map Error</h3>
        <p className="text-red-600">
          Could not initialize the map. Please check your internet connection.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Reload Page
        </button>
      </div>
    );
  }
  
  return (
    <div className="h-full relative">
      {/* Map container */}
      <div 
        ref={mapContainer} 
        className="h-full w-full" 
        style={{ minHeight: '400px' }} // Ensure minimum height
      />
      
      {/* No jobs message */}
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
      
      {/* Legend */}
      <div className="absolute top-2 left-2 bg-white p-2 rounded shadow-md text-sm">
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span>Pickup Points</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span>Dropoff Points</span>
        </div>
      </div>
      
      {/* Accept job button */}
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