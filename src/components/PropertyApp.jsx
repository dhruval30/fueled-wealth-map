import React, { useState, useEffect } from 'react';
import PropertyMap from './PropertyMap';
import PropertySidebar from './PropertySidebar';
import PropertyFilters from './PropertyFilters';
import PropertyDetailModal from './PropertyDetailModal';
import PropertyStatsVisualization from './PropertyStatsVisualization';
import PropertyDetailVisualization from './PropertyDetailVisualization';
import usePropertyData from '../hooks/usePropertyData';

// Main Property App component that integrates all components
const PropertyApp = () => {
  // State for selected property for modal
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  // State for filters
  const [filters, setFilters] = useState({
    propertyType: '',
    yearBuilt: [1900, 2025],
    taxAmount: [0, 1000000],
    marketValue: [0, 20000000]
  });
  
  // State for filtered properties
  const [filteredProperties, setFilteredProperties] = useState([]);
  
  // Use the custom hook to fetch and manage property data
  const { 
    properties, 
    filterProperties,
    loading, 
    error, 
    loadData 
  } = usePropertyData();
  
  // Load data on component mount
  useEffect(() => {
    loadData('/property_data.json');
  }, [loadData]);
  
  // Apply filters when properties or filters change
  useEffect(() => {
    if (properties.length > 0) {
      const filtered = filterProperties(filters);
      setFilteredProperties(filtered);
    }
  }, [properties, filters, filterProperties]);
  
  // Handle property selection for detail view
  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
    console.log('Selected property:', property);
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };
  
  // Close the property detail modal
  const handleCloseModal = () => {
    setSelectedProperty(null);
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      backgroundColor: '#F3F4F6'
    }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: '#1E40AF', 
        color: 'white', 
        padding: '16px', 
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Property Map Explorer</h1>
        </div>
      </header>
      
      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '20px', 
        width: '100%'
      }}>
        {loading ? (
          <div style={{ 
            padding: '40px', 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '18px', color: '#4B5563' }}>
              Loading property data...
            </div>
          </div>
        ) : error ? (
          <div style={{ 
            padding: '40px',
            backgroundColor: '#FEE2E2',
            color: '#B91C1C',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '18px' }}>
              Error Loading Data
            </div>
            <div>{error}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px' }}>
            {/* Sidebar with filters and stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <PropertyFilters 
                properties={properties} 
                onFilterChange={handleFilterChange} 
              />
              <PropertySidebar 
                properties={filteredProperties} 
                selectedFilters={filters} 
              />
              {selectedProperty && (
                <PropertyDetailVisualization property={selectedProperty} />
              )}
            </div>
            
            {/* Map and visualizations */}
            <div>
              <PropertyMap 
                properties={filteredProperties} 
                onPropertySelect={handlePropertySelect}
              />
              
              <PropertyStatsVisualization properties={filteredProperties} />
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer style={{ 
        backgroundColor: '#E5E7EB', 
        padding: '16px', 
        textAlign: 'center', 
        color: '#6B7280', 
        fontSize: '14px',
        marginTop: '20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          &copy; {new Date().getFullYear()} Property Map Explorer
        </div>
      </footer>
      
      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal 
          property={selectedProperty} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default PropertyApp;
