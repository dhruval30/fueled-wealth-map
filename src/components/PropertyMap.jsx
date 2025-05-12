import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
// Import turf for geographical calculations
import * as turf from '@turf/turf';

// Mapbox token - replace with your own if needed
mapboxgl.accessToken = 'pk.eyJ1IjoiYXNoaXNoZzIyMDkiLCJhIjoiY21hYzdkcjd4MDA2dTJsc2RveHkzMjFhMSJ9.zTrg-kKSZW1UAmvzEvOOCQ';

const PropertyMap = ({ properties, onPropertySelect }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const markersRef = useRef([]);
  const propertiesRef = useRef(properties); // Store properties reference to compare
  
  // Function to reset map to initial state
  const resetMapView = () => {
    if (!map.current) return;
    
    // Define initial state here
    const initialCenter = [-98.5795, 39.8283]; // Center of US
    const initialZoom = 3;
    
    map.current.flyTo({
      center: initialCenter,
      zoom: initialZoom,
      duration: 1000
    });
    
    // Fit to properties if they exist
    if (properties && properties.length > 0 && propertiesRef.current) {
      const bounds = new mapboxgl.LngLatBounds();
      let validCoordinatesFound = false;
      
      properties.forEach(property => {
        if (property.latitude && property.longitude) {
          const lat = parseFloat(property.latitude);
          const lng = parseFloat(property.longitude);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend([lng, lat]);
            validCoordinatesFound = true;
          }
        }
      });
      
      if (validCoordinatesFound && !bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 14,
          duration: 1000
        });
      }
    }
  };
  
  // Clear existing markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };
  
  // Check if properties have actually changed to prevent unnecessary re-renders
  const havePropertiesChanged = (newProps, oldProps) => {
    if (newProps.length !== oldProps.length) return true;
    
    // Quick comparison without deep checking every property
    // Just check a sample of properties by ID
    const newIds = new Set(newProps.map(p => p.id));
    const oldIds = new Set(oldProps.map(p => p.id));
    
    if (newIds.size !== oldIds.size) return true;
    
    for (const id of newIds) {
      if (!oldIds.has(id)) return true;
    }
    
    return false;
  };
  
  // Toggle between map styles
  const toggleMapStyle = () => {
    if (!map.current) return;
    
    // Use hybrid map style for satellite view to show labels and boundaries
    const newStyle = isSatellite 
      ? 'mapbox://styles/mapbox/light-v11' 
      : 'mapbox://styles/mapbox/satellite-streets-v12'; // Hybrid satellite view with labels
    
    map.current.setStyle(newStyle);
    
    // Re-add hover effects when style loads
    map.current.on('style.load', () => {
      addPlaceNameHoverEffects();
    });
    
    setIsSatellite(!isSatellite);
  };
  
  // Initialize map when component mounts
  useEffect(() => {
    if (map.current) return; // Skip if map is already initialized
    
    // Define initial state inside the effect
    const initialCenter = [-98.5795, 39.8283]; // Center of US
    const initialZoom = 3;
    
    console.log('Initializing property map...');
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: initialCenter,
      zoom: initialZoom,
      preserveDrawingBuffer: true
    });
    
    // Add navigation controls
    newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Wait for map to load before proceeding
    newMap.on('load', () => {
      console.log('Map loaded');
      map.current = newMap;
      setMapLoaded(true);
      
      // Add hover effects for place names
      addPlaceNameHoverEffects();
      
      // Listen for zoom changes
      newMap.on('zoom', () => {
        const currentZoom = newMap.getZoom();
        setIsZoomedIn(currentZoom > initialZoom + 1); // Show reset button when zoomed in significantly
      });
    });
    
    // Cleanup function
    return () => {
      clearMarkers();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Add hover effects for place names
  const addPlaceNameHoverEffects = () => {
    if (!map.current) return;
    
    // Create a popup for hover tooltips
    const hoverPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 15
    });
    
    // Get all layer IDs to debug
    const allLayers = map.current.getStyle().layers;
    console.log('All layers:', allLayers.map(layer => ({
      id: layer.id,
      type: layer.type,
      sourceLayer: layer['source-layer']
    })));
    
    // Find layers that contain place labels - be more inclusive
    const placeLabelLayers = allLayers.filter(layer => 
      layer.type === 'symbol' && 
      (layer.id.includes('label') || layer.id.includes('place') || layer.id.includes('settlement'))
    );
    console.log('All symbol layers with labels:', placeLabelLayers.map(l => l.id));
    
    // Also check for specific city and place layers
    const cityLayers = allLayers.filter(layer => 
      layer.type === 'symbol' && 
      (layer.id.includes('city') || layer.id.includes('town') || layer.id.includes('place'))
    );
    console.log('City/Place layers:', cityLayers.map(l => l.id));
    
    // Combine all relevant layers
    const relevantLayers = [...new Set([...placeLabelLayers, ...cityLayers])];
    
    // Add hover effects for all relevant layers
    relevantLayers.forEach(layer => {
      map.current.on('mouseenter', layer.id, (e) => {
        if (e.features.length > 0) {
          map.current.getCanvas().style.cursor = 'pointer';
          
          const feature = e.features[0];
          const placeName = feature.properties.name || feature.properties.name_en || 'Place';
          const placeType = feature.properties.type || feature.properties.class || '';
          
          // Skip hover effects for countries
          if (layer.id.includes('country') || placeType === 'country') {
            // Don't show popup for countries, but keep cursor as pointer
            return;
          }
          
          // Determine place type based on layer ID or properties
          let bgColor = 'rgba(0,0,0,0.8)'; // Default dark for cities
          let fontSize = '12px';
          let fontWeight = '500';
          
          // Different colors for different place types
          if (layer.id.includes('state') || placeType === 'state') {
            bgColor = 'rgba(0,100,200,0.9)';
            fontSize = '13px';
            fontWeight = '600';
          } else if (layer.id.includes('city') || layer.id.includes('town') || placeType === 'city' || placeType === 'town') {
            bgColor = 'rgba(0,0,0,0.8)'; // Dark background for cities
            fontSize = '12px';
            fontWeight = '500';
          }
          
          console.log(`Hovering over: ${placeName} (type: ${placeType}, layer: ${layer.id})`);
          
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="
                padding: 5px 10px;
                background: ${bgColor};
                color: white;
                border-radius: 4px;
                font-size: ${fontSize};
                font-weight: ${fontWeight};
                white-space: nowrap;
              ">
                ${placeName}
              </div>
            `)
            .addTo(map.current);
        }
      });
      
      map.current.on('mouseleave', layer.id, () => {
        map.current.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });
      
      // Add click handler for zooming to places
      map.current.on('click', layer.id, (e) => {
        if (e.features.length > 0) {
          const feature = e.features[0];
          const placeName = feature.properties.name || feature.properties.name_en || 'Place';
          const coordinates = [e.lngLat.lng, e.lngLat.lat];
          const placeType = feature.properties.type || feature.properties.class || '';
          
          console.log(`${placeName} clicked at:`, coordinates, 'type:', placeType);
          
          // Get current zoom level
          const currentZoom = map.current.getZoom();
          
          // Different zoom levels for different place types
          let zoomLevel = 10; // Default for cities
          let shouldZoom = true;
          
          // Countries - no zoom
          if (layer.id.includes('country') || placeType === 'country') {
            shouldZoom = false;
            console.log(`Country ${placeName}, zoom disabled`);
          }
          // States
          else if (layer.id.includes('state') || placeType === 'state') {
            zoomLevel = 6; // Zoom less for states
          }
          // Cities and towns
          else if (layer.id.includes('city') || layer.id.includes('town') || placeType === 'city' || placeType === 'town') {
            zoomLevel = 12; // Zoom more for cities
          }
          // Counties - no zoom
          else if (layer.id.includes('county') || placeType === 'county') {
            shouldZoom = false;
            console.log(`County ${placeName}, zoom disabled`);
          }
          // Smaller places (neighborhoods, districts, etc.)
          else {
            // Only zoom if current zoom is less than city level
            if (currentZoom >= 12) {
              shouldZoom = false;
              console.log(`Already at city level or closer, not zooming into ${placeName}`);
            } else {
              zoomLevel = 12; // Zoom to city level max for smaller places
            }
          }
          
          // Only zoom if we should
          if (shouldZoom) {
            // Zoom to the clicked place
            map.current.flyTo({
              center: coordinates,
              zoom: zoomLevel,
              duration: 1000
            });
            
            // Optional: Try to get boundaries if available
            if (feature.geometry && feature.geometry.type === 'Polygon') {
              const bounds = turf.bbox(feature);
              map.current.fitBounds(bounds, {
                padding: 50,
                duration: 1000,
                maxZoom: zoomLevel
              });
            }
          }
        }
      });
    });
  };
  
  // Add property markers when properties change or map loads
  useEffect(() => {
    if (!map.current || !mapLoaded || !properties || properties.length === 0) return;
    
    // Only update markers if properties have actually changed
    if (havePropertiesChanged(properties, propertiesRef.current)) {
      console.log('Properties changed, updating markers for', properties.length, 'properties');
      propertiesRef.current = properties;
      
      // Clear existing markers
      clearMarkers();
      
      // Add markers for each property
      const bounds = new mapboxgl.LngLatBounds();
      let validCoordinatesFound = false;
      
      properties.forEach(property => {
        // Skip if missing coordinates
        if (!property.latitude || !property.longitude) return;
        
        const lat = parseFloat(property.latitude);
        const lng = parseFloat(property.longitude);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        validCoordinatesFound = true;
        
        // Create popup content
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: false,
          closeOnClick: false
        })
        .setHTML(`
          <div>
            <h3 style="margin: 0 0 5px 0; font-weight: bold;">${property.address || 'Unknown Address'}</h3>
            <p style="margin: 0; font-size: 12px;">${property.propertyType || 'Property'}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0
            }).format(property.marketValue || 0)}</p>
          </div>
        `);
        
        // Create marker element
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = 'url(https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png)';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundSize = 'cover';
        el.style.cursor = 'pointer';
        
        // Add marker to map
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current);
        
        // Store marker reference for cleanup
        markersRef.current.push(marker);
        
        // Add click event to marker
        el.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent event from bubbling up
          console.log('Property selected:', property);
          if (onPropertySelect) onPropertySelect(property);
        });
        
        // Extend bounds to include this point
        bounds.extend([lng, lat]);
      });
      
      // If there are properties with valid coordinates, fit bounds to them
      if (validCoordinatesFound && !bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 14,
          duration: 1000
        });
      }
    }
  }, [properties, mapLoaded, onPropertySelect]);
  
  return (
    <div style={{ 
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      position: 'relative'
    }}>
      <h2 style={{ marginTop: 0, marginBottom: '15px' }}>Property Map</h2>
      
      {/* Reset Button */}
      {isZoomedIn && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '20px',
          zIndex: 1,
          backgroundColor: 'white',
          borderRadius: '6px',
          boxShadow: '0 2px 6px rgba(0,0,0,.1)',
          padding: '0',
        }}>
          <button
            onClick={resetMapView}
            style={{
              background: 'white',
              border: '1px solid #ddd',
              padding: '8px 16px',
              cursor: 'pointer',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Reset View
          </button>
        </div>
      )}
      
      {/* Enhanced Sliding Switch for Satellite Toggle */}
      <div style={{
        position: 'absolute',
        top: '70px',
        right: '60px',
        zIndex: 1,
        backgroundColor: 'white',
        borderRadius: '22px',
        boxShadow: '0 2px 8px rgba(0,0,0,.1)',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{
          fontSize: '12px',
          color: isSatellite ? '#666' : '#333',
          fontWeight: '500',
          transition: 'color 0.3s ease',
          userSelect: 'none',
          paddingLeft: '8px'
        }}>
          Map
        </span>
        <button
          onClick={toggleMapStyle}
          style={{
            background: isSatellite ? '#3B82F6' : '#E5E7EB',
            border: 'none',
            padding: '0',
            cursor: 'pointer',
            borderRadius: '18px',
            width: '40px',
            height: '22px',
            position: 'relative',
            transition: 'background-color 0.3s ease',
          }}
          aria-label={`Switch to ${isSatellite ? 'map' : 'satellite'} view`}
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: 'white',
              position: 'absolute',
              top: '2px',
              left: isSatellite ? '20px' : '2px',
              transition: 'transform 0.3s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}
          />
        </button>
        <span style={{
          fontSize: '12px',
          color: isSatellite ? '#333' : '#666',
          fontWeight: '500',
          transition: 'color 0.3s ease',
          userSelect: 'none',
          paddingRight: '8px'
        }}>
          Satellite
        </span>
      </div>
      
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height: '500px', borderRadius: '8px', overflow: 'hidden' }}
      />
    </div>
  );
};

export default PropertyMap;