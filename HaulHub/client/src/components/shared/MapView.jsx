import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// IMPORTANT: We'll set the token just before using it
// This is a bare minimum component that should work

const MapView = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (map.current) return; // Already initialized
    
    try {
      // Set token right before use to prevent any possible overrides
      const token = 'pk.eyJ1IjoibWZmaXNjaGVyIiwiYSI6ImNtOG95ZzduazA0Y3Iya3NhZnN3aXFqc3YifQ.6m4i0S97xHmCR8QV4dN1Qw';
      mapboxgl.accessToken = token;
      
      console.log("Initializing map with token (verified):", mapboxgl.accessToken);
      
      // Create a minimal map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [8.72, 50.38], // Your coordinates
        zoom: 12
      });
      
      map.current.on('load', () => {
        console.log("Map loaded successfully!");
      });
      
      map.current.on('error', (e) => {
        console.error("Mapbox map error:", e);
        setMapError(true);
      });
    } catch (error) {
      console.error("Error creating map:", error);
      setMapError(true);
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);
  
  if (mapError) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#f8d7da', color: '#842029', borderRadius: '5px' }}>
        <h3>Map Error</h3>
        <p>Could not initialize the map. Please check console for details.</p>
      </div>
    );
  }
  
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
};

export default MapView;