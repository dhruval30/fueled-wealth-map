import {
  AlertCircle,
  BarChart3,
  Building,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Home,
  LogOut,
  Map,
  Menu,
  PieChart,
  Plus,
  Search,
  Settings,
  Users,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Add these imports
import PropertyDetails from './PropertyDetails';
import PropertyMap from './PropertyMap';

// Import your API functions
import {
  getCompanyStats,
  getRecentActivity,
  getUserSavedProperties,
  getUserSearchHistory,
  saveProperty,
  saveUserSearch
} from '../services/api';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error'
  const [saveMessage, setSaveMessage] = useState('');
  
  // Get user info from localStorage
  const userEmail = localStorage.getItem('userEmail') || 'User';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const navigate = useNavigate();
  
  // State for dashboard data
  const [stats, setStats] = useState({
    totalProperties: 0,
    highValueProperties: 0,
    newProperties: 0,
    recentSearches: [],
    savedProperties: [],
    topOwners: [],
    recentActivity: []
  });

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data with fallbacks
      let searchHistory = { data: [] };
      let savedProperties = { data: [] };
      let companyStats = { data: { topOwners: [] } };
      let recentActivity = { data: [] };
      
      try {
        searchHistory = await getUserSearchHistory();
      } catch (err) {
        console.warn('Failed to fetch search history:', err);
      }
      
      try {
        savedProperties = await getUserSavedProperties();
      } catch (err) {
        console.warn('Failed to fetch saved properties:', err);
      }
      
      try {
        companyStats = await getCompanyStats();
      } catch (err) {
        console.warn('Failed to fetch company stats:', err);
      }
      
      try {
        recentActivity = await getRecentActivity();
      } catch (err) {
        console.warn('Failed to fetch recent activity:', err);
      }

      setStats({
        totalProperties: companyStats.data?.totalProperties || 0,
        highValueProperties: companyStats.data?.highValueProperties || 0,
        newProperties: companyStats.data?.newProperties || 0,
        recentSearches: searchHistory.data || [],
        savedProperties: savedProperties.data || [],
        topOwners: companyStats.data?.topOwners || [],
        recentActivity: recentActivity.data || []
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Some dashboard data could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySelect = async (property) => {
    setSelectedProperty(property);
    
    // Save this search
    try {
      await saveUserSearch({
        query: `Property at ${property.fullAddress || getPropertyAddress(property)}`,
        propertyId: property.identifier?.attomId || property.identifier?.Id,
        searchType: 'map_click'
      });
      
      // Refresh recent searches
      const searchHistory = await getUserSearchHistory();
      setStats(prev => ({
        ...prev,
        recentSearches: searchHistory.data || []
      }));
    } catch (err) {
      console.error('Error saving search:', err);
    }
  };

  const handleSaveProperty = async (property) => {
    setSaveStatus('saving');
    setSaveMessage('Saving property...');
    
    try {
      await saveProperty(property);
      
      // Success state
      setSaveStatus('saved');
      setSaveMessage('Property saved successfully!');
      
      // Refresh data
      await Promise.all([
        fetchDashboardData()
      ]);
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setSaveStatus(null);
        setSaveMessage('');
      }, 2000);
      
      // Close property details modal after saving
      setTimeout(() => {
        setSelectedProperty(null);
      }, 1500);
      
    } catch (err) {
      console.error('Error saving property:', err);
      setSaveStatus('error');
      setSaveMessage(err === 'Property already saved' ? 'This property is already saved' : 'Failed to save property. Please try again.');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
        setSaveMessage('');
      }, 3000);
    }
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('companyId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
    
    // Redirect to login
    navigate('/login');
  };

  const getPropertyAddress = (property) => {
    if (property.address?.oneLine) return property.address.oneLine;
    if (property.fullAddress) return property.fullAddress;
    
    let address = '';
    if (property.address?.line1) address += property.address.line1;
    
    const parts = [];
    if (property.address?.city) parts.push(property.address.city);
    if (property.address?.state) parts.push(property.address.state);
    if (property.address?.postal1) parts.push(property.address.postal1);
    
    if (parts.length > 0) {
      address += (address ? ', ' : '') + parts.join(', ');
    }
    
    return address || 'Address Unknown';
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="w-64 bg-[#003087]">
          {/* Sidebar skeleton */}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-500 mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Save Status Notification */}
      {saveStatus && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          saveStatus === 'saving' ? 'bg-blue-50 border-blue-200' :
          saveStatus === 'saved' ? 'bg-green-50 border-green-200' :
          'bg-red-50 border-red-200'
        } border flex items-center space-x-2`}>
          {saveStatus === 'saving' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
          {saveStatus === 'saved' && <CheckCircle className="h-4 w-4 text-green-600" />}
          {saveStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
          <span className={`text-sm ${
            saveStatus === 'saving' ? 'text-blue-700' :
            saveStatus === 'saved' ? 'text-green-700' :
            'text-red-700'
          }`}>
            {saveMessage}
          </span>
        </div>
      )}

      {/* Sidebar */}
      <div className={`bg-[#003087] text-white ${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-blue-900">
          {isSidebarOpen ? (
            <div className="flex items-center space-x-2">
              <Map className="h-6 w-6 text-white" />
              <span className="font-semibold text-xl">WealthMap</span>
            </div>
          ) : (
            <Map className="h-6 w-6 text-white mx-auto" />
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white hover:text-blue-200"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            <li>
              <a 
                href="/dashboard" 
                className="flex items-center px-4 py-3 text-white bg-blue-800 hover:bg-blue-700"
              >
                <Home className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3">Dashboard</span>}
              </a>
            </li>
            <li>
              <button 
                onClick={() => setShowMap(true)}
                className="w-full flex items-center px-4 py-3 text-white hover:bg-blue-800"
              >
                <Map className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3">Property Map</span>}
              </button>
            </li>
            <li>
              <a 
                href="/search" 
                className="flex items-center px-4 py-3 text-white hover:bg-blue-800"
              >
                <Search className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3">Search</span>}
              </a>
            </li>
            <li>
              <a 
                href="/analytics" 
                className="flex items-center px-4 py-3 text-white hover:bg-blue-800"
              >
                <BarChart3 className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3">Analytics</span>}
              </a>
            </li>
            
            {isAdmin && (
              <li>
                <a 
                  href="/team" 
                  className="flex items-center px-4 py-3 text-white hover:bg-blue-800"
                >
                  <Users className="h-5 w-5" />
                  {isSidebarOpen && <span className="ml-3">Team Management</span>}
                </a>
              </li>
            )}
            
            <li>
              <a 
                href="/settings" 
                className="flex items-center px-4 py-3 text-white hover:bg-blue-800"
              >
                <Settings className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3">Settings</span>}
              </a>
            </li>
          </ul>
        </nav>
        
        {/* User Section */}
        <div className="p-4 border-t border-blue-900">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center">
              <span className="text-sm font-medium">{userEmail.charAt(0).toUpperCase()}</span>
            </div>
            {isSidebarOpen && (
              <div className="ml-3">
                <p className="text-sm font-medium truncate">{userEmail}</p>
                <p className="text-xs text-blue-300">{isAdmin ? 'Administrator' : 'User'}</p>
              </div>
            )}
          </div>
          
          {isSidebarOpen && (
            <button
              onClick={handleLogout}
              className="mt-4 flex items-center text-sm text-blue-300 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden mr-2 text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search properties..."
                className="py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <span className="w-6 h-6 flex items-center justify-center text-blue-800 font-semibold">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Building className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm font-medium">Total Properties</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProperties.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Saved in company</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm font-medium">High Value Properties</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.highValueProperties.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Properties valued over $1M</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 flex items-center">
              <div className="bg-indigo-100 p-3 rounded-full mr-4">
                <PieChart className="h-6 w-6 text-indigo-700" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm font-medium">New Properties</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.newProperties}</p>
                <p className="text-sm text-gray-600">Added in the last 30 days</p>
              </div>
            </div>
          </div>
          
          {/* Map Preview & Top Owners */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Map Preview */}
            <div className="bg-white rounded-lg shadow col-span-2">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-800">Property Map</h2>
                <button 
                  onClick={() => setShowMap(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  Open Full Map
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              <div className="p-4">
                <div className="bg-gray-100 h-64 rounded flex items-center justify-center cursor-pointer" onClick={() => setShowMap(true)}>
                  <div className="text-center">
                    <Map className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Click to open interactive map</p>
                    <p className="text-sm text-gray-400 mt-1">Explore property data across the US</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Top Owners */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Top Property Owners</h2>
              </div>
              <div className="p-4">
                {stats.topOwners.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {stats.topOwners.map((owner, index) => (
                      <li key={index} className="py-3 flex justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{owner.name}</p>
                          <p className="text-sm text-gray-500">{owner.properties} properties</p>
                        </div>
                        <span className="text-sm font-semibold text-green-600">{owner.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No data available</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Searches */}
            <div className="bg-white rounded-lg shadow col-span-2">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Recent Searches</h2>
              </div>
              <div className="p-4">
                {stats.recentSearches.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {stats.recentSearches.map((search) => (
                      <li key={search._id} className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <Search className="h-5 w-5 text-gray-400 mr-3" />
                          <p className="text-sm font-medium text-gray-900">{search.query}</p>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{new Date(search.createdAt).toLocaleString()}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No recent searches</p>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Quick Actions</h2>
              </div>
              <div className="p-4">
                <ul className="space-y-3">
                  <li>
                    <button 
                      onClick={() => setShowMap(true)}
                      className="w-full flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-800"
                    >
                      <Map className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium">Explore Property Map</span>
                    </button>
                  </li>
                  <li>
                    <a href="/search" className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-800">
                      <Search className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium">New Property Search</span>
                    </a>
                  </li>
                  <li>
                    <a href="/analytics/export" className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-800">
                      <BarChart3 className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-sm font-medium">Export Analytics</span>
                    </a>
                  </li>
                  {isAdmin && (
                    <li>
                      <a href="/team/invite" className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-800">
                        <Plus className="h-5 w-5 text-purple-600 mr-3" />
                        <span className="text-sm font-medium">Invite Team Member</span>
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Property Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Property Map</h2>
              <button 
                onClick={() => setShowMap(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="h-full overflow-auto">
              <PropertyMap 
                isOpen={showMap}
                onClose={() => setShowMap(false)}
                onPropertySelect={handlePropertySelect}
                onPropertySaved={handleSaveProperty}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Property Details</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleSaveProperty(selectedProperty)}
                  disabled={saveStatus === 'saving'}
                  className={`px-3 py-1 text-sm rounded transition-all ${
                    saveStatus === 'saved' 
                      ? 'bg-green-600 text-white cursor-default' 
                      : saveStatus === 'saving'
                      ? 'bg-blue-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {saveStatus === 'saving' && <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></span>}
                  {saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'saving' ? 'Saving...' : 'Save Property'}
                </button>
                <button 
                  onClick={() => setSelectedProperty(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
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