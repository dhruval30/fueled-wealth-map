import { Building, Loader2, MapPin } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Dashboard Property Card component
 * Displays property information with image in the dashboard
 */
const DashboardPropertyCard = ({ property, compact = false }) => {
  const [imageStatus, setImageStatus] = useState('loading');
  
  // Get property information
  const address = property.address || getPropertyAddress(property.propertyData);
  const propertyId = property.attomId || property.propertyData?.identifier?.attomId;
  const value = getPropertyValue(property);
  const propertyType = getPropertyType(property);
  
  // Get image URL for the property
  const imageUrl = propertyId ? `/api/images/streetview/streetview_${propertyId}.png` : null;
  
  // Handle image load events
  const handleImageLoad = () => {
    setImageStatus('loaded');
  };
  
  const handleImageError = () => {
    setImageStatus('error');
  };
  
  return (
    <Link 
      to={`/saved-properties?view=${propertyId}`} 
      className={`block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${compact ? 'h-full' : ''}`}
    >
      <div className="relative">
        {/* Image container */}
        <div className="h-40 bg-gray-100 rounded-t-lg overflow-hidden relative">
          {/* Loading state */}
          {imageStatus === 'loading' && imageUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
            </div>
          )}
          
          {/* Error state or no image */}
          {(imageStatus === 'error' || !imageUrl) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="h-10 w-10 text-gray-300" />
            </div>
          )}
          
          {/* Property image */}
          {imageUrl && (
            <img 
              src={imageUrl}
              alt={address}
              className="w-full h-full object-cover"
              style={{ 
                opacity: imageStatus === 'loaded' ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out'
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </div>
        
        {/* Property details */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-1 truncate">
            {address}
          </h3>
          
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <Building className="h-3.5 w-3.5 text-gray-400 mr-1 flex-shrink-0" />
            <span className="truncate">{propertyType}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-green-600 text-base font-semibold">
              {formatCurrency(value)}
            </div>
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              Saved recently
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Helper functions
function getPropertyAddress(property) {
  if (!property) return 'Unknown Address';
  
  if (property.fullAddress) return property.fullAddress;
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
  
  return address || 'Unknown Address';
}

function getPropertyType(property) {
  if (!property || !property.propertyData) return 'Property';
  
  const propData = property.propertyData;
  return propData.summary?.propclass || 
         propData.summary?.proptype || 
         property.propertyType ||
         'Property';
}

function getPropertyValue(property) {
  if (!property) return null;
  
  // Check if already formatted
  if (typeof property.value === 'string' && property.value.startsWith('$')) {
    return property.value;
  }
  
  if (property.value) return property.value;
  
  const propData = property.propertyData;
  if (!propData) return null;
  
  // Try all possible paths for property value
  return propData.events?.assessment?.market?.mktttlvalue || 
         propData.assessment?.market?.mktttlvalue ||
         propData.assessment?.assessed?.assdttlvalue ||
         propData.sale?.amount?.saleamt || 
         null;
}

function formatCurrency(value) {
  if (!value) return 'N/A';
  
  // If already formatted
  if (typeof value === 'string' && value.startsWith('$')) {
    return value;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

export default DashboardPropertyCard;