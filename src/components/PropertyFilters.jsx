import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

// Enhanced PropertyFilters with proper dual-handle range sliders
const PropertyFilters = ({ properties, onFilterChange }) => {
  // State for filter values
  const [propertyType, setPropertyType] = useState('');
  const [yearBuiltRange, setYearBuiltRange] = useState([1895, 2025]);
  const [taxAmountRange, setTaxAmountRange] = useState([0, 1000000]);
  const [marketValueRange, setMarketValueRange] = useState([0, 20000000]);
  
  // Dragging states for range sliders
  const [dragging, setDragging] = useState({
    yearMin: false,
    yearMax: false,
    taxMin: false,
    taxMax: false,
    valueMin: false,
    valueMax: false
  });
  
  // Refs for range sliders
  const yearSliderRef = useRef(null);
  const taxSliderRef = useRef(null);
  const valueSliderRef = useRef(null);
  
  // UI state for hover effects
  const [hoveredSection, setHoveredSection] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(false);

  // Extract unique property types from data
  const propertyTypes = useMemo(() => {
    if (!properties || properties.length === 0) return [];
    const types = [...new Set(properties.map(p => p.propertyType))];
    return types.filter(Boolean).sort();
  }, [properties]);

  // Calculate min/max ranges for numeric filters
  const ranges = useMemo(() => {
    if (!properties || properties.length === 0) {
      return { 
        yearBuilt: [1895, 2025], 
        taxAmount: [0, 1000000],
        marketValue: [0, 20000000]
      };
    }
    
    const minYearBuilt = Math.min(...properties
      .filter(p => p.yearBuilt > 0)
      .map(p => p.yearBuilt || 1895));
    
    const maxYearBuilt = Math.max(...properties
      .map(p => p.yearBuilt || 2025));
    
    const minTaxAmount = Math.min(...properties
      .map(p => p.taxAmount || 0));
    
    const maxTaxAmount = Math.max(...properties
      .filter(p => p.taxAmount > 0)
      .map(p => p.taxAmount || 1000000));
    
    const minMarketValue = Math.min(...properties
      .map(p => p.marketValue || 0));
    
    const maxMarketValue = Math.max(...properties
      .filter(p => p.marketValue > 0)
      .map(p => p.marketValue || 20000000));
    
    return {
      yearBuilt: [Math.min(minYearBuilt, 1895), Math.max(maxYearBuilt, 2025)],
      taxAmount: [minTaxAmount, maxTaxAmount],
      marketValue: [minMarketValue, maxMarketValue]
    };
  }, [properties]);

  // Update filter ranges when properties change
  useEffect(() => {
    if (ranges.yearBuilt.every(n => !isNaN(n))) {
      setYearBuiltRange(ranges.yearBuilt);
    }
    
    if (ranges.taxAmount.every(n => !isNaN(n))) {
      setTaxAmountRange(ranges.taxAmount);
    }
    
    if (ranges.marketValue.every(n => !isNaN(n))) {
      setMarketValueRange(ranges.marketValue);
    }
  }, [ranges]);

  // Send filter changes to parent
  useEffect(() => {
    onFilterChange({
      propertyType,
      yearBuilt: yearBuiltRange,
      taxAmount: taxAmountRange,
      marketValue: marketValueRange
    });
  }, [propertyType, yearBuiltRange, taxAmountRange, marketValueRange, onFilterChange]);

  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Handle property type selection
  const handlePropertyTypeChange = (e) => {
    setPropertyType(e.target.value);
  };
  
  // Generic handle mouse/touch down function for sliders
  const handleDragStart = (e, slider, handle) => {
    e.preventDefault();
    const newDragging = { ...dragging };
    
    switch (slider) {
      case 'year':
        newDragging.yearMin = handle === 'min';
        newDragging.yearMax = handle === 'max';
        break;
      case 'tax':
        newDragging.taxMin = handle === 'min';
        newDragging.taxMax = handle === 'max';
        break;
      case 'value':
        newDragging.valueMin = handle === 'min';
        newDragging.valueMax = handle === 'max';
        break;
      default:
        break;
    }
    
    setDragging(newDragging);
  };
  
  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDragging({
      yearMin: false,
      yearMax: false,
      taxMin: false,
      taxMax: false,
      valueMin: false,
      valueMax: false
    });
  }, []);
  
  // Handle year slider movement - defined with useCallback to fix the ESLint warning
  const handleYearSliderMove = useCallback((e) => {
    if (!dragging.yearMin && !dragging.yearMax) return;
    if (!yearSliderRef.current) return;
    
    const rect = yearSliderRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const clampedPosition = Math.max(0, Math.min(1, position));
    
    const minYear = ranges.yearBuilt[0];
    const maxYear = ranges.yearBuilt[1];
    const year = Math.round(minYear + (maxYear - minYear) * clampedPosition);
    
    if (dragging.yearMin) {
      // Ensure min doesn't exceed max
      setYearBuiltRange(prev => [Math.min(year, prev[1] - 1), prev[1]]);
    } else if (dragging.yearMax) {
      // Ensure max doesn't go below min
      setYearBuiltRange(prev => [prev[0], Math.max(year, prev[0] + 1)]);
    }
  }, [dragging.yearMin, dragging.yearMax, ranges.yearBuilt]);
  
  // Handle tax slider movement - defined with useCallback to fix the ESLint warning
  const handleTaxSliderMove = useCallback((e) => {
    if (!dragging.taxMin && !dragging.taxMax) return;
    if (!taxSliderRef.current) return;
    
    const rect = taxSliderRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const clampedPosition = Math.max(0, Math.min(1, position));
    
    const minTax = ranges.taxAmount[0];
    const maxTax = ranges.taxAmount[1];
    const tax = Math.round(minTax + (maxTax - minTax) * clampedPosition);
    
    if (dragging.taxMin) {
      setTaxAmountRange(prev => [Math.min(tax, prev[1] - 1), prev[1]]);
    } else if (dragging.taxMax) {
      setTaxAmountRange(prev => [prev[0], Math.max(tax, prev[0] + 1)]);
    }
  }, [dragging.taxMin, dragging.taxMax, ranges.taxAmount]);
  
  // Handle value slider movement - defined with useCallback to fix the ESLint warning
  const handleValueSliderMove = useCallback((e) => {
    if (!dragging.valueMin && !dragging.valueMax) return;
    if (!valueSliderRef.current) return;
    
    const rect = valueSliderRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const clampedPosition = Math.max(0, Math.min(1, position));
    
    const minValue = ranges.marketValue[0];
    const maxValue = ranges.marketValue[1];
    const value = Math.round(minValue + (maxValue - minValue) * clampedPosition);
    
    if (dragging.valueMin) {
      setMarketValueRange(prev => [Math.min(value, prev[1] - 1), prev[1]]);
    } else if (dragging.valueMax) {
      setMarketValueRange(prev => [prev[0], Math.max(value, prev[0] + 1)]);
    }
  }, [dragging.valueMin, dragging.valueMax, ranges.marketValue]);
  
  // Handle touch events - defined with useCallback
  const handleTouchMove = useCallback((e, handleFunction) => {
    if (e.touches && e.touches[0]) {
      handleFunction({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY
      });
    }
  }, []);
  
  // Add and remove event listeners - now with proper dependencies
  useEffect(() => {
    const isYearDragging = dragging.yearMin || dragging.yearMax;
    const isTaxDragging = dragging.taxMin || dragging.taxMax;
    const isValueDragging = dragging.valueMin || dragging.valueMax;
    
    if (isYearDragging) {
      window.addEventListener('mousemove', handleYearSliderMove);
      window.addEventListener('touchmove', e => handleTouchMove(e, handleYearSliderMove));
    }
    
    if (isTaxDragging) {
      window.addEventListener('mousemove', handleTaxSliderMove);
      window.addEventListener('touchmove', e => handleTouchMove(e, handleTaxSliderMove));
    }
    
    if (isValueDragging) {
      window.addEventListener('mousemove', handleValueSliderMove);
      window.addEventListener('touchmove', e => handleTouchMove(e, handleValueSliderMove));
    }
    
    if (isYearDragging || isTaxDragging || isValueDragging) {
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleYearSliderMove);
      window.removeEventListener('mousemove', handleTaxSliderMove);
      window.removeEventListener('mousemove', handleValueSliderMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
      
      // Clean up touch event listeners more precisely
      if (isYearDragging) {
        window.removeEventListener('touchmove', e => handleTouchMove(e, handleYearSliderMove));
      }
      if (isTaxDragging) {
        window.removeEventListener('touchmove', e => handleTouchMove(e, handleTaxSliderMove));
      }
      if (isValueDragging) {
        window.removeEventListener('touchmove', e => handleTouchMove(e, handleValueSliderMove));
      }
    };
  }, [
    dragging.yearMin, dragging.yearMax,
    dragging.taxMin, dragging.taxMax,
    dragging.valueMin, dragging.valueMax,
    handleYearSliderMove, handleTaxSliderMove, handleValueSliderMove,
    handleDragEnd, handleTouchMove
  ]);
  
  // Calculate handle positions
  const getHandlePosition = (value, min, max) => {
    return `${((value - min) / (max - min)) * 100}%`;
  };
  
  // Reset all filters
  const handleReset = () => {
    setPropertyType('');
    setYearBuiltRange(ranges.yearBuilt);
    setTaxAmountRange(ranges.taxAmount);
    setMarketValueRange(ranges.marketValue);
  };

  // Filter section styling based on hover state
  const getFilterSectionStyle = (sectionId) => {
    const isHovered = hoveredSection === sectionId;
    
    return {
      marginBottom: '24px',
      padding: '16px',
      borderRadius: '10px',
      backgroundColor: isHovered ? 'rgba(249, 250, 251, 0.8)' : 'white',
      border: '1px solid rgba(229, 231, 235, 0.5)',
      boxShadow: isHovered ? '0 4px 8px rgba(0, 0, 0, 0.05)' : 'none',
      transition: 'all 0.2s ease'
    };
  };

  // Icons for filter sections
  const icons = {
    propertyType: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4F46E5" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    yearBuilt: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#10B981" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    taxAmount: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#EF4444" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    marketValue: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#8B5CF6" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  // Label styling with icon
  const getLabelStyle = () => {
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: '500',
      color: '#4B5563',
      marginBottom: '12px'
    };
  };
  
  // Dual-handle range slider component
  const DualRangeSlider = ({ 
    sliderRef,
    currentRange, 
    totalRange, 
    onDragStart,
    formatValue,
    trackColor,
    minHandleBorderColor,
    maxHandleBorderColor
  }) => {
    // Calculate left and right positions for range highlight
    const leftPosition = ((currentRange[0] - totalRange[0]) / (totalRange[1] - totalRange[0])) * 100;
    const rightPosition = 100 - ((currentRange[1] - totalRange[0]) / (totalRange[1] - totalRange[0])) * 100;
    
    // Calculate handle positions
    const minHandlePosition = getHandlePosition(currentRange[0], totalRange[0], totalRange[1]);
    const maxHandlePosition = getHandlePosition(currentRange[1], totalRange[0], totalRange[1]);
    
    return (
      <div style={{ position: 'relative', padding: '10px 0 20px' }}>
        {/* Main track */}
        <div 
          ref={sliderRef}
          className="dual-range-slider-track"
          style={{
            height: '8px',
            backgroundColor: '#E5E7EB',
            borderRadius: '4px',
            position: 'relative',
            cursor: 'pointer'
          }}
        >
          {/* Selected range */}
          <div 
            className="dual-range-slider-range"
            style={{
              position: 'absolute',
              left: `${leftPosition}%`,
              right: `${rightPosition}%`,
              top: 0,
              bottom: 0,
              backgroundColor: trackColor,
              borderRadius: '4px',
              transition: 'background-color 0.2s ease'
            }}
          />
          
          {/* Min handle */}
          <div 
            className="dual-range-slider-handle dual-range-slider-handle-min"
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: `2px solid ${minHandleBorderColor}`,
              position: 'absolute',
              top: '50%',
              left: minHandlePosition,
              transform: 'translate(-50%, -50%)',
              cursor: 'ew-resize',
              zIndex: 2,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.1s ease, box-shadow 0.1s ease'
            }}
            onMouseDown={(e) => onDragStart(e, 'min')}
            onTouchStart={(e) => onDragStart(e, 'min')}
          ></div>
          
          {/* Max handle */}
          <div 
            className="dual-range-slider-handle dual-range-slider-handle-max"
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: `2px solid ${maxHandleBorderColor}`,
              position: 'absolute',
              top: '50%',
              left: maxHandlePosition,
              transform: 'translate(-50%, -50%)',
              cursor: 'ew-resize',
              zIndex: 2,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.1s ease, box-shadow 0.1s ease'
            }}
            onMouseDown={(e) => onDragStart(e, 'max')}
            onTouchStart={(e) => onDragStart(e, 'max')}
          ></div>
        </div>
        
        {/* Range labels */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '8px',
          fontSize: '13px',
          color: '#6B7280'
        }}>
          <div>{formatValue(totalRange[0])}</div>
          <div>{formatValue(totalRange[1])}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
      padding: '24px',
      marginBottom: '24px',
      border: '1px solid rgba(229, 231, 235, 0.5)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        borderBottom: '1px solid #F3F4F6',
        paddingBottom: '16px'
      }}>
        <h2 style={{ 
          margin: 0,
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4B5563" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </h2>
        <button 
          onClick={handleReset}
          style={{
            padding: '10px 16px',
            backgroundColor: hoveredButton ? '#D1D5DB' : '#E5E7EB',
            color: '#4B5563',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            boxShadow: hoveredButton ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
            transform: hoveredButton ? 'translateY(-1px)' : 'translateY(0)'
          }}
          onMouseEnter={() => setHoveredButton(true)}
          onMouseLeave={() => setHoveredButton(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset All
        </button>
      </div>
      
      {/* Property Type Filter */}
      <div 
        style={getFilterSectionStyle('propertyType')}
        onMouseEnter={() => setHoveredSection('propertyType')}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <label style={getLabelStyle()}>
          {icons.propertyType}
          Property Type
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={propertyType}
            onChange={handlePropertyTypeChange}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              backgroundColor: 'white',
              appearance: 'none',
              cursor: 'pointer',
              fontSize: '15px',
              color: '#1F2937',
              transition: 'border-color 0.2s ease',
              borderColor: hoveredSection === 'propertyType' ? '#A5B4FC' : '#D1D5DB'
            }}
          >
            <option value="">All Property Types</option>
            {propertyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <div style={{ 
            position: 'absolute', 
            right: '16px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#6B7280'
          }}>
          </div>
        </div>
      </div>
      
      {/* Year Built Range Filter */}
      <div 
        style={getFilterSectionStyle('yearBuilt')}
        onMouseEnter={() => setHoveredSection('yearBuilt')}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <label style={getLabelStyle()}>
            {icons.yearBuilt}
            Year Built
          </label>
          <div style={{ 
            padding: '4px 10px',
            borderRadius: '16px',
            backgroundColor: hoveredSection === 'yearBuilt' ? '#D1FAE5' : '#ECFDF5',
            color: '#047857',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s ease'
          }}>
            {yearBuiltRange[0]} - {yearBuiltRange[1]}
          </div>
        </div>
        
        {/* Year Built Dual Range Slider */}
        <DualRangeSlider
          sliderRef={yearSliderRef}
          currentRange={yearBuiltRange}
          totalRange={ranges.yearBuilt}
          onDragStart={(e, handle) => handleDragStart(e, 'year', handle)}
          formatValue={(value) => value}
          trackColor={hoveredSection === 'yearBuilt' ? '#059669' : '#10B981'}
          minHandleBorderColor="#059669"
          maxHandleBorderColor="#10B981"
        />
      </div>
      
      {/* Tax Amount Range Filter */}
      <div 
        style={getFilterSectionStyle('taxAmount')}
        onMouseEnter={() => setHoveredSection('taxAmount')}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <label style={getLabelStyle()}>
            {icons.taxAmount}
            Tax Amount
          </label>
          <div style={{ 
            padding: '4px 10px',
            borderRadius: '16px',
            backgroundColor: hoveredSection === 'taxAmount' ? '#FEE2E2' : '#FEF2F2',
            color: '#B91C1C',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s ease'
          }}>
            {formatCurrency(taxAmountRange[0])} - {formatCurrency(taxAmountRange[1])}
          </div>
        </div>
        
        {/* Tax Amount Dual Range Slider */}
        <DualRangeSlider
          sliderRef={taxSliderRef}
          currentRange={taxAmountRange}
          totalRange={ranges.taxAmount}
          onDragStart={(e, handle) => handleDragStart(e, 'tax', handle)}
          formatValue={formatCurrency}
          trackColor={hoveredSection === 'taxAmount' ? '#DC2626' : '#EF4444'}
          minHandleBorderColor="#DC2626"
          maxHandleBorderColor="#EF4444"
        />
      </div>
      
      {/* Market Value Range Filter */}
      <div 
        style={{...getFilterSectionStyle('marketValue'), marginBottom: 0}}
        onMouseEnter={() => setHoveredSection('marketValue')}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <label style={getLabelStyle()}>
            {icons.marketValue}
            Market Value
          </label>
          <div style={{ 
            padding: '4px 10px',
            borderRadius: '16px',
            backgroundColor: hoveredSection === 'marketValue' ? '#EDE9FE' : '#F5F3FF',
            color: '#6D28D9',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s ease'
          }}>
            {formatCurrency(marketValueRange[0])} - {formatCurrency(marketValueRange[1])}
          </div>
        </div>
        
        {/* Market Value Dual Range Slider */}
        <DualRangeSlider
          sliderRef={valueSliderRef}
          currentRange={marketValueRange}
          totalRange={ranges.marketValue}
          onDragStart={(e, handle) => handleDragStart(e, 'value', handle)}
          formatValue={formatCurrency}
          trackColor={hoveredSection === 'marketValue' ? '#7C3AED' : '#8B5CF6'}
          minHandleBorderColor="#7C3AED"
          maxHandleBorderColor="#8B5CF6"
        />
      </div>
      
      {/* Active filters summary */}
      <div style={{
        marginTop: '24px',
        borderTop: '1px solid #F3F4F6',
        paddingTop: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center'
      }}>
        <div style={{ 
          color: '#6B7280', 
          fontSize: '13px', 
          fontWeight: '500',
          marginRight: '4px'
        }}>
          Active Filters:
        </div>
        
        {propertyType && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            backgroundColor: '#EEF2FF',
            color: '#4F46E5',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            <span>{propertyType}</span>
          </div>
        )}
        
        {(yearBuiltRange[0] !== ranges.yearBuilt[0] || yearBuiltRange[1] !== ranges.yearBuilt[1]) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            backgroundColor: '#ECFDF5',
            color: '#047857',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            <span>Year: {yearBuiltRange[0]}-{yearBuiltRange[1]}</span>
          </div>
        )}
        
        {(taxAmountRange[0] !== ranges.taxAmount[0] || taxAmountRange[1] !== ranges.taxAmount[1]) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            backgroundColor: '#FEF2F2',
            color: '#B91C1C',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            <span>Tax: {formatCurrency(taxAmountRange[0])}-{formatCurrency(taxAmountRange[1])}</span>
          </div>
        )}
        
        {(marketValueRange[0] !== ranges.marketValue[0] || marketValueRange[1] !== ranges.marketValue[1]) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            backgroundColor: '#F5F3FF',
            color: '#6D28D9',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            <span>Value: {formatCurrency(marketValueRange[0])}-{formatCurrency(marketValueRange[1])}</span>
          </div>
        )}
        
        {!propertyType && 
         yearBuiltRange[0] === ranges.yearBuilt[0] && 
         yearBuiltRange[1] === ranges.yearBuilt[1] && 
         taxAmountRange[0] === ranges.taxAmount[0] && 
         taxAmountRange[1] === ranges.taxAmount[1] && 
         marketValueRange[0] === ranges.marketValue[0] && 
         marketValueRange[1] === ranges.marketValue[1] && (
          <div style={{
            color: '#9CA3AF',
            fontSize: '13px',
            fontStyle: 'italic'
          }}>
            No active filters
          </div>
        )}
      </div>
      
      {/* Custom CSS for better visuals and interactions */}
      <style jsx>{`
        /* Hover effects for handles */
        .dual-range-slider-handle:hover {
          transform: translate(-50%, -50%) scale(1.15) !important;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15) !important;
        }
        
        /* Active state for handles */
        .dual-range-slider-handle:active {
          transform: translate(-50%, -50%) scale(1.15) !important;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2) !important;
        }
        
        /* Prevent text selection during drag */
        .dual-range-slider-track {
          user-select: none;
          -webkit-user-select: none;
        }
        
        /* Responsive styling */
        @media (max-width: 768px) {
          .dual-range-slider-handle {
            width: 24px !important;
            height: 24px !important;
          }
        }
        
        /* Fix for Firefox */
        @-moz-document url-prefix() {
          .dual-range-slider-track {
            height: 10px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PropertyFilters;