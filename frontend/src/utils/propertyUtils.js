// utils/propertyUtils.js

/**
 * Extract coordinates from a property object
 * @param {Object} property - The property object
 * @returns {Object} - {latitude, longitude}
 */
export const getPropertyCoordinates = (property) => {
    if (!property) return { latitude: null, longitude: null };
    
    // Try various possible paths for coordinates
    const latitude = 
      property.location?.latitude || 
      property.address?.latitude || 
      (property.address?.location?.geometry?.coordinates?.[1]) ||
      (property.location?.coordinates?.[1]) ||
      (property.location?.geometry?.coordinates?.[1]) ||
      null;
      
    const longitude = 
      property.location?.longitude || 
      property.address?.longitude || 
      (property.address?.location?.geometry?.coordinates?.[0]) ||
      (property.location?.coordinates?.[0]) ||
      (property.location?.geometry?.coordinates?.[0]) ||
      null;
    
    return { latitude, longitude };
  };
  
  /**
   * Get formatted address from a property object
   * @param {Object} property - The property object
   * @returns {String} - Formatted address string
   */
  export const getPropertyAddress = (property) => {
    if (!property) return 'Unknown Address';
    
    if (property.address?.oneLine) return property.address.oneLine;
    if (property.fullAddress) return property.fullAddress;
    
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
  };
  
  /**
   * Check if a property exists in an array of properties by ID
   * @param {Array} properties - Array of property objects
   * @param {String|Number} propertyId - The property ID to search for
   * @returns {Object|null} - The found property or null
   */
  export const findPropertyById = (properties, propertyId) => {
    if (!properties || !propertyId) return null;
    
    return properties.find(property => 
      property.attomId === propertyId || 
      property.propertyData?.attomId === propertyId ||
      property.identifier?.attomId === propertyId ||
      property.propertyData?.identifier?.attomId === propertyId
    );
  };
  
  /**
   * Format currency value
   * @param {Number} value - The value to format
   * @returns {String} - Formatted currency string
   */
  export const formatCurrency = (value) => {
    if (!value || value === 0) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  export default {
    getPropertyCoordinates,
    getPropertyAddress,
    findPropertyById,
    formatCurrency
  };