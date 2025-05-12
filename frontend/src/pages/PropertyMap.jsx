import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, Loader2, MapPin } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

const PropertyMap = ({ 
  onPropertySelect, 
  onPropertySaved, 
  isOpen, 
  onClose, 
  initialState = null 
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [propertyMarkers, setPropertyMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchingLocation, setSearchingLocation] = useState(null);
  const [currentPopup, setCurrentPopup] = useState(null);
  
  // Get API key from localStorage or environment
  const attomApiKey = import.meta.env.VITE_ATTOM_API_KEY;

  useEffect(() => {
    if (!mapRef.current || !isOpen) return;

    // Initialize map
    const startLatLng = initialState ? 
      [initialState.latitude, initialState.longitude] : 
      [40.7128, -74.0060];
    const startZoom = initialState ? 16 : 12;
    
    mapInstance.current = L.map(mapRef.current).setView(startLatLng, startZoom);
    
    // Add standard map layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance.current);

    // If initial state exists, show the cached property
    if (initialState?.property) {
      const latitude = initialState.latitude || initialState.property.location?.latitude || 40.7128;
      const longitude = initialState.longitude || initialState.property.location?.longitude || -74.0060;
      console.log("Displaying cached property at:", latitude, longitude);
      displayCachedProperty(initialState.property, latitude, longitude);
    }

    // Handle map clicks
    mapInstance.current.on('click', handleMapClick);

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [isOpen, initialState]);

  const displayCachedProperty = (property, lat, lng) => {
    const marker = L.marker([lat, lng]).addTo(mapInstance.current);
    
    // Create popup content
    const popupContent = createPopupContent(property);
    const popup = marker.bindPopup(popupContent).openPopup();
    
    setPropertyMarkers([marker]);
    setCurrentPopup(popup);
    
    // Notify parent component
    if (onPropertySelect) {
      onPropertySelect(property);
    }
  };

  const handleMapClick = async (e) => {
    if (!attomApiKey) {
      setError('Please set your ATTOM API key in settings');
      return;
    }

    if (loading) return; // Prevent multiple clicks while loading

    setLoading(true);
    setError(null);
    setSearchingLocation({ lat: e.latlng.lat, lng: e.latlng.lng });

    try {
      // Clear existing markers and popups
      propertyMarkers.forEach(marker => {
        mapInstance.current.removeLayer(marker);
      });
      setPropertyMarkers([]);
      if (currentPopup) {
        mapInstance.current.closePopup(currentPopup);
      }

      // Add temporary marker with loading indicator
      const tempMarker = L.marker(e.latlng).addTo(mapInstance.current);
      tempMarker.bindPopup(`
        <div class="p-4 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p class="text-sm text-gray-600">Searching for property...</p>
        </div>
      `).openPopup();

      // Get address from coordinates
      const address = await getAddressFromCoordinates(e.latlng.lat, e.latlng.lng);
      
      if (!address) {
        // Remove temp marker
        mapInstance.current.removeLayer(tempMarker);
        
        // Show not found popup
        const notFoundMarker = L.marker(e.latlng).addTo(mapInstance.current);
        notFoundMarker.bindPopup(`
          <div class="p-4 text-center">
            <div class="text-red-500 mb-2">
              <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-900">No address found</p>
            <p class="text-xs text-gray-500 mt-1">Click on a different location to search for properties</p>
          </div>
        `).openPopup();
        
        setPropertyMarkers([notFoundMarker]);
        return;
      }

      // Get property details
      const propertyData = await getPropertyDetails(address);
      
      // Remove temp marker
      mapInstance.current.removeLayer(tempMarker);
      
      if (!propertyData) {
        // Show not found popup
        const notFoundMarker = L.marker(e.latlng).addTo(mapInstance.current);
        notFoundMarker.bindPopup(`
          <div class="p-4 text-center">
            <div class="text-yellow-500 mb-2">
              <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-900">No property data found</p>
            <p class="text-xs text-gray-500 mt-1">Address: ${address.fullAddress || 'Unknown'}</p>
            <p class="text-xs text-gray-500">Try searching in a different area</p>
          </div>
        `).openPopup();
        
        setPropertyMarkers([notFoundMarker]);
        return;
      }

      // Create marker with property data
      const marker = L.marker(e.latlng).addTo(mapInstance.current);
      
      // Create popup content
      const popupContent = createPopupContent(propertyData);
      const popup = marker.bindPopup(popupContent).openPopup();
      
      setPropertyMarkers([marker]);
      setCurrentPopup(popup);
      
      // Notify parent component
      if (onPropertySelect) {
        onPropertySelect(propertyData);
      }
    } catch (err) {
      console.error('Error fetching property data:', err);
      setError('Unable to fetch property information. Please try again.');
      
      // Clean up
      setPropertyMarkers([]);
      if (currentPopup) {
        mapInstance.current.closePopup(currentPopup);
      }
    } finally {
      setLoading(false);
      setSearchingLocation(null);
    }
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      
      if (data && data.address && data.address.house_number) {
        let address1 = '';
        if (data.address.house_number) {
          address1 += data.address.house_number + ' ';
        }
        if (data.address.road) {
          address1 += data.address.road;
        }
        
        let address2 = '';
        if (data.address.city || data.address.town || data.address.village) {
          address2 += (data.address.city || data.address.town || data.address.village) + ', ';
        }
        if (data.address.state) {
          address2 += data.address.state;
        }
        if (data.address.postcode) {
          address2 += ' ' + data.address.postcode;
        }
        
        return {
          address1: address1.trim(),
          address2: address2.trim(),
          fullAddress: data.display_name,
          postalCode: data.address.postcode || ''
        };
      }
      return null;
    } catch (error) {
      console.error('Error during reverse geocoding:', error);
      return null;
    }
  };

  const getPropertyDetails = async (address) => {
    try {
      const detailUrl = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=${encodeURIComponent(address.address1)}&address2=${encodeURIComponent(address.address2)}`;
      
      const response = await fetch(detailUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'apikey': attomApiKey
        }
      });
      
      const data = await response.json();
      
      if (data?.status?.code === 0 && data?.property?.[0]) {
        const propertyData = data.property[0];
        
        // Enrich with additional data if needed
        if (propertyData.identifier?.attomId) {
          const [ownerData, eventsData] = await Promise.all([
            getOwnerDetails(propertyData.identifier.attomId),
            getPropertyEvents(propertyData.identifier.attomId)
          ]);
          
          return {
            ...propertyData,
            owner: ownerData?.property?.[0]?.owner,
            events: eventsData?.property?.[0],
            fullAddress: address.fullAddress
          };
        }
        
        return { ...propertyData, fullAddress: address.fullAddress };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching property details:', error);
      throw error;
    }
  };

  const getOwnerDetails = async (attomId) => {
    try {
      const response = await fetch(
        `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detailowner?id=${attomId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'apikey': attomApiKey
          }
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching owner details:', error);
      return null;
    }
  };

  const getPropertyEvents = async (attomId) => {
    try {
      const response = await fetch(
        `https://api.gateway.attomdata.com/propertyapi/v1.0.0/allevents/detail?id=${attomId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'apikey': attomApiKey
          }
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching property events:', error);
      return null;
    }
  };

  const createPopupContent = (property) => {
    const formatCurrency = (value) => {
      if (!value || value === 0) return null;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(value);
    };

    // Get the best available value from different paths
    const getPropertyValue = (path) => {
      // Check events path first
      const eventsPath = path.split('.').reduce((obj, key) => obj?.events?.[key], property);
      if (eventsPath !== undefined && eventsPath !== null) return eventsPath;
      
      // Check direct path
      const directPath = path.split('.').reduce((obj, key) => obj?.[key], property);
      return directPath;
    };

    // Get assessment and market values
    const assessment = getPropertyValue('assessment') || {};
    const marketValue = 
      assessment.market?.mktttlvalue ||
      assessment.calculations?.calcttlvalue ||
      assessment.assessed?.assdttlvalue ||
      property.sale?.amount?.saleamt ||
      null;

    let content = `<div class="property-popup min-w-[280px] max-w-sm">`;
    
    // Address
    content += `<h3 class="text-lg font-semibold text-gray-900 mb-3 pr-8">${property.fullAddress || getPropertyAddress(property)}</h3>`;
    
    // Property Type
    if (property.summary?.propclass || property.summary?.proptype) {
      content += `<div class="flex items-center text-sm text-gray-600 mb-2">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        ${property.summary.propclass || property.summary.proptype}
      </div>`;
    }
    
    // Market Value (only if available)
    if (marketValue) {
      const formattedValue = formatCurrency(marketValue);
      if (formattedValue) {
        content += `<div class="flex items-center text-sm text-gray-900 mb-2 font-medium">
          <svg class="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m-3-14h6m-3 3c1.11 0 2.08.402 2.599 1M9 3h6"></path>
          </svg>
          Value: ${formattedValue}
        </div>`;
      }
    }
    
    // Building Size
    if (property.building?.size?.universalsize) {
      content += `<div class="flex items-center text-sm text-gray-600 mb-2">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5m-4 2v8m0 0H8m3 0h2"></path>
        </svg>
        ${property.building.size.universalsize.toLocaleString()} sq ft
      </div>`;
    }
    
    // Bedrooms/Bathrooms
    if (property.building?.rooms) {
      let rooms = [];
      if (property.building.rooms.beds) rooms.push(`${property.building.rooms.beds} beds`);
      if (property.building.rooms.bathstotal) rooms.push(`${property.building.rooms.bathstotal} baths`);
      if (rooms.length > 0) {
        content += `<div class="flex items-center text-sm text-gray-600 mb-2">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          ${rooms.join(', ')}
        </div>`;
      }
    }
    
    // Owner
    if (property.owner?.owner1?.fullname) {
      content += `<div class="flex items-center text-sm text-gray-600 mb-4">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        Owner: ${property.owner.owner1.fullname}
      </div>`;
    }
    
    // Cached indicator (if this is from cached data)
    if (initialState?.property) {
      content += `<div class="flex items-center text-xs text-blue-600 mb-2">
        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l14 9-14 9V3z"></path>
        </svg>
        From recent search
      </div>`;
    }
    
    // Action buttons
    content += `<div class="flex gap-2 pt-3 border-t border-gray-200">
      <button id="view-details-btn" class="flex-1 bg-blue-600 text-white text-sm py-2 px-4 rounded hover:bg-blue-700 transition-colors flex items-center justify-center">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>
        View Details
      </button>
      <button id="save-property-btn" class="flex-1 bg-green-600 text-white text-sm py-2 px-4 rounded hover:bg-green-700 transition-colors flex items-center justify-center">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
        </svg>
        Save Property
      </button>
    </div>`;
    
    content += `</div>`;
    
    // Add event listeners after popup is created
    setTimeout(() => {
      const viewDetailsBtn = document.getElementById('view-details-btn');
      const savePropertyBtn = document.getElementById('save-property-btn');
      
      if (viewDetailsBtn) {
        viewDetailsBtn.onclick = (e) => {
          e.stopPropagation();
          if (onPropertySelect) {
            onPropertySelect(property);
          }
        };
      }
      
      if (savePropertyBtn) {
        savePropertyBtn.onclick = async (e) => {
          e.stopPropagation();
          
          // Change button to loading state
          savePropertyBtn.innerHTML = `
            <svg class="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          `;
          
          try {
            if (onPropertySaved) {
              await onPropertySaved(property);
              
              // Change to success state
              savePropertyBtn.innerHTML = `
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Saved!
              `;
              savePropertyBtn.className = 'flex-1 bg-gray-400 text-white text-sm py-2 px-4 rounded flex items-center justify-center cursor-default';
              savePropertyBtn.disabled = true;
            }
          } catch (error) {
            // Reset button on error
            savePropertyBtn.innerHTML = `
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
              Save Property
            `;
            console.error('Error saving property:', error);
          }
        };
      }
    }, 100);
    
    return content;
  };

  const getPropertyAddress = (property) => {
    if (property.address?.oneLine) return property.address.oneLine;
    
    let address = '';
    if (property.address?.line1) address += property.address.line1;
    
    const parts = [];
    if (property.address?.city) parts.push(property.address.city);
    if (property.address?.state) parts.push(property.address.state);
    if (property.address?.postal1) parts.push(property.address.postal1);
    
    if (parts.length > 0) {
      address += (address ? ', ' : '') + parts.join(', ');
    }
    
    return address || 'Address Unknown';
  };

  if (!isOpen) return null;

  return (
    <div className="relative h-full">
      {/* Loading overlay */}
      {loading && searchingLocation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-700">Searching for property...</span>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-md flex flex-col gap-2 p-2">
        <button 
          onClick={() => mapInstance.current?.setView([40.7128, -74.0060], 12)}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Reset view"
        >
          <MapPin className="h-4 w-4 text-gray-600" />
        </button>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-red-50 text-red-600 rounded transition-colors"
          title="Close map"
        >
          ×
        </button>
      </div>
      
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full bg-gray-100 rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      {/* Help text */}
      <div className="absolute bottom-4 left-4 z-10 bg-white bg-opacity-90 text-sm text-gray-600 px-3 py-1 rounded">
        {initialState?.property ? 'Showing property from recent search' : 'Click anywhere on the map to search for properties'}
      </div>
    </div>
  );
};

export default PropertyMap;