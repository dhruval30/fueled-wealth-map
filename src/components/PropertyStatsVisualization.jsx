import React, { useMemo, useState } from 'react';

const PropertyStatsVisualization = ({ properties }) => {
  // State to track hovered items
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredSection, setHoveredSection] = useState(null);

  // Calculate statistics for visualization
  const stats = useMemo(() => {
    if (!properties || properties.length === 0) {
      return {
        propertyTypes: [],
        yearBuiltDistribution: [],
        valueRanges: [],
        taxRanges: []
      };
    }
    
    // Property types distribution
    const typeCount = {};
    properties.forEach(prop => {
      const type = prop.propertyType || 'Unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    const propertyTypes = Object.entries(typeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    
    // Year built distribution (by decade)
    const years = {};
    properties.forEach(prop => {
      if (!prop.yearBuilt) return;
      const decade = Math.floor(prop.yearBuilt / 10) * 10;
      years[decade] = (years[decade] || 0) + 1;
    });
    
    const yearBuiltDistribution = Object.entries(years)
      .map(([decade, count]) => ({ decade: parseInt(decade), count }))
      .sort((a, b) => a.decade - b.decade);
    
    // Market value ranges
    const values = {
      'Under $1M': 0,
      '$1M - $5M': 0,
      '$5M - $10M': 0,
      '$10M - $20M': 0,
      'Over $20M': 0
    };
    
    properties.forEach(prop => {
      const value = prop.marketValue || 0;
      if (value < 1000000) values['Under $1M']++;
      else if (value < 5000000) values['$1M - $5M']++;
      else if (value < 10000000) values['$5M - $10M']++;
      else if (value < 20000000) values['$10M - $20M']++;
      else values['Over $20M']++;
    });
    
    const valueRanges = Object.entries(values)
      .map(([range, count]) => ({ range, count }));
    
    // Tax amount ranges
    const taxes = {
      'Under $100K': 0,
      '$100K - $250K': 0,
      '$250K - $500K': 0,
      '$500K - $1M': 0,
      'Over $1M': 0
    };
    
    properties.forEach(prop => {
      const tax = prop.taxAmount || 0;
      if (tax < 100000) taxes['Under $100K']++;
      else if (tax < 250000) taxes['$100K - $250K']++;
      else if (tax < 500000) taxes['$250K - $500K']++;
      else if (tax < 1000000) taxes['$500K - $1M']++;
      else taxes['Over $1M']++;
    });
    
    const taxRanges = Object.entries(taxes)
      .map(([range, count]) => ({ range, count }));
    
    return {
      propertyTypes,
      yearBuiltDistribution,
      valueRanges,
      taxRanges
    };
  }, [properties]);
  
  // Color configurations for the charts
  const chartColors = {
    propertyTypes: {
      base: '#3B82F6',
      hover: '#2563EB',
      light: 'rgba(59, 130, 246, 0.1)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    yearBuilt: {
      base: '#10B981',
      hover: '#059669',
      light: 'rgba(16, 185, 129, 0.1)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#10B981" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    marketValue: {
      base: '#8B5CF6',
      hover: '#7C3AED',
      light: 'rgba(139, 92, 246, 0.1)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#8B5CF6" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    taxRanges: {
      base: '#F97316',
      hover: '#EA580C',
      light: 'rgba(249, 115, 22, 0.1)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#F97316" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  };
  
  // Helper function to create a bar chart
  const renderBarChart = (data, keyField, valueField, title, colorKey) => {
    if (!data || data.length === 0) return null;
    
    // Find the maximum value for scaling
    const maxValue = Math.max(...data.map(item => item[valueField]));
    const colors = chartColors[colorKey];
    const isHoveredSection = hoveredSection === colorKey;
    
    return (
      <div 
        style={{ 
          marginBottom: '16px',
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: isHoveredSection ? colors.light : 'white',
          transition: 'background-color 0.3s ease',
          border: '1px solid rgba(229, 231, 235, 0.5)',
          boxShadow: isHoveredSection ? '0 2px 6px rgba(0, 0, 0, 0.05)' : 'none'
        }}
        onMouseEnter={() => setHoveredSection(colorKey)}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <h3 style={{ 
          fontSize: '14px', 
          color: '#4B5563', 
          marginTop: 0,
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: '600'
        }}>
          {colors.icon}
          {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {data.map((item, index) => {
            const percentage = (item[valueField] / maxValue) * 100;
            const isHovered = hoveredBar === `${colorKey}-${index}`;
            
            return (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  backgroundColor: isHovered ? 'rgba(249, 250, 251, 0.7)' : 'transparent',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={() => setHoveredBar(`${colorKey}-${index}`)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <div style={{ 
                  width: '100px', 
                  fontSize: '12px', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  fontWeight: isHovered ? '500' : '400',
                  transition: 'font-weight 0.2s ease'
                }}>
                  {item[keyField]}
                </div>
                <div style={{ 
                  flex: 1, 
                  height: '20px', 
                  position: 'relative',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    height: '100%', 
                    width: `${percentage}%`,
                    backgroundColor: isHovered ? colors.hover : colors.base,
                    borderRadius: '4px',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '6px',
                    boxSizing: 'border-box'
                  }}>
                    {/* Show value on the bar if it's wide enough */}
                    {percentage > 35 && (
                      <span style={{ 
                        fontSize: '11px', 
                        color: 'white', 
                        fontWeight: '600',
                        opacity: isHovered ? 1 : 0.8,
                        transition: 'opacity 0.2s ease'
                      }}>
                        {item[valueField]}
                      </span>
                    )}
                    
                    {/* Animated shine effect */}
                    {isHovered && (
                      <div style={{
                        position: 'absolute',
                        top: '-50%',
                        left: '0',
                        width: '15px',
                        height: '200%',
                        background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
                        transform: 'rotate(25deg)',
                        animation: 'shine 1.5s infinite',
                        animationTimingFunction: 'ease-in-out'
                      }}></div>
                    )}
                  </div>
                </div>
                {/* Value shown outside the bar if it's too narrow */}
                {percentage <= 35 && (
                  <div style={{ 
                    width: '30px', 
                    fontSize: '12px', 
                    textAlign: 'right',
                    fontWeight: isHovered ? '600' : '500',
                    color: isHovered ? colors.hover : '#4B5563',
                    transition: 'all 0.2s ease'
                  }}>
                    {item[valueField]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '10px', 
      boxShadow: '0 3px 12px rgba(0, 0, 0, 0.08)',
      padding: '18px',
      marginTop: '18px',
      border: '1px solid rgba(229, 231, 235, 0.5)'
    }}>
      <h2 style={{ 
        marginTop: 0, 
        marginBottom: '18px',
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#111827',
        borderBottom: '1px solid #F3F4F6',
        paddingBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4B5563" width="18" height="18">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Property Data Visualization
      </h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '18px'
      }}>
        {renderBarChart(
          stats.propertyTypes, 
          'type', 
          'count', 
          'Property Types Distribution', 
          'propertyTypes'
        )}
        
        {renderBarChart(
          stats.yearBuiltDistribution, 
          'decade', 
          'count', 
          'Construction by Decade', 
          'yearBuilt'
        )}
        
        {renderBarChart(
          stats.valueRanges, 
          'range', 
          'count', 
          'Market Value Distribution', 
          'marketValue'
        )}
        
        {renderBarChart(
          stats.taxRanges, 
          'range', 
          'count', 
          'Annual Tax Distribution', 
          'taxRanges'
        )}
      </div>
      
      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes shine {
          0% {
            left: -100%;
          }
          100% {
            left: 200%;
          }
        }
      `}</style>
    </div>
  );
};

export default PropertyStatsVisualization;