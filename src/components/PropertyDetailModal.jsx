import React, { useState } from 'react';

// PropertyDetailModal.jsx
// This component displays detailed property information with visualizations
const PropertyDetailModal = ({ property, onClose }) => {
  // State to track hover effects
  const [hoveredSection, setHoveredSection] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredCloseButton, setHoveredCloseButton] = useState(false);
  
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
  
  // Calculate percentages for visualizations
  const calculatePercentage = (value, max) => {
    if (!value || !max) return 0;
    return Math.min(100, (value / max) * 100);
  };

  // Helper function to render a horizontal bar chart
  const renderBarChart = (label, value, maxValue, color, id) => {
    const percentage = calculatePercentage(value, maxValue);
    const isHovered = hoveredSection === id;
    
    return (
      <div 
        style={{ 
          marginBottom: '15px',
          transition: 'all 0.2s ease',
          padding: '12px',
          borderRadius: '8px',
          cursor: 'default',
          backgroundColor: isHovered ? 'rgba(249, 250, 251, 0.8)' : 'transparent',
          border: isHovered ? '1px solid rgba(229, 231, 235, 0.8)' : '1px solid transparent',
          transform: isHovered ? 'translateX(5px)' : 'translateX(0)'
        }}
        className="bar-chart-container"
        onMouseEnter={() => setHoveredSection(id)}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '8px' 
        }}>
          <span style={{ 
            fontSize: '14px', 
            color: '#6B7280', 
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke={color} width="18" height="18" style={{ opacity: isHovered ? 1 : 0.7 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            {label}
          </span>
          <span style={{ 
            fontWeight: '600', 
            color, 
            fontSize: '16px',
            transition: 'transform 0.2s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}>{typeof value === 'number' ? formatCurrency(value) : value}</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '12px', 
          backgroundColor: '#E5E7EB',
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          <div style={{ 
            width: `${percentage}%`, 
            height: '100%', 
            backgroundColor: isHovered ? color : `${color}CC`, // Add transparency when not hovered
            borderRadius: '6px',
            transition: 'width 0.5s ease, opacity 0.3s ease, background-color 0.3s ease',
            boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Shine effect */}
            {isHovered && (
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '0',
                width: '20px',
                height: '200%',
                background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
                transform: 'rotate(25deg)',
                animation: 'shine 1.5s infinite',
                animationTimingFunction: 'ease-in-out'
              }}></div>
            )}
          </div>
          
          {/* Value indicator pip on hover */}
          {isHovered && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: `${percentage}%`,
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
              backgroundColor: 'white',
              borderRadius: '50%',
              border: `2px solid ${color}`,
              boxShadow: '0 0 4px rgba(0,0,0,0.2)',
              zIndex: 5
            }}></div>
          )}
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '6px', 
          fontSize: '12px', 
          color: '#9CA3AF' 
        }}>
          <span>$0</span>
          <span>{maxValue >= 1000000 ? `$${maxValue/1000000}M` : `$${maxValue.toLocaleString()}`}</span>
        </div>
      </div>
    );
  };

  // Render a pie chart for a financial breakdown
  const renderPieChart = () => {
    const total = property.marketValue;
    const taxPercentage = (property.taxAmount / total) * 100;
    const assessedPercentage = (property.assessedValue / total) * 100;
    const remainingPercentage = 100 - taxPercentage - assessedPercentage;
    
    return (
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '220px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        margin: '0 auto 30px auto',
      }}
      onMouseEnter={() => setHoveredSection('pie')}
      onMouseLeave={() => setHoveredSection(null)}
      >
        <svg viewBox="0 0 100 100" width="220" height="220" style={{ filter: hoveredSection === 'pie' ? 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))' : 'none', transition: 'filter 0.3s ease' }}>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2" />
          </filter>
          
          <circle cx="50" cy="50" r="45" fill="white" stroke="#E5E7EB" strokeWidth="1" filter="url(#shadow)" />
          
          {/* Draw pie segments */}
          {/* Assessed Value Segment */}
          <circle cx="50" cy="50" r="45" fill="transparent" stroke="#3B82F6" 
                  strokeWidth="11" 
                  strokeDasharray={`${assessedPercentage * 2.83} ${(100 - assessedPercentage) * 2.83}`} 
                  strokeDashoffset="0" 
                  transform="rotate(-90 50 50)" 
                  style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.3s ease' }}
                  stroke1={hoveredSection === 'pie' ? '#2563EB' : '#3B82F6'} />
          
          {/* Tax Amount Segment */}
          <circle cx="50" cy="50" r="45" fill="transparent" stroke="#EF4444" 
                  strokeWidth="11" 
                  strokeDasharray={`${taxPercentage * 2.83} ${(100 - taxPercentage) * 2.83}`} 
                  strokeDashoffset={`${-(assessedPercentage) * 2.83}`} 
                  transform="rotate(-90 50 50)" 
                  style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.3s ease' }}
                  stroke2={hoveredSection === 'pie' ? '#DC2626' : '#EF4444'} />
          
          {/* Remaining Equity Segment */}
          <circle cx="50" cy="50" r="45" fill="transparent" stroke="#10B981" 
                  strokeWidth="11" 
                  strokeDasharray={`${remainingPercentage * 2.83} ${(100 - remainingPercentage) * 2.83}`} 
                  strokeDashoffset={`${-(assessedPercentage + taxPercentage) * 2.83}`} 
                  transform="rotate(-90 50 50)" 
                  style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.3s ease' }}
                  stroke3={hoveredSection === 'pie' ? '#059669' : '#10B981'} />
          
          {/* Center text */}
          <g filter="url(#shadow)">
            <text x="50" y="43" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#374151">Market Value</text>
            <text x="50" y="55" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1F2937">{formatCurrency(property.marketValue)}</text>
          </g>
        </svg>
        
        {/* Legend */}
        <div style={{ 
           padding: '12px',
           borderRadius: '8px',
           backgroundColor: 'rgba(255, 255, 255, 0.95)',
           boxShadow: hoveredSection === 'pie' ? '0 4px 8px rgba(0,0,0,0.15)' : '0 2px 5px rgba(0,0,0,0.1)',
           transition: 'box-shadow 0.3s ease',
           border: '1px solid rgba(229, 231, 235, 0.8)',
           display: 'flex',
           flexDirection: 'column',
           gap: '12px',
           fontSize: '13px',
           flex: '0 0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '14px', 
              height: '14px', 
              backgroundColor: hoveredSection === 'pie' ? '#2563EB' : '#3B82F6', 
              borderRadius: '3px',
              transition: 'background-color 0.3s ease'
            }}></div>
            <span><strong>Assessed:</strong> {formatCurrency(property.assessedValue)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '14px', 
              height: '14px', 
              backgroundColor: hoveredSection === 'pie' ? '#DC2626' : '#EF4444', 
              borderRadius: '3px',
              transition: 'background-color 0.3s ease'
            }}></div>
            <span><strong>Tax:</strong> {formatCurrency(property.taxAmount)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '14px', 
              height: '14px', 
              backgroundColor: hoveredSection === 'pie' ? '#059669' : '#10B981', 
              borderRadius: '3px',
              transition: 'background-color 0.3s ease'
            }}></div>
            <span><strong>Equity:</strong> {formatCurrency(property.marketValue - property.assessedValue - property.taxAmount)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Render a size comparison chart
  const renderSizeComparisonChart = () => {
    const lotSize = property.lotSize || 0;
    const buildingSize = property.buildingSize || 0;
    const isHovered = hoveredSection === 'size';
    
    return (
      <div 
        style={{ marginBottom: '25px' }}
        onMouseEnter={() => setHoveredSection('size')}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Building Size */}
          <div style={{ 
            backgroundColor: isHovered ? '#BFDBFE' : '#DBEAFE', 
            padding: '14px 16px', 
            borderRadius: '10px',
            boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease',
            transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
            cursor: 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
          className="hover-card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#2563EB" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div style={{ fontWeight: '600', textAlign: 'center', fontSize: '15px' }}>
              Building: {formatNumber(buildingSize)} sq ft
            </div>
          </div>
          
          {/* Lot Size */}
          <div style={{ 
            backgroundColor: isHovered ? '#BAE6FD' : '#E0F2FE', 
            padding: '14px 16px', 
            borderRadius: '10px',
            boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease',
            transform: isHovered ? 'translateY(2px)' : 'translateY(0)',
            cursor: 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
          className="hover-card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#0284C7" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <div style={{ fontWeight: '600', textAlign: 'center', fontSize: '15px' }}>
              Lot: {formatNumber(lotSize)} sq ft
            </div>
          </div>
        </div>
        
        {/* Building Coverage Ratio */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '15px', 
          color: '#4B5563', 
          marginTop: '15px', 
          fontWeight: '500',
          padding: '10px',
          borderRadius: '8px',
          backgroundColor: isHovered ? '#F3F4F6' : '#F9FAFB',
          transition: 'background-color 0.2s ease',
          border: '1px solid rgba(229, 231, 235, 0.8)',
          boxShadow: isHovered ? '0 2px 5px rgba(0,0,0,0.05)' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4B5563" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Building Coverage Ratio: <strong>{lotSize ? ((buildingSize / lotSize) * 100).toFixed(1) : 0}%</strong>
          </div>
        </div>
      </div>
    );
  };

  // Render year built timeline
  const renderYearBuiltTimeline = () => {
    const yearBuilt = property.yearBuilt || 0;
    const currentYear = new Date().getFullYear();
    const startYear = 1900;
    const timelinePercentage = ((yearBuilt - startYear) / (currentYear - startYear)) * 100;
    const isHovered = hoveredSection === 'year';
    
    return (
      <div 
        style={{ marginBottom: '30px' }}
        onMouseEnter={() => setHoveredSection('year')}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '50px',
          backgroundColor: isHovered ? '#E5E7EB' : '#F3F4F6',
          borderRadius: '25px',
          marginBottom: '20px',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
          transition: 'background-color 0.3s ease'
        }}>
          {/* Timeline bar */}
          <div style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            boxSizing: 'border-box',
            justifyContent: 'space-between',
            color: isHovered ? '#4B5563' : '#6B7280',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'color 0.3s ease'
          }}>
            <span>1900</span>
            <span>1950</span>
            <span>2000</span>
            <span>{currentYear}</span>
          </div>
          
          {/* Progress bar */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            transform: 'translateY(-50%)',
            width: `${timelinePercentage}%`,
            height: '10px',
            backgroundColor: isHovered ? '#3B82F6' : '#60A5FA',
            borderRadius: '5px',
            transition: 'background-color 0.3s ease, width 0.5s ease-in-out',
            margin: '0 10px'
          }}></div>
          
          {/* Year marker */}
          <div style={{
            position: 'absolute',
            top: '-22px',
            left: `${timelinePercentage}%`,
            transform: isHovered ? 'translateX(-50%) scale(1.1)' : 'translateX(-50%)',
            width: '44px',
            height: '44px',
            backgroundColor: isHovered ? '#2563EB' : '#3B82F6',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: 10,
            transition: 'all 0.3s ease',
            boxShadow: isHovered ? '0 6px 12px rgba(59, 130, 246, 0.4)' : '0 4px 6px rgba(59, 130, 246, 0.3)',
            cursor: 'default'
          }}
          className="year-marker"
          >
            {yearBuilt}
          </div>
        </div>
        
        {/* Age display */}
        <div style={{
          backgroundColor: isHovered ? '#EFF6FF' : '#F9FAFB',
          borderRadius: '8px',
          padding: '10px 16px',
          textAlign: 'center',
          transition: 'background-color 0.3s ease',
          border: '1px solid rgba(229, 231, 235, 0.8)',
          maxWidth: '200px',
          margin: '0 auto'
        }}>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>Property Age</div>
          <div style={{ fontWeight: 'bold', color: '#1F2937', fontSize: '16px' }}>
            {currentYear - yearBuilt} years old
          </div>
        </div>
      </div>
    );
  };

  // Render property units visualization
  const renderPropertyUnits = () => {
    const units = property.units || 0;
    const isHovered = hoveredSection === 'units';
    
    return (
      <div 
        style={{ marginBottom: '30px' }}
        onMouseEnter={() => setHoveredSection('units')}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: '6px',
          margin: '0 auto',
          maxWidth: '400px',
          padding: '15px',
          borderRadius: '10px',
          backgroundColor: isHovered ? '#F3F4F6' : '#F9FAFB',
          transition: 'background-color 0.3s ease',
          border: '1px solid rgba(229, 231, 235, 0.8)'
        }}>
          {Array.from({ length: Math.min(50, units) }).map((_, index) => (
            <div 
              key={index} 
              style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: isHovered ? (index < units / 2 ? '#93C5FD' : '#BFDBFE') : '#BFDBFE',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                cursor: 'default',
                transform: isHovered && index === Math.floor(units / 2) ? 'scale(1.2)' : 'scale(1)'
              }}
              className="unit-box"
            ></div>
          ))}
        </div>
        <div style={{ 
          textAlign: 'center', 
          marginTop: '15px', 
          fontSize: '15px', 
          color: '#4B5563',
          fontWeight: '500',
          backgroundColor: isHovered ? '#EFF6FF' : '#F9FAFB',
          padding: '10px',
          borderRadius: '8px',
          width: 'fit-content',
          margin: '15px auto 0 auto',
          border: '1px solid rgba(229, 231, 235, 0.8)',
          transition: 'background-color 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4B5563" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Total Units: <strong>{units}</strong>
        </div>
      </div>
    );
  };

  // Render sale history timeline
  const renderSaleHistory = () => {
    const saleYear = property.saleDate ? new Date(property.saleDate).getFullYear() : null;
    const saleMonth = property.saleDate ? new Date(property.saleDate).toLocaleString('default', { month: 'long' }) : '';
    const saleDay = property.saleDate ? new Date(property.saleDate).getDate() : '';
    
    // Calculate position on timeline (2010-2025)
    const startYear = 2010;
    const endYear = 2025;
    const position = saleYear ? ((saleYear - startYear) / (endYear - startYear)) * 100 : 50;
    const isHovered = hoveredSection === 'sale';
    
    return (
      <div 
        style={{ 
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: isHovered ? '#F3F4F6' : '#F9FAFB',
          borderRadius: '12px',
          boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.1)' : 'inset 0 1px 3px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          border: '1px solid rgba(229, 231, 235, 0.8)'
        }}
        onMouseEnter={() => setHoveredSection('sale')}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div style={{ 
          position: 'relative',
          height: '90px'
        }}>
          {/* Timeline bar */}
          <div style={{ 
            position: 'absolute',
            top: '45px',
            left: '0',
            width: '100%',
            height: '4px',
            backgroundColor: '#E5E7EB'
          }}></div>
          
          {/* Progress bar */}
          <div style={{
            position: 'absolute',
            top: '45px',
            left: 0,
            width: `${position}%`,
            height: '4px',
            backgroundColor: isHovered ? '#F59E0B' : '#FBBF24',
            transition: 'background-color 0.3s ease, width 0.5s ease-in-out'
          }}></div>
          
          {/* Year markers */}
          {[2010, 2015, 2020, 2025].map((year, index) => (
            <div key={index} style={{
              position: 'absolute',
              bottom: '15px',
              left: `${((year - startYear) / (endYear - startYear)) * 100}%`,
              transform: 'translateX(-50%)',
              color: isHovered ? '#4B5563' : '#6B7280',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'color 0.3s ease'
            }}>
              {year}
            </div>
          ))}
          
          {/* Sale marker */}
          {saleYear && (
            <div style={{
              position: 'absolute',
              top: '0',
              left: `${position}%`,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                padding: '10px 14px',
                backgroundColor: 'white',
                borderRadius: '10px',
                boxShadow: isHovered ? '0 8px 16px rgba(0,0,0,0.15)' : '0 2px 5px rgba(0,0,0,0.1)',
                marginBottom: '10px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'default',
                transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
                border: '1px solid rgba(229, 231, 235, 0.8)'
              }}
              className="hover-card"
              >
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: isHovered ? '#D97706' : '#F59E0B', transition: 'color 0.3s ease' }}>
                  {formatCurrency(property.salePrice)}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                  {saleMonth} {saleDay}, {saleYear}
                </div>
              </div>
              
              <div style={{
                width: '18px',
                height: '18px',
                backgroundColor: isHovered ? '#D97706' : '#F59E0B',
                borderRadius: '50%',
                marginBottom: '5px',
                boxShadow: isHovered ? '0 4px 8px rgba(245, 158, 11, 0.4)' : '0 2px 4px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.3s ease'
              }}></div>
              
              <div style={{
                width: '3px',
                height: '18px',
                backgroundColor: isHovered ? '#D97706' : '#F59E0B',
                transition: 'background-color 0.3s ease'
              }}></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render location section
  const renderLocationSection = () => {
    const isHovered = hoveredSection === 'location';
    
    return (
      <div 
        style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '30px',
          padding: '20px',
          backgroundColor: isHovered ? '#F3F4F6' : '#F9FAFB',
          borderRadius: '12px',
          marginBottom: '30px',
          transition: 'background-color 0.3s ease',
          border: '1px solid rgba(229, 231, 235, 0.8)'
        }}
        onMouseEnter={() => setHoveredSection('location')}
        onMouseLeave={() => setHoveredSection(null)}
      >
        {/* Map Pin Visualization */}
        <div style={{ 
          width: '120px', 
          height: '120px', 
          backgroundColor: isHovered ? '#E5E7EB' : '#EEF2FF',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isHovered ? '0 8px 16px rgba(0,0,0,0.1)' : '0 4px 8px rgba(0,0,0,0.05)'
        }}
        onClick={() => window.open(`https://www.google.com/maps?q=${property.latitude},${property.longitude}`, '_blank')}
        >
          <div style={{ 
            position: 'absolute',
            width: '30px',
            height: '30px',
            backgroundColor: isHovered ? '#DC2626' : '#EF4444',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            top: '38%',
            left: '38%',
            boxShadow: isHovered ? '0 4px 8px rgba(239, 68, 68, 0.6)' : '0 2px 5px rgba(239, 68, 68, 0.5)',
            transition: 'all 0.3s ease'
          }}></div>
          <div style={{ 
            position: 'absolute',
            width: '12px',
            height: '12px',
            backgroundColor: 'white',
            borderRadius: '50%',
            top: '42%',
            left: '45%',
            transition: 'all 0.3s ease'
          }}></div>
          
          {/* Pulse animation */}
          {isHovered && (
            <div style={{ 
              position: 'absolute',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '3px solid rgba(239, 68, 68, 0.3)',
              animation: 'pulse 2s infinite',
              top: '-3px',
              left: '-3px'
            }}></div>
          )}
        </div>
        
        {/* Coordinates */}
        <div style={{ 
          padding: '18px', 
          borderRadius: '12px', 
          backgroundColor: 'white', 
          boxShadow: isHovered ? '0 4px 10px rgba(0,0,0,0.1)' : '0 2px 5px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
          border: '1px solid rgba(229, 231, 235, 0.8)'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#6B7280', 
              marginBottom: '5px', 
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#6B7280" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Latitude
            </div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#111827',
              backgroundColor: isHovered ? '#F9FAFB' : 'transparent',
              padding: isHovered ? '4px 8px' : '0',
              borderRadius: '4px',
              transition: 'all 0.3s ease',
              display: 'inline-block'
            }}>
              {property.latitude}
            </div>
          </div>
          <div>
            <div style={{ 
              fontSize: '14px', 
              color: '#6B7280', 
              marginBottom: '5px', 
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#6B7280" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              Longitude
            </div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#111827',
              backgroundColor: isHovered ? '#F9FAFB' : 'transparent',
              padding: isHovered ? '4px 8px' : '0',
              borderRadius: '4px',
              transition: 'all 0.3s ease',
              display: 'inline-block'
            }}>
              {property.longitude}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add CSS for animations and hover effects
  const styles = `
    @keyframes shine {
      0% {
        left: -100%;
      }
      100% {
        left: 200%;
      }
    }
    
    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        transform: scale(1.3);
        opacity: 0;
      }
    }
    
    .hover-card:hover {
      transform: translateY(-4px) !important;
      box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
    }
    
    @media (max-width: 640px) {
      .pie-chart-container {
        flex-direction: column;
      }

      .legend-container {
        position: static;
        transform: none;
        margin-top: 20px;
      }
    }
  `;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <style>{styles}</style>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.3), 0 10px 10px rgba(0, 0, 0, 0.15)',
        width: '100%',
        maxWidth: '1100px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: hoveredSection === 'header' ? '#1D4ED8' : '#2563EB',
          color: 'white',
          padding: '24px',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          transition: 'background-color 0.3s ease',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={() => setHoveredSection('header')}
        onMouseLeave={() => setHoveredSection(null)}
        >
          <h2 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="26" height="26">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Property Details
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: hoveredCloseButton ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              fontSize: '22px',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease',
              boxShadow: hoveredCloseButton ? '0 0 10px rgba(255, 255, 255, 0.3)' : 'none'
            }}
            onMouseEnter={() => setHoveredCloseButton(true)}
            onMouseLeave={() => setHoveredCloseButton(false)}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        {/* Address and Property Type */}
        <div style={{ 
          padding: '24px', 
          textAlign: 'center', 
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: hoveredSection === 'property-header' ? '#F9FAFB' : 'white',
          transition: 'background-color 0.3s ease'
        }}
        onMouseEnter={() => setHoveredSection('property-header')}
        onMouseLeave={() => setHoveredSection(null)}
        >
          <h3 style={{ 
            fontSize: '26px', 
            margin: '0 0 12px 0', 
            color: '#1F2937',
            fontWeight: '600'
          }}>{property.address}</h3>
          <div style={{ 
            fontSize: '16px', 
            color: '#4B5563', 
            backgroundColor: hoveredSection === 'property-header' ? '#EFF6FF' : '#F3F4F6', 
            display: 'inline-block', 
            padding: '8px 18px', 
            borderRadius: '24px',
            fontWeight: '500',
            transition: 'background-color 0.3s ease',
            border: '1px solid rgba(229, 231, 235, 0.8)'
          }}>
            {property.propertyType}
          </div>
        </div>
        
        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Main grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '30px',
            marginBottom: '30px'
          }}>
            {/* Financial Overview Column */}
            <div>
              <h3 style={{ 
                fontSize: '20px', 
                color: '#1F2937', 
                marginTop: 0,
                marginBottom: '24px', 
                paddingBottom: '10px', 
                borderBottom: '2px solid #E5E7EB',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4B5563" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Financial Overview
              </h3>
              
              {/* Pie chart for financial breakdown */}
              {renderPieChart()}
              
              {/* Financial Metrics Section */}
              <h4 style={{ 
                fontSize: '18px', 
                marginBottom: '16px', 
                color: '#4B5563',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4B5563" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Financial Metrics
              </h4>
              
              {/* Bar charts for financial metrics */}
              {renderBarChart('Market Value', property.marketValue, 25000000, '#047857', 'marketValue')}
              {renderBarChart('Annual Tax', property.taxAmount, 1250000, '#B91C1C', 'annualTax')}
              {renderBarChart('Price per Sq Ft', property.buildingSize ? (property.marketValue / property.buildingSize) : 0, 1000, '#6D28D9', 'pricePerSqFt')}
            </div>
            
            {/* Property Characteristics Column */}
            <div>
              <h3 style={{ 
                fontSize: '20px', 
                color: '#1F2937', 
                marginTop: 0,
                marginBottom: '24px', 
                paddingBottom: '10px', 
                borderBottom: '2px solid #E5E7EB',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4B5563" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Property Characteristics
              </h3>
              
              {/* Building vs Lot Size */}
              <h4 style={{ 
                fontSize: '18px', 
                marginBottom: '16px', 
                color: '#4B5563',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4B5563" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Building vs Lot Size
              </h4>
              {renderSizeComparisonChart()}
              
              {/* Year Built timeline */}
              <h4 style={{ 
                fontSize: '18px', 
                marginBottom: '16px', 
                color: '#4B5563',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4B5563" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Year Built
              </h4>
              {renderYearBuiltTimeline()}
              
              {/* Property Units */}
              <h4 style={{ 
                fontSize: '18px', 
                marginBottom: '16px', 
                color: '#4B5563',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4B5563" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Property Units
              </h4>
              {renderPropertyUnits()}
            </div>
          </div>
          
          {/* Sale History */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ 
              fontSize: '20px', 
              color: '#1F2937', 
              marginTop: 0,
              marginBottom: '24px', 
              paddingBottom: '10px', 
              borderBottom: '2px solid #E5E7EB',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4B5563" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sale History
            </h3>
            {renderSaleHistory()}
          </div>
          
          {/* Location Information */}
          <div>
            <h3 style={{ 
              fontSize: '20px', 
              color: '#1F2937', 
              marginTop: 0,
              marginBottom: '24px', 
              paddingBottom: '10px', 
              borderBottom: '2px solid #E5E7EB',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4B5563" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Location Information
            </h3>
            
            {renderLocationSection()}
          </div>
          
          {/* Actions */}
          <div style={{ 
            marginTop: '25px', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '16px',
            borderTop: '1px solid #E5E7EB',
            paddingTop: '25px'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 20px',
                backgroundColor: hoveredButton === 'close' ? '#E5E7EB' : '#F3F4F6',
                color: '#4B5563',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                transform: hoveredButton === 'close' ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hoveredButton === 'close' ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
              }}
              onMouseEnter={() => setHoveredButton('close')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              Close
            </button>
            <button
              style={{
                padding: '12px 20px',
                backgroundColor: hoveredButton === 'map' ? '#1D4ED8' : '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: hoveredButton === 'map' ? '0 6px 10px rgba(37, 99, 235, 0.3)' : '0 2px 4px rgba(37, 99, 235, 0.2)',
                transform: hoveredButton === 'map' ? 'translateY(-2px)' : 'translateY(0)'
              }}
              onMouseEnter={() => setHoveredButton('map')}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => window.open(`https://www.google.com/maps?q=${property.latitude},${property.longitude}`, '_blank')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              View on Google Maps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailModal;