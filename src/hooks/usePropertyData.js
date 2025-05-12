import { useState, useEffect, useCallback } from 'react';
import { normalizePropertyData } from '../utils/propertyNormalizer';

/**
 * Custom hook for fetching and managing property data
 * @param {string} initialDataUrl - Initial data URL to load
 * @returns {Object} Property data state and control functions
 */
const usePropertyData = (initialDataUrl = null) => {
  // Removed unused rawProperties state
  const [normalizedProperties, setNormalizedProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Function to load data from a URL
  const loadData = useCallback(async (url) => {
    if (!url) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Loading property data from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Normalize the data
      const normalized = normalizePropertyData(data);
      setNormalizedProperties(normalized);
      
      console.log(`Loaded ${normalized.length} properties`);
      return normalized;
    } catch (err) {
      console.error('Error loading property data:', err);
      setError(err.message || 'Failed to load property data');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load initial data if URL is provided
  useEffect(() => {
    if (initialDataUrl) {
      loadData(initialDataUrl);
    }
  }, [initialDataUrl, loadData]);
  
  // Apply filters to properties
  const filterProperties = useCallback((filters) => {
    if (!filters || Object.keys(filters).length === 0) {
      return normalizedProperties;
    }
    
    return normalizedProperties.filter(property => {
      // Filter by property type
      if (filters.propertyType && filters.propertyType !== '' && 
          property.propertyType !== filters.propertyType) {
        return false;
      }
      
      // Filter by year built range
      if (filters.yearBuilt && filters.yearBuilt.length === 2) {
        const [minYear, maxYear] = filters.yearBuilt;
        if (property.yearBuilt < minYear || property.yearBuilt > maxYear) {
          return false;
        }
      }
      
      // Filter by tax amount range
      if (filters.taxAmount && filters.taxAmount.length === 2) {
        const [minTax, maxTax] = filters.taxAmount;
        if (property.taxAmount < minTax || property.taxAmount > maxTax) {
          return false;
        }
      }
      
      // Filter by market value range
      if (filters.marketValue && filters.marketValue.length === 2) {
        const [minValue, maxValue] = filters.marketValue;
        if (property.marketValue < minValue || property.marketValue > maxValue) {
          return false;
        }
      }
      
      // All filters passed
      return true;
    });
  }, [normalizedProperties]);
  
  return {
    properties: normalizedProperties,
    filterProperties,
    loading,
    error,
    loadData
  };
};

export default usePropertyData;
