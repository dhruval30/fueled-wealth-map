import React from 'react';

const PropertyDetails = ({ property }) => {
  if (!property) return null;
  
  // Format currency values
  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format numbers with commas
  const formatNumber = (value) => {
    if (!value && value !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      marginTop: '20px'
    }}>
      <h2 style={{ marginTop: 0, marginBottom: '15px' }}>Property Details</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        <div>
          <h3 style={{ color: '#4b5563', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
            Basic Information
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Address</div>
              <div>{property.address?.oneLine || 'No address available'}</div>
            </div>
            
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Property Type</div>
              <div>{property.summary?.propertyType || 'Unknown'}</div>
            </div>
            
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Year Built</div>
              <div>{property.summary?.yearbuilt || 'Unknown'}</div>
            </div>
            
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Building Size</div>
              <div>{formatNumber(property.building?.size?.bldgsize)} sq ft</div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 style={{ color: '#4b5563', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
            Financial Information
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Market Value</div>
              <div style={{ color: '#047857' }}>{formatCurrency(property.assessment?.market?.mktttlvalue)}</div>
            </div>
            
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Annual Tax</div>
              <div style={{ color: '#b91c1c' }}>{formatCurrency(property.assessment?.tax?.taxamt)}</div>
            </div>
            
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Sale Amount</div>
              <div>{formatCurrency(property.sale?.amount?.saleamt)}</div>
            </div>
            
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Price per sq ft</div>
              <div>
                {property.building?.size?.bldgsize && property.assessment?.market?.mktttlvalue
                  ? formatCurrency(property.assessment.market.mktttlvalue / property.building.size.bldgsize)
                  : 'N/A'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button 
          onClick={() => {
            const lat = property.location?.latitude;
            const lng = property.location?.longitude;
            if (lat && lng) {
              window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
            }
          }}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          View on Google Maps
        </button>
      </div>
    </div>
  );
};

export default PropertyDetails;
