import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox token - replace with your own if needed
mapboxgl.accessToken = 'pk.eyJ1IjoiYXNoaXNoZzIyMDkiLCJhIjoiY21hYzdkcjd4MDA2dTJsc2RveHkzMjFhMSJ9.zTrg-kKSZW1UAmvzEvOOCQ';

const BasicMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    if (map.current) return; // Skip if map is already initialized

    console.log('Initializing map...');
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-74.001937, 40.717759], // New York
      zoom: 14
    });

    // Add navigation controls
    newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add a marker for our test property
    newMap.on('load', () => {
      console.log('Map loaded successfully');
      
      // Create marker element
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundImage = 'url(https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png)';
      el.style.width = '25px';
      el.style.height = '25px';
      el.style.backgroundSize = 'cover';
      el.style.cursor = 'pointer';
      
      // Add marker
      new mapboxgl.Marker(el)
        .setLngLat([-74.001937, 40.717759])
        .setPopup(new mapboxgl.Popup().setHTML("<h3>84 WHITE ST, NEW YORK</h3>"))
        .addTo(newMap);
        
      setMapInitialized(true);
      map.current = newMap;
    });

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Basic Map Test</h1>
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height: '400px', borderRadius: '8px' }}
      ></div>
      {mapInitialized ? 
        <p style={{ color: 'green' }}>Map initialized successfully!</p> : 
        <p>Initializing map...</p>
      }
    </div>
  );
};

export default BasicMap;
