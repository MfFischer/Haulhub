import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapTest = () => {
  const mapContainer = useRef(null);
  
  useEffect(() => {
    // Force token directly
    mapboxgl.accessToken = 'pk.eyJ1IjoibWZmaXNjaGVyIiwiYSI6ImNtOG95ZzduazA0Y3Iya3NhZnN3aXFqc3YifQ.6m4i0S97xHmCR8QV4dN1Qw';
    
    console.log("Creating map with explicit dimensions");
    
    // Add a small delay to ensure the DOM is ready
    setTimeout(() => {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [8.72, 50.38],
        zoom: 12
      });
      
      map.on('load', () => {
        console.log("Map loaded successfully!");
        // Add a marker to ensure something is visible
        new mapboxgl.Marker()
          .setLngLat([8.72, 50.38])
          .addTo(map);
      });
      
      // Debug any errors
      map.on('error', (e) => {
        console.error("Map error:", e);
      });
    }, 500);
    
    // Cleanup function
    return () => {
      // No cleanup needed for this test
    };
  }, []);
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h1>Map Test Page</h1>
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '500px', 
          backgroundColor: '#e0e0e0',
          border: '2px solid #333',
          flex: 1,
          minHeight: '500px'
        }}
      />
      <div style={{marginTop: '20px'}}>
        <p>Map should appear above this text. Check console for logs.</p>
      </div>
    </div>
  );
};

export default MapTest;