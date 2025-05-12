import React, { useState, useEffect } from 'react';
import PropertyMap from './PropertyMap';
import PropertyDetails from './PropertyDetails';

const PropertyExplorer = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/property_data.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Property data loaded:', data);
        
        if (data && Array.isArray(data.property)) {
          setProperties(data.property);
          // Select the first property by default
          if (data.property.length > 0) {
            setSelectedProperty(data.property[0]);
          }
        } else {
          console.warn('Invalid property data structure:', data);
          setProperties([]);
        }
      } catch (err) {
        console.error('Error loading property data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPropertyData();
  }, []);
  
  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
    console.log('Selected property:', property);
  };
  
  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ fontSize: '18px', color: '#4b5563' }}>
          Loading property data...
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        padding: '20px',
        backgroundColor: '#fee2e2',
        color: '#b91c1c',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Error</div>
        <div>{error}</div>
      </div>
    );
  }
  
  return (
    <div>
      <div style={{ 
        padding: '20px',
        backgroundColor: '#2563eb',
        color: 'white',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0 }}>Property Map Explorer</h1>
        <p style={{ marginTop: '10px', marginBottom: 0 }}>
          Explore property data with interactive mapping
        </p>
      </div>
      
      <PropertyMap 
        properties={properties} 
        onPropertySelect={handlePropertySelect}
      />
      
      {selectedProperty && (
        <PropertyDetails property={selectedProperty} />
      )}
    </div>
  );
};

export default PropertyExplorer;
