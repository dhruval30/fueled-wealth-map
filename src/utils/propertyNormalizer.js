/**
 * Normalizes raw property data into a standardized format
 * @param {Object} rawPropertyData - The raw property JSON data
 * @returns {Array} Array of normalized property objects
 */
export const normalizePropertyData = (rawPropertyData) => {
  // Check if data exists and has properties
  if (!rawPropertyData || !rawPropertyData.property) {
    console.warn('Invalid property data structure:', rawPropertyData);
    return [];
  }
  
  // Handle single property or array of properties
  const propertyArray = Array.isArray(rawPropertyData.property) 
    ? rawPropertyData.property 
    : [rawPropertyData.property];
  
  console.log('Normalizing properties, count:', propertyArray.length);
  
  return propertyArray.map(prop => {
    // Extract coordinates with fallbacks
    let latitude = null;
    let longitude = null;
    
    if (prop.location) {
      latitude = prop.location.latitude;
      longitude = prop.location.longitude;
    }
    
    // Log each property being processed
    console.log('Processing property:', prop.address?.oneLine || 'Unknown', 
                'Coordinates:', latitude, longitude);
    
    // Extract all needed fields with safe fallbacks
    return {
      id: prop.identifier?.attomId || Math.random().toString(36).substr(2, 9),
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
      address: prop.address?.oneLine || 'No address available',
      marketValue: prop.assessment?.market?.mktttlvalue || 0,
      salePrice: prop.sale?.amount?.saleamt || 0,
      taxAmount: prop.assessment?.tax?.taxamt || 0,
      buildingSize: prop.building?.size?.bldgsize || 0,
      propertyType: prop.summary?.propertyType || 'Unknown',
      
      // Additional useful properties
      yearBuilt: prop.summary?.yearbuilt || 0,
      lotSize: prop.lot?.lotsize2 || 0,
      bedrooms: prop.building?.rooms?.beds || 0,
      bathrooms: prop.building?.rooms?.bathstotal || 0,
      units: prop.building?.summary?.unitsCount || 0,
      assessedValue: prop.assessment?.assessed?.assdttlvalue || 0,
      saleDate: prop.sale?.saleTransDate || null,
      
      // Store original data for reference if needed
      rawData: prop
    };
  });
};

export default normalizePropertyData;