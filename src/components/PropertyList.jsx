import React from 'react';

const PropertyList = ({ properties, onPropertySelect, loading }) => {
  // If loading, show a loading indicator
  if (loading) {
    return (
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        padding: '20px',
        marginTop: '20px'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '15px', color: '#1F2937', fontWeight: '600' }}>Properties</h2>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #E5E7EB', 
            borderTopColor: '#3B82F6', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // If no properties, show a message
  if (!properties || properties.length === 0) {
    return (
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        padding: '20px',
        marginTop: '20px'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '15px', color: '#1F2937', fontWeight: '600' }}>Properties</h2>
        <div style={{ 
          padding: '30px', 
          textAlign: 'center', 
          color: '#6B7280',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px'
        }}>
          No properties found. Try adjusting your filters.
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      marginTop: '20px'
    }}>
      <h2 style={{ marginTop: 0, marginBottom: '15px', color: '#1F2937', fontWeight: '600' }}>Properties</h2>
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {properties.map((property, index) => (
          <div 
            key={property.id || index}
            style={{
              padding: '15px',
              borderBottom: index < properties.length - 1 ? '1px solid #E5E7EB' : 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              borderRadius: '5px'
            }}
            onClick={() => onPropertySelect(property)}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <h3 style={{ 
              margin: '0 0 5px 0', 
              fontSize: '16px', 
              fontWeight: '600',
              color: '#1F2937'
            }}>
              {property.address || 'Unknown Address'}
            </h3>
            
            <div style={{ fontSize: '14px', color: '#4B5563', marginBottom: '5px' }}>
              {property.propertyType || 'Unknown Property Type'}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#047857'
              }}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0
                }).format(property.marketValue || 0)}
              </div>
              
              <div style={{ 
                backgroundColor: '#DBEAFE', 
                color: '#1E40AF', 
                fontSize: '12px', 
                fontWeight: '500',
                padding: '3px 8px', 
                borderRadius: '20px' 
              }}>
                {property.yearBuilt ? `Built ${property.yearBuilt}` : 'Year unknown'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyList;
