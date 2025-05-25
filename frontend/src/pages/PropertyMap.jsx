import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { saveUserSearch } from '../services/api';

const PropertyMap = ({ 
  onPropertySelect, 
  onPropertySaved, 
  isOpen, 
  onClose, 
  initialState = null,
  hideCloseButton = false
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [searchMarkers, setSearchMarkers] = useState([]);
  const [clickMarker, setClickMarker] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [clickResult, setClickResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState('zipcode');
  const [activeTab, setActiveTab] = useState('search-results');
  const [zipcode, setZipcode] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  
  const attomApiKey = import.meta.env.VITE_ATTOM_API_KEY;

  useEffect(() => {
    if (!mapRef.current || !isOpen) return;

    const initTimer = setTimeout(() => {
      try {
        const startLatLng = initialState ? 
          [initialState.latitude, initialState.longitude] : 
          [40.7128, -74.0060];
        const startZoom = initialState ? 16 : 4;
        
        mapInstance.current = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
          preferCanvas: true
        }).setView(startLatLng, startZoom);
        
        L.control.zoom({ position: 'topright' }).addTo(mapInstance.current);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(mapInstance.current);

        if (initialState?.property) {
          const latitude = initialState.latitude || initialState.property.location?.latitude || 40.7128;
          const longitude = initialState.longitude || initialState.property.location?.longitude || -74.0060;
          displayCachedProperty(initialState.property, latitude, longitude);
        }

        mapInstance.current.on('click', handleMapClick);

        setTimeout(() => {
          if (mapInstance.current) {
            mapInstance.current.invalidateSize();
          }
        }, 250);

      } catch (error) {
        console.error('Map initialization error:', error);
        setError('Failed to initialize map');
      }
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [isOpen, initialState]);

  useEffect(() => {
    if (isOpen && mapInstance.current) {
      setTimeout(() => {
        mapInstance.current.invalidateSize();
      }, 300);
    }
  }, [isOpen]);

  const displayCachedProperty = (property, lat, lng) => {
    const marker = L.marker([lat, lng]).addTo(mapInstance.current);
    const popupContent = createPopupContent(property);
    marker.bindPopup(popupContent).openPopup();
    setSearchMarkers([marker]);
    
    if (onPropertySelect) {
      onPropertySelect(property);
    }
  };

  const handleZipcodeSearch = async () => {
    if (!attomApiKey || !zipcode.trim()) {
      setError(!zipcode.trim() ? 'Enter a zip code' : 'API key required');
      return;
    }

    setLoading(true);
    setActiveTab('search-results');
    setError(null);

    try {
      const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/address?postalcode=${zipcode}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'apikey': attomApiKey
        }
      });

      const data = await response.json();

      if (data.status && data.status.code === 0 && data.property && data.property.length > 0) {
        displaySearchResults(data.property, 'zipcode');
        
        try {
          await saveUserSearch({
            query: `Zip code: ${zipcode}`,
            searchType: 'zipcode_search',
            results: {
              count: data.property.length,
              properties: data.property.slice(0, 5)
            }
          });
        } catch (saveError) {
          console.warn('Failed to save search history:', saveError);
        }
      } else {
        setSearchResults([]);
        setError('No properties found for this zip code');
      }
    } catch (error) {
      console.error('Zipcode search error:', error);
      setSearchResults([]);
      setError('Error searching properties');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSearch = async () => {
    if (!attomApiKey || !address1.trim() || !address2.trim()) {
      setError('Enter both address fields');
      return;
    }

    setLoading(true);
    setActiveTab('search-results');
    setError(null);

    try {
      const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=${encodeURIComponent(address1)}&address2=${encodeURIComponent(address2)}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'apikey': attomApiKey
        }
      });

      const data = await response.json();

      if (data.status && data.status.code === 0 && data.property && data.property.length > 0) {
        displaySearchResults(data.property, 'address');
        
        try {
          await saveUserSearch({
            query: `Address: ${address1}, ${address2}`,
            searchType: 'address_search',
            results: {
              count: data.property.length,
              properties: data.property
            }
          });
        } catch (saveError) {
          console.warn('Failed to save search history:', saveError);
        }
      } else {
        setSearchResults([]);
        setError('No property found for this address');
      }
    } catch (error) {
      console.error('Address search error:', error);
      setSearchResults([]);
      setError('Error searching property');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = async (e) => {
    if (!attomApiKey) {
      setError('API key required');
      return;
    }

    setLoading(true);
    setActiveTab('click-result');
    setError(null);

    if (clickMarker) {
      mapInstance.current.removeLayer(clickMarker);
    }

    const tempMarkerIcon = L.divIcon({
      className: 'leaflet-div-icon',
      html: '<div class="w-6 h-6 bg-orange-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">?</div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const tempMarker = L.marker(e.latlng, { icon: tempMarkerIcon }).addTo(mapInstance.current);
    setClickMarker(tempMarker);

    try {
      const address = await getAddressFromCoordinates(e.latlng.lat, e.latlng.lng);
      
      if (!address) {
        setClickResult({ error: 'Unable to find address at this location' });
        return;
      }

      await getPropertyFromClick(address, tempMarker);

    } catch (error) {
      console.error('Map click error:', error);
      setClickResult({ error: 'Error getting property information' });
    } finally {
      setLoading(false);
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
          fullAddress: data.display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  const getPropertyFromClick = async (address, marker) => {
    try {
      let url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=${encodeURIComponent(address.address1)}&address2=${encodeURIComponent(address.address2)}`;
      let response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'apikey': attomApiKey
        }
      });

      let data = await response.json();

      if (data.status && data.status.code === 0 && data.property && data.property.length > 0) {
        const property = { ...data.property[0], fullAddress: address.fullAddress };
        setClickResult(property);
        
        const markerIcon = L.divIcon({
          className: 'leaflet-div-icon',
          html: '<div class="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs">🏠</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        marker.setIcon(markerIcon);

        try {
          await saveUserSearch({
            query: `Property at ${address.fullAddress}`,
            searchType: 'map_click',
            propertyId: property.identifier?.attomId || property.identifier?.Id || null,
            results: {
              count: 1,
              properties: [property]
            }
          });
        } catch (saveError) {
          console.warn('Failed to save search history:', saveError);
        }
      } else {
        setClickResult({ error: 'No property information found for this location' });
      }
    } catch (error) {
      console.error('Error getting property from click:', error);
      setClickResult({ error: 'Error retrieving property information' });
    }
  };

  const displaySearchResults = (properties) => {
    clearSearchMarkers();
    setSearchResults(properties);

    const bounds = L.latLngBounds();
    const markers = [];

    properties.forEach((property, index) => {
      if (property.location && property.location.latitude && property.location.longitude) {
        const lat = parseFloat(property.location.latitude);
        const lng = parseFloat(property.location.longitude);

        const markerIcon = L.divIcon({
          className: 'leaflet-div-icon',
          html: `<div class="w-7 h-7 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">${index + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(mapInstance.current);
        marker.property = property;
        marker.index = index;
        
        markers.push(marker);
        bounds.extend([lat, lng]);

        marker.on('click', () => {
          selectProperty(property, marker, index);
        });
      }
    });

    setSearchMarkers(markers);

    if (markers.length > 0) {
      setTimeout(() => {
        mapInstance.current.fitBounds(bounds, { padding: [20, 20] });
      }, 100);
    }
  };

  const selectProperty = async (property, marker, index) => {
    setSelectedProperty(property);
  
    searchMarkers.forEach((m, i) => {
      const icon = L.divIcon({
        className: 'leaflet-div-icon',
        html: `<div class="w-7 h-7 ${i === index ? 'bg-green-600' : 'bg-blue-600'} rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">${i + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      m.setIcon(icon);
    });
  
    if (marker) {
      mapInstance.current.setView(marker.getLatLng(), 17);
    }
  
    const needsDetailedInfo = !property.building || !property.lot || 
                             !property.building?.size || !property.lot?.lotsize2;
  
    let detailedProperty = property;
    
    if (needsDetailedInfo && property.identifier?.attomId) {
      try {
        setLoading(true);
        
        const detailUrl = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?id=${property.identifier.attomId}`;
        const detailResponse = await fetch(detailUrl, {
          headers: {
            'Accept': 'application/json',
            'apikey': attomApiKey
          }
        });
  
        const detailData = await detailResponse.json();
        
        if (detailData.status && detailData.status.code === 0 && detailData.property && detailData.property.length > 0) {
          const detailedPropertyData = detailData.property[0];
          
          const [ownerData, eventsData] = await Promise.all([
            getPropertyOwner(property.identifier.attomId),
            getPropertyEvents(property.identifier.attomId)
          ]);
          
          detailedProperty = {
            ...property,
            ...detailedPropertyData,
            owner: ownerData?.property?.[0]?.owner || detailedPropertyData.owner || property.owner,
            events: eventsData?.property?.[0] || detailedPropertyData.events || property.events,
            address: property.address || detailedPropertyData.address,
            fullAddress: property.fullAddress || detailedPropertyData.fullAddress || property.address?.oneLine
          };
        } else {
          const [ownerData, eventsData] = await Promise.all([
            getPropertyOwner(property.identifier.attomId),
            getPropertyEvents(property.identifier.attomId)
          ]);
          
          detailedProperty = {
            ...property,
            owner: ownerData?.property?.[0]?.owner || property.owner,
            events: eventsData?.property?.[0] || property.events
          };
        }
        
        setSelectedProperty(detailedProperty);
      } catch (error) {
        console.error('Error getting detailed property info:', error);
      } finally {
        setLoading(false);
      }
    }
  
    if (onPropertySelect) {
      onPropertySelect(detailedProperty);
    }
  };

  const getPropertyOwner = async (attomId) => {
    try {
      const response = await fetch(
        `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detailowner?id=${attomId}`,
        {
          headers: {
            'Accept': 'application/json',
            'apikey': attomApiKey
          }
        }
      );
      const data = await response.json();
      return data.status && data.status.code === 0 ? data : null;
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
          headers: {
            'Accept': 'application/json',
            'apikey': attomApiKey
          }
        }
      );
      const data = await response.json();
      return data.status && data.status.code === 0 ? data : null;
    } catch (error) {
      console.error('Error fetching property events:', error);
      return null;
    }
  };

  const clearSearchMarkers = () => {
    searchMarkers.forEach(marker => mapInstance.current.removeLayer(marker));
    setSearchMarkers([]);
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

    const getPropertyValue = (path) => {
      const eventsPath = path.split('.').reduce((obj, key) => obj?.events?.[key], property);
      if (eventsPath !== undefined && eventsPath !== null) return eventsPath;
      
      const directPath = path.split('.').reduce((obj, key) => obj?.[key], property);
      return directPath;
    };

    const assessment = getPropertyValue('assessment') || {};
    const marketValue = 
      assessment.market?.mktttlvalue ||
      assessment.calculations?.calcttlvalue ||
      assessment.assessed?.assdttlvalue ||
      property.sale?.amount?.saleamt ||
      null;

    let content = `<div class="font-sans min-w-72 max-w-80">`;
    
    content += `<h3 class="text-base font-semibold text-gray-900 mb-3 pr-8">${property.fullAddress || getPropertyAddress(property)}</h3>`;
    
    if (property.summary?.propclass || property.summary?.proptype) {
      content += `<div class="flex items-center text-sm text-gray-600 mb-2">
        <span class="mr-2">🏢</span>
        ${property.summary.propclass || property.summary.proptype}
      </div>`;
    }
    
    if (marketValue) {
      const formattedValue = formatCurrency(marketValue);
      if (formattedValue) {
        content += `<div class="flex items-center text-sm text-gray-800 mb-2 font-medium">
          <span class="mr-2 text-green-600">💰</span>
          Value: ${formattedValue}
        </div>`;
      }
    }
    
    if (property.building?.size?.universalsize) {
      content += `<div class="flex items-center text-sm text-gray-600 mb-2">
        <span class="mr-2">📐</span>
        ${property.building.size.universalsize.toLocaleString()} sq ft
      </div>`;
    }
    
    if (property.building?.rooms) {
      let rooms = [];
      if (property.building.rooms.beds) rooms.push(`${property.building.rooms.beds} beds`);
      if (property.building.rooms.bathstotal) rooms.push(`${property.building.rooms.bathstotal} baths`);
      if (rooms.length > 0) {
        content += `<div class="flex items-center text-sm text-gray-600 mb-2">
          <span class="mr-2">🛏️</span>
          ${rooms.join(', ')}
        </div>`;
      }
    }
    
    if (property.owner?.owner1?.fullname) {
      content += `<div class="flex items-center text-sm text-gray-600 mb-4">
        <span class="mr-2">👤</span>
        Owner: ${property.owner.owner1.fullname}
      </div>`;
    }
    
    content += `<div class="flex gap-2 pt-3 border-t border-gray-200">
      <button id="view-details-btn" class="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded-md font-medium hover:bg-blue-700 transition-colors">
        👁️ View Details
      </button>
      <button id="save-property-btn" class="flex-1 bg-green-600 text-white text-xs py-2 px-3 rounded-md font-medium hover:bg-green-700 transition-colors">
        💾 Save Property
      </button>
    </div>`;
    
    content += `</div>`;
    
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
          
          savePropertyBtn.innerHTML = `<span class="flex items-center justify-center">⏳ Saving...</span>`;
          savePropertyBtn.style.backgroundColor = '#6b7280';
          
          try {
            if (onPropertySaved) {
              await onPropertySaved(property);
              
              savePropertyBtn.innerHTML = `✅ Saved!`;
              savePropertyBtn.style.backgroundColor = '#6b7280';
              savePropertyBtn.style.cursor = 'default';
              savePropertyBtn.disabled = true;
            }
          } catch (error) {
            savePropertyBtn.innerHTML = `💾 Save Property`;
            savePropertyBtn.style.backgroundColor = '#059669';
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
    <div className="h-full flex bg-white">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2 text-blue-600" />
            Property Search
          </h3>
          
          <div className="flex mb-4 bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setSearchType('zipcode')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                searchType === 'zipcode' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Zip Code
            </button>
            <button
              onClick={() => setSearchType('address')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                searchType === 'address' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Address
            </button>
          </div>

          {searchType === 'zipcode' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Code:
                </label>
                <input
                  type="text"
                  id="zipcode"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleZipcodeSearch()}
                  placeholder="e.g., 10019"
                  maxLength="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleZipcodeSearch}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {loading ? 'Searching...' : 'Search Properties'}
              </button>
            </div>
          )}

          {searchType === 'address' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address:
                </label>
                <input
                  type="text"
                  id="address1"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                  placeholder="e.g., 123 Main St"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-1">
                  City, State:
                </label>
                <input
                  type="text"
                  id="address2"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                  placeholder="e.g., New York, NY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleAddressSearch}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {loading ? 'Searching...' : 'Search Property'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-gray-200 bg-white">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('search-results')}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === 'search-results'
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Search Results ({searchResults.length})
              </button>
              <button
                onClick={() => setActiveTab('click-result')}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === 'click-result'
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Map Click {clickResult && !clickResult.error ? '(1)' : ''}
              </button>
            </nav>
          </div>

          {activeTab === 'search-results' && (
            <div className="p-4">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((property, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        const marker = searchMarkers.find(m => m.property === property);
                        selectProperty(property, marker, index);
                      }}
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedProperty === property 
                          ? 'bg-green-50 border-green-300 shadow-md' 
                          : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                       <div className="flex-1">
                         <div className="font-medium text-gray-900 text-sm mb-1 flex items-center">
                           <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white mr-2 ${
                             selectedProperty === property ? 'bg-green-500' : 'bg-blue-500'
                           }`}>
                             {index + 1}
                           </span>
                           {getPropertyAddress(property)}
                         </div>
                         <div className="text-xs text-gray-600 space-y-1">
                           <div className="flex items-center">
                             <span className="font-medium mr-1">Type:</span>
                             {property.summary?.propclass || property.summary?.proptype || 'Property'}
                           </div>
                           {property.building?.size?.universalsize && (
                             <div className="flex items-center">
                               <span className="font-medium mr-1">Size:</span>
                               {property.building.size.universalsize.toLocaleString()} sq ft
                             </div>
                           )}
                           {property.building?.rooms?.beds && (
                             <div className="flex items-center">
                               <span className="font-medium mr-1">Beds:</span>
                               {property.building.rooms.beds}
                               {property.building.rooms.bathstotal && (
                                 <span className="ml-2">
                                   <span className="font-medium">Baths:</span> {property.building.rooms.bathstotal}
                                 </span>
                               )}
                             </div>
                           )}
                         </div>
                       </div>
                       {selectedProperty === property && (
                         <div className="ml-2 text-green-500">
                           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                           </svg>
                         </div>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-12 text-gray-500">
                 <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                 <p className="text-sm font-medium">No search results yet</p>
                 <p className="text-xs mt-1">Search by zip code or address to find properties</p>
               </div>
             )}
           </div>
         )}

         {activeTab === 'click-result' && (
           <div className="p-4">
             {clickResult ? (
               clickResult.error ? (
                 <div className="text-center py-12">
                   <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
                     <X className="w-6 h-6 text-red-500" />
                   </div>
                   <p className="text-sm font-medium text-red-600">{clickResult.error}</p>
                   <p className="text-xs text-gray-500 mt-1">Try clicking on a different location</p>
                 </div>
               ) : (
                 <div
                   onClick={() => {
                     setSelectedProperty(clickResult);
                     if (onPropertySelect) {
                       onPropertySelect(clickResult);
                     }
                   }}
                   className="p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                 >
                   <div className="flex items-start justify-between">
                     <div className="flex-1">
                       <div className="font-medium text-gray-900 text-sm mb-1 flex items-center">
                         <span className="text-red-500 mr-2">📍</span>
                         {clickResult.fullAddress || getPropertyAddress(clickResult)}
                       </div>
                       <div className="text-xs text-gray-600">
                         <div className="flex items-center">
                           <span className="font-medium mr-1">From map click</span>
                           <span className="text-blue-600">→ Click to view details</span>
                         </div>
                         {clickResult.summary?.propclass && (
                           <div className="mt-1">
                             <span className="font-medium mr-1">Type:</span>
                             {clickResult.summary.propclass}
                           </div>
                         )}
                       </div>
                     </div>
                     <div className="ml-2 text-blue-500">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                       </svg>
                     </div>
                   </div>
                 </div>
               )
             ) : (
               <div className="text-center py-12 text-gray-500">
                 <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                 <p className="text-sm font-medium">No map click yet</p>
                 <p className="text-xs mt-1">Click anywhere on the map to explore properties</p>
               </div>
             )}
           </div>
         )}
       </div>
     </div>

     <div className="flex-1 relative bg-gray-100">
       {loading && (
         <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
           <div className="flex items-center space-x-2">
             <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
             <span className="text-sm text-gray-700">
               {activeTab === 'search-results' ? 'Searching for properties...' : 'Getting property information...'}
             </span>
           </div>
         </div>
       )}
       
       {!hideCloseButton && (
         <div className="absolute top-4 right-4 z-10">
           <button 
             onClick={onClose}
             className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
             title="Close map"
           >
             <X className="h-5 w-5" />
           </button>
         </div>
       )}
       
       <div 
         ref={mapRef} 
         className="w-full h-full"
         style={{ minHeight: '400px' }}
       />
       
       <div className="absolute bottom-4 left-4 z-10 bg-white/95 text-sm text-gray-600 px-3 py-2 rounded-lg shadow-md max-w-xs">
         <div className="flex items-center">
           <span className="mr-2">💡</span>
           <span>
             {initialState?.property ? 
               'Showing property from recent search' : 
               hideCloseButton ? 
                 'Search properties using the sidebar or click anywhere on the map' :
                 'Search properties using the sidebar or click anywhere on the map'
             }
           </span>
         </div>
       </div>
     </div>
   </div>
 );
};

export default PropertyMap;

// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
// import { AlertCircle, Loader2, MapPin, Search, X } from 'lucide-react';
// import React, { useEffect, useRef, useState } from 'react';
// import { saveUserSearch } from '../services/api';

// const PropertyMap = ({ 
//   onPropertySelect, 
//   onPropertySaved, 
//   isOpen, 
//   onClose, 
//   initialState = null,
//   hideCloseButton = false
// }) => {
//   const mapRef = useRef(null);
//   const mapInstance = useRef(null);
  
//   // State management
//   const [searchMarkers, setSearchMarkers] = useState([]);
//   const [clickMarker, setClickMarker] = useState(null);
//   const [selectedProperty, setSelectedProperty] = useState(null);
//   const [searchResults, setSearchResults] = useState([]);
//   const [clickResult, setClickResult] = useState(null);
  
//   // UI State
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [searchType, setSearchType] = useState('zipcode');
//   const [activeTab, setActiveTab] = useState('search-results');
  
//   // Search inputs
//   const [zipcode, setZipcode] = useState('');
//   const [address1, setAddress1] = useState('');
//   const [address2, setAddress2] = useState('');
  
//   // Configuration from environment
//   const attomApiKey = import.meta.env.VITE_ATTOM_API_KEY;

//   useEffect(() => {
//     if (!mapRef.current || !isOpen) return;

//     // Small delay to ensure container is ready
//     const initTimer = setTimeout(() => {
//       try {
//         // Initialize map
//         const startLatLng = initialState ? 
//           [initialState.latitude, initialState.longitude] : 
//           [40.7128, -74.0060];
//         const startZoom = initialState ? 16 : 4;
        
//         mapInstance.current = L.map(mapRef.current, {
//           zoomControl: false, // We'll add custom controls
//           attributionControl: true
//         }).setView(startLatLng, startZoom);
        
//         // Add zoom control to top right
//         L.control.zoom({
//           position: 'topright'
//         }).addTo(mapInstance.current);
        
//         // Add standard map layer
//         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//           attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         }).addTo(mapInstance.current);

//         // If initial state exists, show the cached property
//         if (initialState?.property) {
//           const latitude = initialState.latitude || initialState.property.location?.latitude || 40.7128;
//           const longitude = initialState.longitude || initialState.property.location?.longitude || -74.0060;
//           console.log("Displaying cached property at:", latitude, longitude);
//           displayCachedProperty(initialState.property, latitude, longitude);
//         }

//         // Handle map clicks
//         mapInstance.current.on('click', handleMapClick);

//         // Invalidate size to fix rendering issues
//         setTimeout(() => {
//           if (mapInstance.current) {
//             mapInstance.current.invalidateSize();
//           }
//         }, 250);

//       } catch (error) {
//         console.error('Error initializing map:', error);
//         setError('Failed to initialize map');
//       }
//     }, 100);

//     // Cleanup
//     return () => {
//       clearTimeout(initTimer);
//       if (mapInstance.current) {
//         mapInstance.current.remove();
//         mapInstance.current = null;
//       }
//     };
//   }, [isOpen, initialState]);

//   // Fix map size when modal opens/closes
//   useEffect(() => {
//     if (isOpen && mapInstance.current) {
//       setTimeout(() => {
//         mapInstance.current.invalidateSize();
//       }, 300);
//     }
//   }, [isOpen]);

//   const displayCachedProperty = (property, lat, lng) => {
//     const marker = L.marker([lat, lng]).addTo(mapInstance.current);
    
//     // Create popup content
//     const popupContent = createPopupContent(property);
//     const popup = marker.bindPopup(popupContent).openPopup();
    
//     setSearchMarkers([marker]);
    
//     // Notify parent component
//     if (onPropertySelect) {
//       onPropertySelect(property);
//     }
//   };

//   // Search by zipcode
//   const handleZipcodeSearch = async () => {
//     if (!attomApiKey) {
//       setError('Please set your ATTOM API key in environment variables');
//       return;
//     }

//     if (!zipcode.trim()) {
//       setError('Please enter a zip code');
//       return;
//     }

//     setLoading(true);
//     setActiveTab('search-results');
//     setError(null);

//     try {
//       const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/address?postalcode=${zipcode}`;
//       const response = await fetch(url, {
//         headers: {
//           'Accept': 'application/json',
//           'apikey': attomApiKey
//         }
//       });

//       const data = await response.json();

//       if (data.status && data.status.code === 0 && data.property && data.property.length > 0) {
//         displaySearchResults(data.property, 'zipcode');
        
//         // Try to save search, but don't fail if it doesn't work
//         try {
//           await saveUserSearch({
//             query: `Zip code: ${zipcode}`,
//             searchType: 'zipcode_search',
//             results: {
//               count: data.property.length,
//               properties: data.property.slice(0, 5) // Save first 5 for preview
//             }
//           });
//         } catch (saveError) {
//           console.warn('Failed to save search history:', saveError);
//           // Continue without showing error to user
//         }
//       } else {
//         setSearchResults([]);
//         setError('No properties found for this zip code');
//       }
//     } catch (error) {
//       console.error('Zipcode search error:', error);
//       setSearchResults([]);
//       setError('Error searching properties');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Search by address
//   const handleAddressSearch = async () => {
//     if (!attomApiKey) {
//       setError('Please set your ATTOM API key in environment variables');
//       return;
//     }

//     if (!address1.trim() || !address2.trim()) {
//       setError('Please enter both address fields');
//       return;
//     }

//     setLoading(true);
//     setActiveTab('search-results');
//     setError(null);

//     try {
//       const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=${encodeURIComponent(address1)}&address2=${encodeURIComponent(address2)}`;
//       const response = await fetch(url, {
//         headers: {
//           'Accept': 'application/json',
//           'apikey': attomApiKey
//         }
//       });

//       const data = await response.json();

//       if (data.status && data.status.code === 0 && data.property && data.property.length > 0) {
//         displaySearchResults(data.property, 'address');
        
//         // Try to save search, but don't fail if it doesn't work
//         try {
//           await saveUserSearch({
//             query: `Address: ${address1}, ${address2}`,
//             searchType: 'address_search',
//             results: {
//               count: data.property.length,
//               properties: data.property
//             }
//           });
//         } catch (saveError) {
//           console.warn('Failed to save search history:', saveError);
//           // Continue without showing error to user
//         }
//       } else {
//         setSearchResults([]);
//         setError('No property found for this address');
//       }
//     } catch (error) {
//       console.error('Address search error:', error);
//       setSearchResults([]);
//       setError('Error searching property');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle map click
//   const handleMapClick = async (e) => {
//     if (!attomApiKey) {
//       setError('Please set your ATTOM API key in environment variables');
//       return;
//     }

//     setLoading(true);
//     setActiveTab('click-result');
//     setError(null);

//     // Clear existing click marker
//     if (clickMarker) {
//       mapInstance.current.removeLayer(clickMarker);
//     }

//     // Add temporary marker
//     const tempMarkerIcon = L.divIcon({
//       className: 'leaflet-div-icon',
//       html: '<div style="background: #f39c12; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; cursor: pointer;">?</div>',
//       iconSize: [30, 30],
//       iconAnchor: [15, 15]
//     });

//     const tempMarker = L.marker(e.latlng, { icon: tempMarkerIcon }).addTo(mapInstance.current);
//     setClickMarker(tempMarker);

//     try {
//       // Get address from coordinates
//       const address = await getAddressFromCoordinates(e.latlng.lat, e.latlng.lng);
      
//       if (!address) {
//         setClickResult({ error: 'Unable to find address at this location' });
//         return;
//       }

//       // Get property information
//       await getPropertyFromClick(address, tempMarker);

//     } catch (error) {
//       console.error('Map click error:', error);
//       setClickResult({ error: 'Error getting property information' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Get address from coordinates
//   const getAddressFromCoordinates = async (lat, lng) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
//       );
//       const data = await response.json();

//       if (data && data.address && data.address.house_number) {
//         let address1 = '';
//         if (data.address.house_number) {
//           address1 += data.address.house_number + ' ';
//         }
//         if (data.address.road) {
//           address1 += data.address.road;
//         }

//         let address2 = '';
//         if (data.address.city || data.address.town || data.address.village) {
//           address2 += (data.address.city || data.address.town || data.address.village) + ', ';
//         }
//         if (data.address.state) {
//           address2 += data.address.state;
//         }
//         if (data.address.postcode) {
//           address2 += ' ' + data.address.postcode;
//         }

//         return {
//           address1: address1.trim(),
//           address2: address2.trim(),
//           fullAddress: data.display_name
//         };
//       }
//       return null;
//     } catch (error) {
//       console.error('Reverse geocoding error:', error);
//       return null;
//     }
//   };

//   // Get property from click
//   const getPropertyFromClick = async (address, marker) => {
//     try {
//       // Try detail endpoint first
//       let url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=${encodeURIComponent(address.address1)}&address2=${encodeURIComponent(address.address2)}`;
//       let response = await fetch(url, {
//         headers: {
//           'Accept': 'application/json',
//           'apikey': attomApiKey
//         }
//       });

//       let data = await response.json();

//       if (data.status && data.status.code === 0 && data.property && data.property.length > 0) {
//         const property = { ...data.property[0], fullAddress: address.fullAddress };
//         setClickResult(property);
        
//         // Update marker icon
//         const markerIcon = L.divIcon({
//           className: 'leaflet-div-icon',
//           html: '<div style="background: #e74c3c; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; cursor: pointer;">🏠</div>',
//           iconSize: [30, 30],
//           iconAnchor: [15, 15]
//         });
//         marker.setIcon(markerIcon);

//         // Try to save search, but don't fail if it doesn't work
//         try {
//           await saveUserSearch({
//             query: `Property at ${address.fullAddress}`,
//             searchType: 'map_click',
//             propertyId: property.identifier?.attomId || property.identifier?.Id || null,
//             results: {
//               count: 1,
//               properties: [property]
//             }
//           });
//         } catch (saveError) {
//           console.warn('Failed to save search history:', saveError);
//           // Continue without showing error to user
//         }
//       } else {
//         setClickResult({ error: 'No property information found for this location' });
//       }
//     } catch (error) {
//       console.error('Error getting property from click:', error);
//       setClickResult({ error: 'Error retrieving property information' });
//     }
//   };

//   // Display search results
//   const displaySearchResults = (properties) => {
//     clearSearchMarkers();
//     setSearchResults(properties);

//     const bounds = L.latLngBounds();
//     const markers = [];

//     properties.forEach((property, index) => {
//       // Add marker to map if coordinates are available
//       if (property.location && property.location.latitude && property.location.longitude) {
//         const lat = parseFloat(property.location.latitude);
//         const lng = parseFloat(property.location.longitude);

//         const markerIcon = L.divIcon({
//           className: 'leaflet-div-icon',
//           html: `<div style="background: #3498db; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; cursor: pointer;">${index + 1}</div>`,
//           iconSize: [30, 30],
//           iconAnchor: [15, 15]
//         });

//         const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(mapInstance.current);
//         marker.property = property;
//         marker.index = index;
        
//         markers.push(marker);
//         bounds.extend([lat, lng]);

//         // Marker click handler
//         marker.on('click', () => {
//           selectProperty(property, marker, index);
//         });
//       }
//     });

//     setSearchMarkers(markers);

//     // Fit map to bounds if we have markers
//     if (markers.length > 0) {
//       setTimeout(() => {
//         mapInstance.current.fitBounds(bounds, { padding: [20, 20] });
//       }, 100);
//     }
//   };

//   // Fixed selectProperty function
//   const selectProperty = async (property, marker, index) => {
//     setSelectedProperty(property);
  
//     // Update marker icons
//     searchMarkers.forEach((m, i) => {
//       const icon = L.divIcon({
//         className: 'leaflet-div-icon',
//         html: `<div style="background: ${i === index ? '#27ae60' : '#3498db'}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; cursor: pointer; ${i === index ? 'animation: pulse 2s infinite;' : ''}">${i + 1}</div>`,
//         iconSize: [30, 30],
//         iconAnchor: [15, 15]
//       });
//       m.setIcon(icon);
//     });
  
//     // Center map on selected property
//     if (marker) {
//       mapInstance.current.setView(marker.getLatLng(), 17);
//     }
  
//     // Check if this property has detailed information
//     // If it's from zip code search, it will be missing building details, lot info, etc.
//     const needsDetailedInfo = !property.building || !property.lot || 
//                              !property.building?.size || !property.lot?.lotsize2;
  
//     let detailedProperty = property;
    
//     if (needsDetailedInfo && property.identifier?.attomId) {
//       try {
//         setLoading(true);
        
//         console.log('Fetching detailed property info for ID:', property.identifier.attomId);
        
//         // Get detailed property information using the detail endpoint
//         const detailUrl = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?id=${property.identifier.attomId}`;
//         const detailResponse = await fetch(detailUrl, {
//           headers: {
//             'Accept': 'application/json',
//             'apikey': attomApiKey
//           }
//         });
  
//         const detailData = await detailResponse.json();
        
//         if (detailData.status && detailData.status.code === 0 && detailData.property && detailData.property.length > 0) {
//           // Get the detailed property data
//           const detailedPropertyData = detailData.property[0];
          
//           // Now get owner and events data
//           const [ownerData, eventsData] = await Promise.all([
//             getPropertyOwner(property.identifier.attomId),
//             getPropertyEvents(property.identifier.attomId)
//           ]);
          
//           // Merge all the data together
//           detailedProperty = {
//             ...property, // Original basic data
//             ...detailedPropertyData, // Detailed property data
//             owner: ownerData?.property?.[0]?.owner || detailedPropertyData.owner || property.owner,
//             events: eventsData?.property?.[0] || detailedPropertyData.events || property.events,
//             // Keep the original address if it was better formatted
//             address: property.address || detailedPropertyData.address,
//             fullAddress: property.fullAddress || detailedPropertyData.fullAddress || property.address?.oneLine
//           };
          
//           console.log('Successfully merged detailed property data');
//         } else {
//           // If detail fetch fails, still try to get owner and events with the original data
//           console.log('Detail fetch failed, trying to get owner/events only');
//           const [ownerData, eventsData] = await Promise.all([
//             getPropertyOwner(property.identifier.attomId),
//             getPropertyEvents(property.identifier.attomId)
//           ]);
          
//           detailedProperty = {
//             ...property,
//             owner: ownerData?.property?.[0]?.owner || property.owner,
//             events: eventsData?.property?.[0] || property.events
//           };
//         }
        
//         setSelectedProperty(detailedProperty);
//       } catch (error) {
//         console.error('Error getting detailed property info:', error);
//         // Continue with the basic property data
//       } finally {
//         setLoading(false);
//       }
//     }
  
//     // Notify parent component with the detailed property data
//     if (onPropertySelect) {
//       onPropertySelect(detailedProperty);
//     }
//   };

//   // Get property owner details
//   const getPropertyOwner = async (attomId) => {
//     try {
//       const response = await fetch(
//         `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detailowner?id=${attomId}`,
//         {
//           headers: {
//             'Accept': 'application/json',
//             'apikey': attomApiKey
//           }
//         }
//       );
//       const data = await response.json();
//       return data.status && data.status.code === 0 ? data : null;
//     } catch (error) {
//       console.error('Error fetching owner details:', error);
//       return null;
//     }
//   };

//   // Get property events
//   const getPropertyEvents = async (attomId) => {
//     try {
//       const response = await fetch(
//         `https://api.gateway.attomdata.com/propertyapi/v1.0.0/allevents/detail?id=${attomId}`,
//         {
//           headers: {
//             'Accept': 'application/json',
//             'apikey': attomApiKey
//           }
//         }
//       );
//       const data = await response.json();
//       return data.status && data.status.code === 0 ? data : null;
//     } catch (error) {
//       console.error('Error fetching property events:', error);
//       return null;
//     }
//   };

//   // Clear search markers
//   const clearSearchMarkers = () => {
//     searchMarkers.forEach(marker => mapInstance.current.removeLayer(marker));
//     setSearchMarkers([]);
//   };

//   // Create popup content (keeping existing function but improving styling)
//   const createPopupContent = (property) => {
//     const formatCurrency = (value) => {
//       if (!value || value === 0) return null;
//       return new Intl.NumberFormat('en-US', {
//         style: 'currency',
//         currency: 'USD',
//         maximumFractionDigits: 0
//       }).format(value);
//     };

//     // Get the best available value from different paths
//     const getPropertyValue = (path) => {
//       const eventsPath = path.split('.').reduce((obj, key) => obj?.events?.[key], property);
//       if (eventsPath !== undefined && eventsPath !== null) return eventsPath;
      
//       const directPath = path.split('.').reduce((obj, key) => obj?.[key], property);
//       return directPath;
//     };

//     // Get assessment and market values
//     const assessment = getPropertyValue('assessment') || {};
//     const marketValue = 
//       assessment.market?.mktttlvalue ||
//       assessment.calculations?.calcttlvalue ||
//       assessment.assessed?.assdttlvalue ||
//       property.sale?.amount?.saleamt ||
//       null;

//     let content = `<div class="property-popup" style="min-width: 280px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">`;
    
//     // Address
//     content += `<h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px; line-height: 1.4; padding-right: 30px;">${property.fullAddress || getPropertyAddress(property)}</h3>`;
    
//     // Property Type
//     if (property.summary?.propclass || property.summary?.proptype) {
//       content += `<div style="display: flex; align-items: center; font-size: 14px; color: #6b7280; margin-bottom: 8px;">
//         <span style="margin-right: 8px;">🏢</span>
//         ${property.summary.propclass || property.summary.proptype}
//       </div>`;
//     }
    
//     // Market Value
//     if (marketValue) {
//       const formattedValue = formatCurrency(marketValue);
//       if (formattedValue) {
//         content += `<div style="display: flex; align-items: center; font-size: 14px; color: #111827; margin-bottom: 8px; font-weight: 500;">
//           <span style="margin-right: 8px; color: #059669;">💰</span>
//           Value: ${formattedValue}
//         </div>`;
//       }
//     }
    
//     // Building Size
//     if (property.building?.size?.universalsize) {
//       content += `<div style="display: flex; align-items: center; font-size: 14px; color: #6b7280; margin-bottom: 8px;">
//         <span style="margin-right: 8px;">📐</span>
//         ${property.building.size.universalsize.toLocaleString()} sq ft
//       </div>`;
//     }
    
//     // Bedrooms/Bathrooms
//     if (property.building?.rooms) {
//       let rooms = [];
//       if (property.building.rooms.beds) rooms.push(`${property.building.rooms.beds} beds`);
//       if (property.building.rooms.bathstotal) rooms.push(`${property.building.rooms.bathstotal} baths`);
//       if (rooms.length > 0) {
//         content += `<div style="display: flex; align-items: center; font-size: 14px; color: #6b7280; margin-bottom: 8px;">
//           <span style="margin-right: 8px;">🛏️</span>
//           ${rooms.join(', ')}
//         </div>`;
//       }
//     }
    
//     // Owner
//     if (property.owner?.owner1?.fullname) {
//       content += `<div style="display: flex; align-items: center; font-size: 14px; color: #6b7280; margin-bottom: 16px;">
//         <span style="margin-right: 8px;">👤</span>
//         Owner: ${property.owner.owner1.fullname}
//       </div>`;
//     }
    
//     // Action buttons
//     content += `<div style="display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
//       <button id="view-details-btn" style="flex: 1; background: #2563eb; color: white; font-size: 13px; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background-color 0.2s;">
//         👁️ View Details
//       </button>
//       <button id="save-property-btn" style="flex: 1; background: #059669; color: white; font-size: 13px; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background-color 0.2s;">
//         💾 Save Property
//       </button>
//     </div>`;
    
//     content += `</div>`;
    
//     // Add event listeners after popup is created
//     setTimeout(() => {
//       const viewDetailsBtn = document.getElementById('view-details-btn');
//       const savePropertyBtn = document.getElementById('save-property-btn');
      
//       if (viewDetailsBtn) {
//         viewDetailsBtn.onmouseover = () => viewDetailsBtn.style.backgroundColor = '#1d4ed8';
//         viewDetailsBtn.onmouseout = () => viewDetailsBtn.style.backgroundColor = '#2563eb';
//         viewDetailsBtn.onclick = (e) => {
//           e.stopPropagation();
//           if (onPropertySelect) {
//             onPropertySelect(property);
//           }
//         };
//       }
      
//       if (savePropertyBtn) {
//         savePropertyBtn.onmouseover = () => savePropertyBtn.style.backgroundColor = '#047857';
//         savePropertyBtn.onmouseout = () => savePropertyBtn.style.backgroundColor = '#059669';
//         savePropertyBtn.onclick = async (e) => {
//           e.stopPropagation();
          
//           // Change button to loading state
//           savePropertyBtn.innerHTML = `<span style="display: inline-flex; align-items: center;">⏳ Saving...</span>`;
//           savePropertyBtn.style.backgroundColor = '#6b7280';
          
//           try {
//             if (onPropertySaved) {
//               await onPropertySaved(property);
              
//               // Change to success state
//               savePropertyBtn.innerHTML = `✅ Saved!`;
//               savePropertyBtn.style.backgroundColor = '#6b7280';
//               savePropertyBtn.style.cursor = 'default';
//               savePropertyBtn.disabled = true;
//             }
//           } catch (error) {
//             // Reset button on error
//             savePropertyBtn.innerHTML = `💾 Save Property`;
//             savePropertyBtn.style.backgroundColor = '#059669';
//             console.error('Error saving property:', error);
//           }
//         };
//       }
//     }, 100);
    
//     return content;
//   };

//   const getPropertyAddress = (property) => {
//     if (property.address?.oneLine) return property.address.oneLine;
    
//     let address = '';
//     if (property.address?.line1) address += property.address.line1;
    
//     const parts = [];
//     if (property.address?.city) parts.push(property.address.city);
//     if (property.address?.state) parts.push(property.address.state);
//     if (property.address?.postal1) parts.push(property.address.postal1);
    
//     if (parts.length > 0) {
//       address += (address ? ', ' : '') + parts.join(', ');
//     }
    
//     return address || 'Address Unknown';
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="relative h-full flex bg-white">
//       {/* Sidebar with search functionality */}
//       <div className="w-96 bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-lg">
//         {/* Search Section */}
//         <div className="border-b border-gray-200 p-4 bg-gray-50">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//             <Search className="h-5 w-5 mr-2 text-blue-600" />
//             Property Search
//           </h3>
          
//           {/* Search Type Toggle */}
//           <div className="flex mb-4 bg-gray-200 rounded-lg p-1">
//             <button
//               onClick={() => setSearchType('zipcode')}
//               className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
//                 searchType === 'zipcode' 
//                   ? 'bg-white text-blue-600 shadow-sm' 
//                   : 'text-gray-600 hover:text-gray-800'
//               }`}
//             >
//               Zip Code
//             </button>
//             <button
//               onClick={() => setSearchType('address')}
//               className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
//                 searchType === 'address' 
//                   ? 'bg-white text-blue-600 shadow-sm' 
//                   : 'text-gray-600 hover:text-gray-800'
//               }`}
//             >
//               Address
//             </button>
//           </div>

//           {/* Zip Code Search */}
//           {searchType === 'zipcode' && (
//             <div className="space-y-3">
//               <div>
//                 <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-1">
//                   Zip Code:
//                 </label>
//                 <input
//                   type="text"
//                   id="zipcode"
//                   value={zipcode}
//                   onChange={(e) => setZipcode(e.target.value)}
//                   onKeyPress={(e) => e.key === 'Enter' && handleZipcodeSearch()}
//                   placeholder="e.g., 10019"
//                   maxLength="10"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                 />
//               </div>
//               <button
//                 onClick={handleZipcodeSearch}
//                 disabled={loading}
//                 className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm"
//               >
//                 {loading ? (
//                   <>
//                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                     Searching...
//                   </>
//                 ) : (
//                   <>
//                     <Search className="w-4 h-4 mr-2" />
//                     Search Properties
//                   </>
//                 )}
//               </button>
//             </div>
//           )}

//           {/* Address Search */}
//           {searchType === 'address' && (
//             <div className="space-y-3">
//               <div>
//                 <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">
//                   Street Address:
//                 </label>
//                 <input
//                   type="text"
//                   id="address1"
//                   value={address1}
//                   onChange={(e) => setAddress1(e.target.value)}
//                   onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
//                   placeholder="e.g., 123 Main St"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                 />
//               </div>
//               <div>
//                 <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-1">
//                   City, State:
//                 </label>
//                 <input
//                   type="text"
//                   id="address2"
//                   value={address2}
//                   onChange={(e) => setAddress2(e.target.value)}
//                  onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
//                  placeholder="e.g., New York, NY"
//                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                />
//              </div>
//              <button
//                onClick={handleAddressSearch}
//                disabled={loading}
//                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm"
//              >
//                {loading ? (
//                  <>
//                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                    Searching...
//                  </>
//                ) : (
//                  <>
//                    <Search className="w-4 h-4 mr-2" />
//                    Search Property
//                  </>
//                )}
//              </button>
//            </div>
//          )}

//          {/* Error Display */}
//          {error && (
//            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
//              <div className="flex items-center">
//                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
//                <span>{error}</span>
//              </div>
//            </div>
//          )}
//        </div>

//        {/* Results Section */}
//        <div className="flex-1 overflow-y-auto">
//          {/* Tab Navigation */}
//          <div className="border-b border-gray-200 bg-white">
//            <nav className="flex">
//              <button
//                onClick={() => setActiveTab('search-results')}
//                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-200 ${
//                  activeTab === 'search-results'
//                  ? 'border-blue-600 text-blue-600 bg-blue-50'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
//               }`}
//             >
//               Search Results ({searchResults.length})
//             </button>
//             <button
//               onClick={() => setActiveTab('click-result')}
//               className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-200 ${
//                 activeTab === 'click-result'
//                   ? 'border-blue-600 text-blue-600 bg-blue-50'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
//               }`}
//             >
//               Map Click {clickResult && !clickResult.error ? '(1)' : ''}
//             </button>
//           </nav>
//         </div>

//         {/* Search Results Tab */}
//         {activeTab === 'search-results' && (
//           <div className="p-4">
//             {searchResults.length > 0 ? (
//               <div className="space-y-3">
//                 {searchResults.map((property, index) => (
//                   <div
//                     key={index}
//                     onClick={() => {
//                       const marker = searchMarkers.find(m => m.property === property);
//                       selectProperty(property, marker, index);
//                     }}
//                     className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
//                       selectedProperty === property 
//                         ? 'bg-green-50 border-green-300 shadow-md' 
//                         : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300'
//                     }`}
//                   >
//                     <div className="flex items-start justify-between">
//                       <div className="flex-1">
//                         <div className="font-medium text-gray-900 text-sm mb-1 flex items-center">
//                           <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white mr-2 ${
//                             selectedProperty === property ? 'bg-green-500' : 'bg-blue-500'
//                           }`}>
//                             {index + 1}
//                           </span>
//                           {getPropertyAddress(property)}
//                         </div>
//                         <div className="text-xs text-gray-600 space-y-1">
//                           <div className="flex items-center">
//                             <span className="font-medium mr-1">Type:</span>
//                             {property.summary?.propclass || property.summary?.proptype || 'Property'}
//                           </div>
//                           {property.building?.size?.universalsize && (
//                             <div className="flex items-center">
//                               <span className="font-medium mr-1">Size:</span>
//                               {property.building.size.universalsize.toLocaleString()} sq ft
//                             </div>
//                           )}
//                           {property.building?.rooms?.beds && (
//                             <div className="flex items-center">
//                               <span className="font-medium mr-1">Beds:</span>
//                               {property.building.rooms.beds}
//                               {property.building.rooms.bathstotal && (
//                                 <span className="ml-2">
//                                   <span className="font-medium">Baths:</span> {property.building.rooms.bathstotal}
//                                 </span>
//                               )}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                       {selectedProperty === property && (
//                         <div className="ml-2 text-green-500">
//                           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                           </svg>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-12 text-gray-500">
//                 <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
//                 <p className="text-sm font-medium">No search results yet</p>
//                 <p className="text-xs mt-1">Search by zip code or address to find properties</p>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Click Result Tab */}
//         {activeTab === 'click-result' && (
//           <div className="p-4">
//             {clickResult ? (
//               clickResult.error ? (
//                 <div className="text-center py-12">
//                   <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
//                   <p className="text-sm font-medium text-red-600">{clickResult.error}</p>
//                   <p className="text-xs text-gray-500 mt-1">Try clicking on a different location</p>
//                 </div>
//               ) : (
//                 <div
//                   onClick={() => {
//                     setSelectedProperty(clickResult);
//                     if (onPropertySelect) {
//                       onPropertySelect(clickResult);
//                     }
//                   }}
//                   className="p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300"
//                 >
//                   <div className="flex items-start justify-between">
//                     <div className="flex-1">
//                       <div className="font-medium text-gray-900 text-sm mb-1 flex items-center">
//                         <span className="text-red-500 mr-2">📍</span>
//                         {clickResult.fullAddress || getPropertyAddress(clickResult)}
//                       </div>
//                       <div className="text-xs text-gray-600">
//                         <div className="flex items-center">
//                           <span className="font-medium mr-1">From map click</span>
//                           <span className="text-blue-600">→ Click to view details</span>
//                         </div>
//                         {clickResult.summary?.propclass && (
//                           <div className="mt-1">
//                             <span className="font-medium mr-1">Type:</span>
//                             {clickResult.summary.propclass}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                     <div className="ml-2 text-blue-500">
//                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                       </svg>
//                     </div>
//                   </div>
//                 </div>
//               )
//             ) : (
//               <div className="text-center py-12 text-gray-500">
//                 <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
//                 <p className="text-sm font-medium">No map click yet</p>
//                 <p className="text-xs mt-1">Click anywhere on the map to explore properties</p>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>

//     {/* Map Container */}
//     <div className="flex-1 relative bg-gray-100">
//         {/* Loading overlay */}
//         {loading && (
//           <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
//             <div className="flex items-center space-x-2">
//               <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
//               <span className="text-sm text-gray-700">
//                 {activeTab === 'search-results' ? 'Searching for properties...' : 'Getting property information...'}
//               </span>
//             </div>
//           </div>
//         )}
        
//         {/* Close button - only show if not hidden */}
//         {!hideCloseButton && (
//           <div className="absolute top-4 right-4 z-10">
//             <button 
//               onClick={onClose}
//               className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
//               title="Close map"
//             >
//               <X className="h-5 w-5" />
//             </button>
//           </div>
//         )}
        
//         {/* Map container */}
//         <div 
//           ref={mapRef} 
//           className="w-full h-full"
//           style={{ minHeight: '400px' }}
//         />
        
//         {/* Instructions - update for embedded mode */}
//         <div className="absolute bottom-4 left-4 z-10 bg-white bg-opacity-95 text-sm text-gray-600 px-3 py-2 rounded-lg shadow-md max-w-xs">
//           <div className="flex items-center">
//             <span className="mr-2">💡</span>
//             <span>
//               {initialState?.property ? 
//                 'Showing property from recent search' : 
//                 hideCloseButton ? 
//                   'Search properties using the sidebar or click anywhere on the map' :
//                   'Search properties using the sidebar or click anywhere on the map'
//               }
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PropertyMap;