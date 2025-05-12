import React from 'react';

const PropertyDetailVisualization = ({ property }) => {
  if (!property) return null;

  // Format currency values
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format numbers with commas
  const formatNumber = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  // Helper to calculate percentage for gauges
  const calculatePercentage = (value, max) => {
    if (!value || !max) return 0;
    return Math.min(100, (value / max) * 100);
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      marginBottom: '20px' 
    }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Property Metrics</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#4B5563' }}>
          {property.address}
        </h3>
        <div style={{ fontSize: '16px', color: '#6B7280', marginBottom: '5px' }}>
          {property.propertyType} • Built in {property.yearBuilt || 'Unknown'}
        </div>
      </div>
      
      {/* Value Metrics */}
      <div style={{ marginBottom: '30px' }}>
        <h4 style={{ fontSize: '16px', color: '#4B5563', marginBottom: '15px' }}>Financial Overview</h4>
        
        {/* Market Value Gauge */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>Market Value</span>
            <span style={{ fontSize: '16px', fontWeight: '500', color: '#047857' }}>
              {formatCurrency(property.marketValue)}
            </span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#E5E7EB',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${calculatePercentage(property.marketValue, 20000000)}%`, 
              height: '100%', 
              backgroundColor: '#10B981',
              borderRadius: '4px'
            }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: '#9CA3AF' }}>
            <span>$0</span>
            <span>$20M</span>
          </div>
        </div>
        
        {/* Tax Amount Gauge */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>Annual Tax</span>
            <span style={{ fontSize: '16px', fontWeight: '500', color: '#B91C1C' }}>
              {formatCurrency(property.taxAmount)}
            </span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#E5E7EB',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${calculatePercentage(property.taxAmount, 1000000)}%`, 
              height: '100%', 
              backgroundColor: '#EF4444',
              borderRadius: '4px'
            }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: '#9CA3AF' }}>
            <span>$0</span>
            <span>$1M</span>
          </div>
        </div>
        
        {/* Price per sq ft comparison */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>Price per Sq Ft</span>
            <span style={{ fontSize: '16px', fontWeight: '500', color: '#6D28D9' }}>
              {formatCurrency(property.buildingSize ? property.marketValue / property.buildingSize : 0)}
            </span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#E5E7EB',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${calculatePercentage((property.buildingSize ? property.marketValue / property.buildingSize : 0), 2000)}%`, 
              height: '100%', 
              backgroundColor: '#8B5CF6',
              borderRadius: '4px'
            }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: '#9CA3AF' }}>
            <span>$0</span>
            <span>$2,000</span>
          </div>
        </div>
      </div>
      
      {/* Property Size Visualization */}
      <div>
        <h4 style={{ fontSize: '16px', color: '#4B5563', marginBottom: '15px' }}>Property Size</h4>
        
        {/* Building Size */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>Building Size</span>
            <span style={{ fontSize: '16px', fontWeight: '500' }}>
              {formatNumber(property.buildingSize)} sq ft
            </span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#E5E7EB',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${calculatePercentage(property.buildingSize, 50000)}%`, 
              height: '100%', 
              backgroundColor: '#F59E0B',
              borderRadius: '4px'
            }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: '#9CA3AF' }}>
            <span>0</span>
            <span>50,000 sq ft</span>
          </div>
        </div>
        
        {/* Lot Size */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>Lot Size</span>
            <span style={{ fontSize: '16px', fontWeight: '500' }}>
              {formatNumber(property.lotSize)} sq ft
            </span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#E5E7EB',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${calculatePercentage(property.lotSize, 10000)}%`, 
              height: '100%', 
              backgroundColor: '#14B8A6',
              borderRadius: '4px'
            }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: '#9CA3AF' }}>
            <span>0</span>
            <span>10,000 sq ft</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailVisualization;