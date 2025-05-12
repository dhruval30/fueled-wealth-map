import React, { useMemo, useState } from 'react';

// PropertySidebar.jsx
// This component displays statistics for visible properties
const PropertySidebar = ({ properties, selectedFilters }) => {
  // State for hover effects
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Calculate statistics based on filtered properties
  const stats = useMemo(() => {
    if (!properties || properties.length === 0) {
      return {
        totalProperties: 0,
        averageMarketValue: 0,
        totalTaxAmount: 0,
        averagePricePerSqFt: 0,
        averageBuildingSize: 0,
        oldestProperty: null,
        newestProperty: null
      };
    }
    
    const totalProperties = properties.length;
    
    const totalMarketValue = properties.reduce((acc, prop) => 
      acc + (prop.marketValue || 0), 0);
    
    const averageMarketValue = totalProperties > 0 
      ? totalMarketValue / totalProperties 
      : 0;
    
    const totalTaxAmount = properties.reduce((acc, prop) => 
      acc + (prop.taxAmount || 0), 0);
    
    const totalBuildingSize = properties.reduce((acc, prop) => 
      acc + (prop.buildingSize || 0), 0);
    
    const averageBuildingSize = totalProperties > 0
      ? totalBuildingSize / totalProperties
      : 0;
    
    const averagePricePerSqFt = totalBuildingSize > 0 
      ? totalMarketValue / totalBuildingSize 
      : 0;
    
    // Find oldest and newest properties
    const propertiesWithYear = properties
      .filter(p => p.yearBuilt > 0)
      .sort((a, b) => a.yearBuilt - b.yearBuilt);
    
    const oldestProperty = propertiesWithYear.length > 0 
      ? propertiesWithYear[0] 
      : null;
    
    const newestProperty = propertiesWithYear.length > 0 
      ? propertiesWithYear[propertiesWithYear.length - 1] 
      : null;
    
    return {
      totalProperties,
      averageMarketValue,
      totalTaxAmount,
      averagePricePerSqFt,
      averageBuildingSize,
      oldestProperty,
      newestProperty
    };
  }, [properties]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format number with commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Card configuration data
  const cardData = [
    {
      id: 'properties',
      title: 'Properties',
      value: formatNumber(stats.totalProperties),
      color: '#1E40AF',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      bgHoverColor: 'rgba(59, 130, 246, 0.2)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      id: 'value',
      title: 'Average Value',
      value: formatCurrency(stats.averageMarketValue),
      color: '#047857',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      bgHoverColor: 'rgba(16, 185, 129, 0.2)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'taxes',
      title: 'Total Taxes',
      value: formatCurrency(stats.totalTaxAmount),
      color: '#6D28D9',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      bgHoverColor: 'rgba(139, 92, 246, 0.2)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'priceSqFt',
      title: 'Price per Sq Ft',
      value: formatCurrency(stats.averagePricePerSqFt),
      color: '#C2410C',
      bgColor: 'rgba(249, 115, 22, 0.1)',
      bgHoverColor: 'rgba(249, 115, 22, 0.2)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
      padding: '24px',
      transition: 'all 0.3s ease',
      border: '1px solid rgba(229, 231, 235, 0.5)'
    }}>
      <h2 style={{ 
        marginTop: 0, 
        marginBottom: '24px',
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        borderBottom: '1px solid #F3F4F6',
        paddingBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Property Statistics
      </h2>
      
      <div style={{ 
        display: 'grid', 
        gap: '16px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        marginBottom: '24px'
      }}>
        {cardData.map(card => (
          <div 
            key={card.id}
            onMouseEnter={() => setHoveredCard(card.id)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ 
              backgroundColor: hoveredCard === card.id ? card.bgHoverColor : card.bgColor, 
              borderRadius: '10px', 
              padding: '16px',
              cursor: 'default',
              transition: 'all 0.2s ease',
              transform: hoveredCard === card.id ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: hoveredCard === card.id 
                ? '0 6px 16px rgba(0, 0, 0, 0.1)' 
                : '0 2px 4px rgba(0, 0, 0, 0.02)',
              border: '1px solid rgba(229, 231, 235, 0.8)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <div style={{ 
                color: '#6B7280', 
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {card.title}
              </div>
              <div style={{ 
                color: card.color,
                opacity: hoveredCard === card.id ? 1 : 0.8
              }}>
                {card.icon}
              </div>
            </div>
            <div style={{ 
              color: card.color, 
              fontSize: '22px', 
              fontWeight: 'bold',
              letterSpacing: '-0.025em'
            }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>
      
      {stats.oldestProperty && stats.newestProperty && (
        <div style={{ 
          marginTop: '20px',
          backgroundColor: 'rgba(243, 244, 246, 0.5)',
          borderRadius: '10px',
          padding: '16px',
          border: '1px solid rgba(229, 231, 235, 0.8)',
          transition: 'all 0.2s ease',
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            marginTop: 0,
            marginBottom: '16px', 
            color: '#4B5563',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Property Age Range
          </h3>
          
          {/* Age Range Progress Bar */}
          <div style={{ 
            width: '100%', 
            height: '8px',
            backgroundColor: '#E5E7EB',
            borderRadius: '4px',
            marginBottom: '16px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              height: '100%',
              left: '0',
              right: '0',
              background: 'linear-gradient(to right, #3B82F6, #10B981)',
              borderRadius: '4px'
            }} />
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            color: '#4B5563'
          }}>
            <div>
              <div style={{ 
                color: '#6B7280', 
                fontSize: '14px',
                marginBottom: '4px'
              }}>
                Oldest
              </div>
              <div style={{ 
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {stats.oldestProperty.yearBuilt}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontWeight: 'bold',
                fontSize: '14px',
                color: '#6B7280',
                backgroundColor: 'rgba(209, 213, 219, 0.5)',
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'inline-block'
              }}>
                {stats.newestProperty.yearBuilt - stats.oldestProperty.yearBuilt} year span
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                color: '#6B7280', 
                fontSize: '14px',
                marginBottom: '4px'
              }}>
                Newest
              </div>
              <div style={{ 
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {stats.newestProperty.yearBuilt}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Building size information */}
      <div style={{ 
        marginTop: '20px',
        padding: '16px',
        borderRadius: '10px',
        backgroundColor: 'rgba(249, 250, 251, 0.7)',
        border: '1px solid rgba(229, 231, 235, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4F46E5'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#6B7280', fontSize: '14px' }}>Avg. Building Size</div>
            <div style={{ fontWeight: 'bold', color: '#111827' }}>
              {formatNumber(Math.round(stats.averageBuildingSize))} sq ft
            </div>
          </div>
        </div>
        <div style={{ 
          height: '30px', 
          width: '1px', 
          backgroundColor: '#E5E7EB',
          margin: '0 10px'
        }}></div>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#EA580C'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#6B7280', fontSize: '14px' }}>Tax to Value Ratio</div>
            <div style={{ fontWeight: 'bold', color: '#111827' }}>
              {stats.averageMarketValue > 0 
                ? ((stats.totalTaxAmount / (stats.averageMarketValue * stats.totalProperties)) * 100).toFixed(2) + '%'
                : '0%'
              }
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer with refresh timestamp */}
      <div style={{ 
        marginTop: '24px',
        borderTop: '1px solid #F3F4F6',
        paddingTop: '12px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        color: '#9CA3AF',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="14" height="14">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default PropertySidebar;