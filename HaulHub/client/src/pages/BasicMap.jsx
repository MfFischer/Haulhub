import React, { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export const BasicMap = () => {
  useEffect(() => {
    // Set API key directly
    mapboxgl.accessToken = 'pk.eyJ1IjoibWZmaXNjaGVyIiwiYSI6ImNtOG95ZzduazA0Y3Iya3NhZnN3aXFqc3YifQ.6m4i0S97xHmCR8QV4dN1Qw';
    
    // Create the container element
    const container = document.getElementById('map-container');
    
    // Create the map
    const map = new mapboxgl.Map({
      container: 'map-container',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [8.72, 50.38],
      zoom: 12
    });
    
    // Add a marker
    new mapboxgl.Marker()
      .setLngLat([8.72, 50.38])
      .addTo(map);
      
    return () => map.remove();
  }, []);
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Super Basic Map</h1>
      <div 
        id="map-container" 
        style={{ 
          width: '100%', 
          height: '500px', 
          border: '2px solid black'
        }}
      ></div>
    </div>
  );
};
