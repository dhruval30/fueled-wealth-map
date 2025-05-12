import {
    AlertCircle,
    ArrowLeft,
    Building,
    Clock,
    Home,
    MapPin,
    Search,
    Trash2
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserSavedProperties } from '../services/api';
import PropertyDetails from './PropertyDetails';

export default function SavedProperties() {
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  useEffect(() => {
    fetchSavedProperties();
  }, []);
  
  const fetchSavedProperties = async () => {
    try {
      setLoading(true);
      const response = await getUserSavedProperties();
      setSavedProperties(response.data || []);
    } catch (err) {
      console.error('Error fetching saved properties:', err);
      setError('Failed to load saved properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredProperties = savedProperties.filter(property => {
    const address = property.address || getPropertyAddress(property.propertyData);
    return address.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  const getPropertyAddress = (property) => {
    if (!property) return 'Unknown Address';
    
    if (property.fullAddress) return property.fullAddress;
    if (property.address?.oneLine) return property.address.oneLine;
    
    let address = '';
    if (property.address?.line1) address += property.address.line1;
    
    const parts = [];
    if (property.address?.city) parts.push(property.address.city);
    if (property.address?.state) parts.push(property.address.state);
    if (property.address?.postal1) parts.push(property.address.postal1);
    
    if (parts.length > 0) {
      address += (address ? ', ' : '') + parts.join(', ');
    }
    
    return address || 'Unknown Address';
  };
  
  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Get the property value from various possible paths
  const getPropertyValue = (property) => {
    if (!property || !property.propertyData) return null;
    
    const propData = property.propertyData;
    
    // Try all possible paths for property value
    return propData.events?.assessment?.market?.mktttlvalue || 
           propData.assessment?.market?.mktttlvalue ||
           propData.assessment?.assessed?.assdttlvalue ||
           propData.sale?.amount?.saleamt || 
           property.value ||
           null;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading saved properties...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-800">Saved Properties</h1>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search saved properties..."
              value={searchTerm}
              onChange={handleSearch}
              className="py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved properties found</h3>
            {searchTerm ? (
              <p className="text-gray-500">No properties match your search term. Try a different search.</p>
            ) : (
              <p className="text-gray-500">
                You haven't saved any properties yet. Properties you save will appear here.
              </p>
            )}
            <Link 
              to="/dashboard"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map(property => (
              <div 
                key={property._id} 
                className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedProperty(property.propertyData)}
              >
                <div className="bg-gray-100 h-40 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-gray-400" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-1 truncate">
                    {getPropertyAddress(property.propertyData)}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Building className="h-4 w-4 mr-1" />
                    <span>
                      {property.propertyData?.summary?.propclass || 
                       property.propertyData?.summary?.proptype || 
                       'Property'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-sm text-gray-500">Estimated Value</div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(getPropertyValue(property))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Saved {new Date(property.savedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Property Details</h2>
              <button 
                onClick={() => setSelectedProperty(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <PropertyDetails property={selectedProperty} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}