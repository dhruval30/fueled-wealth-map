import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookmarkIcon,
  Building,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Globe,
  HelpCircle,
  Home,
  Info,
  LogOut,
  Map,
  MapPin,
  Menu,
  PieChart,
  Plus,
  Search,
  Settings,
  TrendingUp,
  User,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Lazy load non-critical components
const PropertyDetails = lazy(() => import('./PropertyDetails'));
const PropertyMap = lazy(() => import('./PropertyMap'));

// Import only the API functions we need
import {
  getCompanyStats,
  getPropertyById,
  getRecentActivity,
  getUserSavedProperties,
  getUserSearchHistory,
  saveProperty,
  saveUserSearch
} from '../services/api';

// Breadcrumb navigation component
const BreadcrumbNav = ({ items, onNavigate }) => (
  <nav className="flex items-center space-x-2 text-sm">
    {items.map((item, index) => (
      <React.Fragment key={item.label}>
        {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
        <button 
          onClick={() => onNavigate(item.path)}
          className={`hover:text-blue-600 transition-colors ${
            index === items.length - 1 
              ? 'font-medium text-gray-900' 
              : 'text-gray-500'
          }`}
        >
          {item.label}
        </button>
      </React.Fragment>
    ))}
  </nav>
);

// Section header component with help text
const SectionHeader = ({ title, description, icon: Icon }) => (
  <div className="flex items-start mb-4">
    <div className="bg-blue-100 p-2 rounded-md mr-3">
      <Icon className="h-5 w-5 text-blue-600" />
    </div>
    <div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  </div>
);

export default function Dashboard() {
  // Navigation state
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [viewTitle, setViewTitle] = useState('Dashboard');
  const [helpText, setHelpText] = useState({});
  const [showHelp, setShowHelp] = useState(false);
  
  // Dashboard content state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchRefreshTimer, setSearchRefreshTimer] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [mapInitialState, setMapInitialState] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState({
    totalProperties: 0,
    highValueProperties: 0,
    newProperties: 0,
    recentSearches: [],
    savedProperties: [],
    topOwners: [],
    recentActivity: []
  });
  const [filteredItems, setFilteredItems] = useState({
    searches: [],
    activities: []
  });

  // Get user info from localStorage
  const userEmail = localStorage.getItem('userEmail') || 'User';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const navigate = useNavigate();

  // Navigation handlers
  const navigateTo = useCallback((path, title, addToHistory = true) => {
    if (addToHistory) {
      setNavigationHistory(prev => [...prev, { path: currentView, title: viewTitle }]);
    }
    setCurrentView(path);
    setViewTitle(title);
  }, [currentView, viewTitle]);
  
  const goBack = useCallback(() => {
    if (navigationHistory.length > 0) {
      const prevView = navigationHistory[navigationHistory.length - 1];
      setCurrentView(prevView.path);
      setViewTitle(prevView.title);
      setNavigationHistory(prev => prev.slice(0, -1));
    }
  }, [navigationHistory]);
  
  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);
  
  // Get breadcrumbs for current view
  const getBreadcrumbs = useCallback(() => {
    const basePath = [{ label: 'Home', path: 'dashboard' }];
    
    if (currentView === 'dashboard') {
      return basePath;
    }
    
    if (currentView === 'map') {
      return [...basePath, { label: 'Property Map', path: 'map' }];
    }
    
    if (currentView === 'analytics') {
      return [...basePath, { label: 'Analytics', path: 'analytics' }];
    }
    
    if (currentView === 'properties') {
      return [...basePath, { label: 'Saved Properties', path: 'properties' }];
    }
    
    return basePath;
  }, [currentView]);
  
  // Define help text for different sections
  useEffect(() => {
    setHelpText({
      dashboard: "This is your overview dashboard showing key metrics, recent properties, and quick access to common tasks.",
      properties: "View and manage all saved properties in your portfolio.",
      map: "Explore properties geographically and search for new opportunities.",
      analytics: "Get insights and statistical data about your property portfolio."
    });
  }, []);

  // Account/app management
  const handleLogout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('companyId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
    navigate('/login');
  }, [navigate]);

  // Data formatting helpers
  const formatNumber = useCallback((num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    } else {
      return num.toString();
    }
  }, []);

  const getPropertyAddress = useCallback((property) => {
    if (!property) return 'Unknown Address';
    
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
    
    return address || 'Unknown Address';
  }, []);

  // Data filtering
  const filterItems = useCallback((items, query) => {
    if (!query) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(item => {
      if (item.query) {
        return item.query.toLowerCase().includes(lowerQuery);
      } else if (item.action) {
        return item.action.toLowerCase().includes(lowerQuery);
      }
      return false;
    });
  }, []);

  // Data fetching
  const refreshDashboardData = useCallback(async () => {
    try {
      // Only refresh the searches, not the entire dashboard
      const searchHistory = await getUserSearchHistory();
      setStats(prev => ({
        ...prev,
        recentSearches: searchHistory.data?.slice(0, 5) || []
      }));
      
      console.log("Dashboard data refreshed to get updated street view images");
    } catch (err) {
      console.error('Error refreshing dashboard data:', err);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use Promise.allSettled to fetch data in parallel and handle partial failures
      const [
        searchHistoryResult, 
        savedPropertiesResult, 
        companyStatsResult, 
        recentActivityResult
      ] = await Promise.allSettled([
        getUserSearchHistory(),
        getUserSavedProperties(),
        getCompanyStats(),
        getRecentActivity()
      ]);
      
      // Process results and handle errors for each request independently
      const searchHistory = searchHistoryResult.status === 'fulfilled' 
        ? searchHistoryResult.value.data?.slice(0, 5) || [] 
        : [];
        
      const savedProperties = savedPropertiesResult.status === 'fulfilled' 
        ? savedPropertiesResult.value.data?.slice(0, 3) || [] 
        : [];
        
      const companyStats = companyStatsResult.status === 'fulfilled' 
        ? companyStatsResult.value.data || { topOwners: [] } 
        : { topOwners: [] };
        
      const recentActivity = recentActivityResult.status === 'fulfilled' 
        ? recentActivityResult.value.data?.slice(0, 5) || [] 
        : [];
      
      // Check if we have partial failure and set error
      const hasPartialFailure = [
        searchHistoryResult, 
        savedPropertiesResult, 
        companyStatsResult, 
        recentActivityResult
      ].some(result => result.status === 'rejected');
      
      if (hasPartialFailure) {
        setError('Some dashboard data could not be loaded');
      } else {
        setError(null);
      }

      // Update stats with all available data, even if some requests failed
      setStats({
        totalProperties: companyStats.totalProperties || 0,
        highValueProperties: companyStats.highValueProperties || 0,
        newProperties: companyStats.newProperties || 0,
        recentSearches: searchHistory,
        savedProperties: savedProperties,
        topOwners: companyStats.topOwners || [],
        recentActivity: recentActivity
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Some dashboard data could not be loaded');
    } finally {
      setLoading(false);
    }
  }, []);

  // Property handlers
  const handlePropertySelect = useCallback(async (property) => {
    setSelectedProperty(property);
    
    // Get property coordinates
    const propertyLatitude = 
      property.location?.latitude || 
      property.address?.latitude || 
      (property.address?.location?.geometry?.coordinates && property.address.location.geometry.coordinates[1]);
    
    const propertyLongitude = 
      property.location?.longitude || 
      property.address?.longitude ||
      (property.address?.location?.geometry?.coordinates && property.address.location.geometry.coordinates[0]);
    
    // Check if this property is already in recent searches to avoid duplicates
    const propertyId = property.identifier?.attomId || property.identifier?.Id || property.attomId;
    const isAlreadyInSearches = stats.recentSearches.some(search => 
      search.propertyId === propertyId || 
      search.query === `Property at ${property.fullAddress || getPropertyAddress(property)}`
    );
    
    // Only save search if it's not already in recent searches
    if (!isAlreadyInSearches && propertyId) {
      try {
        // Save this search with property data
        await saveUserSearch({
          query: `Property at ${property.fullAddress || getPropertyAddress(property)}`,
          propertyId: propertyId,
          searchType: 'map_click',
          results: {
            count: 1,
            properties: [property] // Include the full property data
          }
        });
        
        // Start a timer to refresh search data in 10 seconds to get the street view image
        if (searchRefreshTimer) {
          clearTimeout(searchRefreshTimer);
        }
        
        const timer = setTimeout(() => {
          refreshDashboardData();
        }, 10000); // 10 seconds
        
        setSearchRefreshTimer(timer);
        
      } catch (err) {
        console.error('Error saving search:', err);
      }
    }
  }, [stats.recentSearches, searchRefreshTimer, refreshDashboardData, getPropertyAddress]);

  const handleSaveProperty = useCallback(async (property) => {
    setSaveStatus('saving');
    setSaveMessage('Saving property...');
    
    try {
      await saveProperty(property);
      
      // Success state
      setSaveStatus('saved');
      setSaveMessage('Property saved successfully!');
      
      // Refresh data
      await fetchDashboardData();
      
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
      setSaveMessage(err === 'Property already saved' ? 'This property is already saved' : 'Failed to save property');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
        setSaveMessage('');
      }, 3000);
    }
  }, [fetchDashboardData]);

  const handleSearchClick = useCallback(async (search) => {
    // Check if the search has a street view image
    const streetViewImage = search.streetViewImage;
    
    // Check if this search has property data already
    if (search.propertyId && search.results?.properties?.length > 0) {
      // We have full property data in the search results
      const propertyData = search.results.properties[0];
      
      // Add the street view image to the property data if available
      if (streetViewImage) {
        propertyData.streetViewImage = streetViewImage;
      }
      
      // Get coordinates
      const latitude = 
        propertyData.location?.latitude || 
        propertyData.address?.latitude || 
        (propertyData.address?.location?.geometry?.coordinates && propertyData.address.location.geometry.coordinates[1]) || 
        40.7128; // Default to New York City if no coordinates found
      
      const longitude = 
        propertyData.location?.longitude || 
        propertyData.address?.longitude || 
        (propertyData.address?.location?.geometry?.coordinates && propertyData.address.location.geometry.coordinates[0]) || 
        -74.0060; // Default to New York City if no coordinates found
      
      // Set initial state for the map
      setMapInitialState({
        property: propertyData,
        latitude: latitude,
        longitude: longitude,
        showPopup: true
      });
      
      // Also select the property to show details
      setSelectedProperty(propertyData);
      
      // Open the map
      setShowMap(true);
    } else if (search.propertyId) {
      // We only have the ID but not the full data, we need to fetch it
      try {
        setLoading(true);
        
        // Get property by ID
        const propertyData = await getPropertyById(search.propertyId);
        
        if (propertyData) {
          // Add the street view image to the property data if available
          if (streetViewImage) {
            propertyData.streetViewImage = streetViewImage;
          }
          
          // Get coordinates
          const latitude = 
            propertyData.location?.latitude || 
            propertyData.address?.latitude || 
            (propertyData.address?.location?.geometry?.coordinates && propertyData.address.location.geometry.coordinates[1]) || 
            40.7128; // Default to New York City if no coordinates found
          
          const longitude = 
            propertyData.location?.longitude || 
            propertyData.address?.longitude || 
            (propertyData.address?.location?.geometry?.coordinates && propertyData.address.location.geometry.coordinates[0]) || 
            -74.0060; // Default to New York City if no coordinates found
          
          // Set initial state for the map
          setMapInitialState({
            property: propertyData,
            latitude: latitude,
            longitude: longitude,
            showPopup: true
          });
          
          // Also select the property to show details
          setSelectedProperty(propertyData);
        }
        
        // Open the map
        setShowMap(true);
      } catch (error) {
        console.error('Error fetching property data:', error);
        // Show error or open map without initial state
        setShowMap(true);
      } finally {
        setLoading(false);
      }
    } else {
      // Just a text search with no specific property, just open the map
      setShowMap(true);
    }
  }, []);

  // UI components
  const NavLink = useCallback(({ icon: Icon, label, to, isActive, onClick }) => (
    <li>
      {to ? (
        <Link 
          to={to} 
          className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
            isActive 
              ? 'bg-blue-700 text-white' 
              : 'text-white hover:bg-blue-800/50'
          }`}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          {isSidebarOpen && <span className="ml-3 whitespace-nowrap">{label}</span>}
        </Link>
      ) : (
        <button 
          onClick={onClick}
          className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
            isActive 
              ? 'bg-blue-700 text-white' 
              : 'text-white hover:bg-blue-800/50'
          }`}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          {isSidebarOpen && <span className="ml-3 whitespace-nowrap">{label}</span>}
        </button>
      )}
    </li>
  ), [isSidebarOpen]);

  // Effects
  useEffect(() => {
    fetchDashboardData();
    
    // Handle responsive sidebar
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (searchRefreshTimer) {
        clearTimeout(searchRefreshTimer);
      }
    };
  }, [fetchDashboardData, searchRefreshTimer]);

  // Update filtered items when stats or search query changes
  useEffect(() => {
    setFilteredItems({
      searches: filterItems(stats.recentSearches, searchQuery),
      activities: filterItems(stats.recentActivity, searchQuery)
    });
  }, [stats.recentSearches, stats.recentActivity, searchQuery, filterItems]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="w-20 bg-gradient-to-b from-blue-900 to-blue-950">
          <div className="h-16 bg-blue-900 border-b border-blue-800/50"></div>
          <div className="p-4 flex flex-col space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-blue-800/30 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="h-16 bg-white shadow-sm"></div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse"></div>
              ))}
            </div>
            <div className="h-64 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse mb-6"></div>
            <div className="h-48 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
          <div className="text-center mb-6">
            <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600">{error}</p>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md"
          >
            Retry Loading Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // Destructure filtered items for cleaner JSX
  const { searches: filteredSearches, activities: filteredActivity } = filteredItems;
  
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Save Status Notification */}
      {saveStatus && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl ${
          saveStatus === 'saving' ? 'bg-blue-50 border-blue-200' :
          saveStatus === 'saved' ? 'bg-green-50 border-green-200' :
          'bg-red-50 border-red-200'
        } border flex items-center space-x-2 animate-fade-in-down`}>
          {saveStatus === 'saving' && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>}
          {saveStatus === 'saved' && <CheckCircle className="h-5 w-5 text-green-600" />}
          {saveStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
          <span className={`text-sm font-medium ${
            saveStatus === 'saving' ? 'text-blue-700' :
            saveStatus === 'saved' ? 'text-green-700' :
            'text-red-700'
          }`}>
            {saveMessage}
          </span>
        </div>
      )}

      {/* Sidebar */}
      <div 
        className={`fixed lg:relative bg-gradient-to-b from-blue-900 to-blue-950 text-white h-full transition-all duration-300 ease-in-out z-30 
                    ${isSidebarOpen ? 'w-64' : 'w-20'} shadow-xl`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-blue-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
              <Globe className="h-6 w-6 text-blue-900" />
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-xl tracking-tight">WealthMap</span>
            )}
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white hover:text-blue-300 transition-colors"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="pt-5 pb-3 px-3">
          <p className={`text-xs text-blue-300/80 uppercase font-semibold px-3 mb-2 ${!isSidebarOpen && 'sr-only'}`}>General</p>
          <ul className="space-y-1">
            <NavLink 
              icon={Home} 
              label="Dashboard" 
              to="/dashboard" 
              isActive={currentView === 'dashboard'} 
            />
            <NavLink 
              icon={Map} 
              label="Property Map" 
              onClick={() => navigateTo('map', 'Property Map')} 
              isActive={currentView === 'map'} 
            />
            <NavLink 
              icon={Search} 
              label="Search" 
              to="/search" 
              isActive={false} 
            />
            <NavLink 
              icon={BarChart3} 
              label="Analytics" 
              to="/analytics" 
              isActive={false} 
            />
          </ul>
          
          <p className={`text-xs text-blue-300/80 uppercase font-semibold px-3 mb-2 mt-6 ${!isSidebarOpen && 'sr-only'}`}>Content</p>
          <ul className="space-y-1">
            <NavLink 
              icon={BookmarkIcon} 
              label="Saved Properties" 
              to="/saved-properties" 
              isActive={false} 
            />
            {isAdmin && (
              <NavLink 
                icon={Users} 
                label="Team Management" 
                to="/team" 
                isActive={false} 
              />
            )}
            <NavLink 
              icon={Settings} 
              label="Settings" 
              to="/settings" 
              isActive={false} 
            />
          </ul>
        </nav>
        
        {/* User Section */}
        <div className="absolute bottom-0 w-full border-t border-blue-800/50 bg-blue-900/20 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
              <span className="text-sm font-bold">{userEmail.charAt(0).toUpperCase()}</span>
            </div>
            {isSidebarOpen && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate">{userEmail}</p>
                <p className="text-xs text-blue-300">{isAdmin ? 'Administrator' : 'User'}</p>
              </div>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className={`mt-4 flex items-center ${isSidebarOpen ? 'w-full' : 'justify-center'} rounded-lg bg-blue-800/30 hover:bg-blue-800/50 text-sm font-medium px-3 py-2 text-blue-100 hover:text-white transition-all`}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto relative">
        {/* Top Header with Back Button and Breadcrumbs */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden mr-4 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="flex items-center space-x-4">
                {navigationHistory.length > 0 && (
                  <button 
                    onClick={goBack}
                    className="bg-white p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                
                <h1 className="text-2xl font-bold text-gray-800">{viewTitle}</h1>
                
                <div className="hidden md:block ml-2">
                  <BreadcrumbNav 
                    items={getBreadcrumbs()}
                    onNavigate={(path) => navigateTo(path, path === 'dashboard' ? 'Dashboard' : 
                                             path === 'map' ? 'Property Map' : 
                                             path === 'analytics' ? 'Analytics' : 'Saved Properties')} 
                  />
                </div>
                
                <button 
                  onClick={toggleHelp}
                  className="ml-2 p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                  aria-label="Show help"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
              <input
                 type="text"
                 placeholder="Search properties..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
               />
               <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
             </div>
             
             <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md text-white">
               <span className="text-sm font-bold">{userEmail.charAt(0).toUpperCase()}</span>
             </div>
           </div>
         </div>
         
         {/* Show help text tooltip */}
         {showHelp && (
           <div className="mx-4 mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
             <div className="flex items-start">
               <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
               <div>
                 <h4 className="text-sm font-medium text-blue-800">Help: {viewTitle}</h4>
                 <p className="text-sm text-blue-700 mt-1">{helpText[currentView] || "Navigate through your dashboard using the menu on the left or the navigation options here."}</p>
               </div>
               <button 
                 onClick={toggleHelp}
                 className="ml-auto p-1 text-blue-500 hover:text-blue-700"
               >
                 <X className="h-4 w-4" />
               </button>
             </div>
           </div>
         )}
         
         {/* Mobile search */}
         <div className="px-4 pb-2 md:hidden">
           <div className="relative">
             <input
               type="text"
               placeholder="Search properties..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
             />
             <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
           </div>
         </div>
         
         {/* Mobile breadcrumbs for better navigation */}
         <div className="md:hidden px-4 pb-2 overflow-x-auto hide-scrollbar">
           <BreadcrumbNav 
             items={getBreadcrumbs()}
             onNavigate={(path) => navigateTo(path, path === 'dashboard' ? 'Dashboard' : 
                                    path === 'map' ? 'Property Map' : 
                                    path === 'analytics' ? 'Analytics' : 'Saved Properties')} 
           />
         </div>
         
         {/* Navigation Tabs - only show when in dashboard view */}
         {currentView === 'dashboard' && (
           <div className="px-4 pb-0 border-b border-gray-200">
             <nav className="flex space-x-6 overflow-x-auto hide-scrollbar">
               <button
                 onClick={() => setActiveSection('overview')}
                 className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                   activeSection === 'overview' 
                     ? 'border-blue-600 text-blue-600' 
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 }`}
               >
                 Overview
               </button>
               <button
                 onClick={() => setActiveSection('activity')}
                 className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                   activeSection === 'activity' 
                     ? 'border-blue-600 text-blue-600' 
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 }`}
               >
                 Recent Activity
               </button>
               <button
                 onClick={() => setActiveSection('analytics')}
                 className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                   activeSection === 'analytics' 
                     ? 'border-blue-600 text-blue-600' 
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 }`}
               >
                 Analytics
               </button>
             </nav>
           </div>
         )}
       </header>
       
       {/* Dashboard Content with Contextual Navigation */}
       <div className="p-4 md:p-6 pb-24">
         {/* Conditional rendering based on current view */}
         {currentView === 'dashboard' && (
           <div className="space-y-6">
             {/* Show section headers with descriptive text */}
             {activeSection === 'overview' && (
               <>
                 <SectionHeader 
                   title="Dashboard Overview" 
                   description="View key metrics and quick access to your property data"
                   icon={Home}
                 />
               
                 {/* Welcome back section - only on large screens */}
                 <div className="hidden md:block p-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg text-white mb-8">
                   <div className="flex justify-between items-start">
                     <div>
                       <h2 className="text-2xl font-bold mb-1">Welcome back, {userEmail.split('@')[0]}</h2>
                       <p className="text-blue-100">Here's what's happening with your property portfolio today.</p>
                     </div>
                     <button 
                       onClick={() => navigateTo('map', 'Property Map')}
                       className="px-5 py-2.5 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-md flex items-center"
                     >
                       <Map className="h-4 w-4 mr-2" />
                       Explore Map
                     </button>
                   </div>
                 </div>
               
                 {/* Stat Cards */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                   <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4">
                       <div className="bg-blue-100 p-3 rounded-lg">
                         <Building className="h-6 w-6 text-blue-600" />
                       </div>
                       <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                         <TrendingUp className="h-3 w-3 mr-1" />
                         <span>+12% last month</span>
                       </div>
                     </div>
                     <h3 className="text-gray-500 text-sm font-medium mb-1">Total Properties</h3>
                     <div className="flex items-baseline">
                       <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalProperties)}</p>
                       <span className="ml-2 text-sm text-gray-500">properties</span>
                     </div>
                   </div>
                   
                   <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4">
                       <div className="bg-green-100 p-3 rounded-lg">
                         <DollarSign className="h-6 w-6 text-green-600" />
                       </div>
                       <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                         <span>High value assets</span>
                       </div>
                     </div>
                     <h3 className="text-gray-500 text-sm font-medium mb-1">Premium Properties</h3>
                     <div className="flex items-baseline">
                       <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.highValueProperties)}</p>
                       <span className="ml-2 text-sm text-gray-500">over $1M</span>
                     </div>
                   </div>
                   
                   <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4">
                       <div className="bg-purple-100 p-3 rounded-lg">
                         <Calendar className="h-6 w-6 text-purple-600" />
                       </div>
                       <div className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                         <Clock className="h-3 w-3 mr-1" />
                         <span>Last 30 days</span>
                       </div>
                     </div>
                     <h3 className="text-gray-500 text-sm font-medium mb-1">New Properties</h3>
                     <div className="flex items-baseline">
                       <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.newProperties)}</p>
                       <span className="ml-2 text-sm text-gray-500">properties added</span>
                     </div>
                   </div>
                   
                   <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4">
                       <div className="bg-amber-100 p-3 rounded-lg">
                         <User className="h-6 w-6 text-amber-600" />
                       </div>
                       <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                         <span>Key individuals</span>
                       </div>
                     </div>
                     <h3 className="text-gray-500 text-sm font-medium mb-1">Top Owners</h3>
                     <div className="flex items-baseline">
                       <p className="text-3xl font-bold text-gray-900">{stats.topOwners.length}</p>
                       <span className="ml-2 text-sm text-gray-500">premium owners</span>
                     </div>
                   </div>
                 </div>
                 
                 {/* Map Preview & Top Owners */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   {/* Map Preview */}
                   <div className="bg-white rounded-xl shadow-sm col-span-2 border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                     <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                       <h2 className="text-lg font-medium text-gray-800 flex items-center">
                         <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                         Property Map
                       </h2>
                       <button 
                         onClick={() => navigateTo('map', 'Property Map')}
                         className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                       >
                         Open Full Map
                         <ChevronRight className="h-4 w-4 ml-1" />
                       </button>
                     </div>
                     <div className="p-4">
                       <div 
                         className="bg-gradient-to-br from-blue-50 to-gray-50 h-64 rounded-lg flex items-center justify-center cursor-pointer relative overflow-hidden group" 
                         onClick={() => navigateTo('map', 'Property Map')}
                       >
                         {/* Map background */}
                         <div className="absolute inset-0 opacity-20" 
                           style={{
                             backgroundImage: 'linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)',
                             backgroundSize: '20px 20px'
                           }} 
                         />
                         
                         {/* Decorative pins */}
                         <div className="absolute left-1/4 top-1/3 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                         <div className="absolute right-1/3 top-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                         <div className="absolute right-1/4 bottom-1/3 w-3 h-3 bg-green-500 rounded-full"></div>
                         
                         {/* Map center content */}
                         <div className="text-center z-10">
                           <Map className="h-12 w-12 text-blue-600 mx-auto mb-3 drop-shadow-md" />
                           <p className="text-gray-800 font-medium mb-1">Interactive Property Map</p>
                           <p className="text-sm text-gray-500">Explore property ownership data across the US</p>
                           <button className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm group-hover:shadow-md">
                             Open Map
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
                   
                   {/* Top Owners */}
                   <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                     <div className="p-4 border-b border-gray-100 flex items-center">
                       <User className="h-5 w-5 mr-2 text-blue-600" />
                       <h2 className="text-lg font-medium text-gray-800">Top Property Owners</h2>
                     </div>
                     <div className="p-4">
                       {stats.topOwners.length > 0 ? (
                         <ul className="divide-y divide-gray-100">
                           {stats.topOwners.map((owner, index) => (
                             <li key={index} className="py-3 flex justify-between items-center">
                               <div className="flex items-start space-x-3">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium ${
                                   index === 0 ? 'bg-yellow-500' : 
                                   index === 1 ? 'bg-gray-400' : 
                                   index === 2 ? 'bg-amber-700' : 'bg-blue-500'
                                 }`}>
                                   {index + 1}
                                 </div>
                                 <div>
                                   <p className="text-sm font-medium text-gray-900">{owner.name}</p>
                                   <p className="text-xs text-gray-500">{owner.properties} properties</p>
                                 </div>
                               </div>
                               <span className="text-sm font-semibold text-green-600">{owner.value}</span>
                             </li>
                           ))}
                         </ul>
                       ) : (
                         <div className="py-8 text-center">
                           <User className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                           <p className="text-gray-500 text-sm">No data available</p>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
                 
                 {/* Recent Activity & Quick Actions */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   {/* Recent Searches */}
                   <div className="bg-white rounded-xl shadow-sm col-span-2 border border-gray-100 hover:shadow-md transition-shadow">
                     <div className="p-4 border-b border-gray-100 flex items-center">
                       <Search className="h-5 w-5 mr-2 text-blue-600" />
                       <h2 className="text-lg font-medium text-gray-800">Recent Searches</h2>
                     </div>
                     <div className="p-4">
                       {filteredSearches.length > 0 ? (
                         <ul className="divide-y divide-gray-100">
                           {filteredSearches.map((search) => {
                             // Use the streetViewImage URL directly from the API
                             const streetViewImage = search.streetViewImage;
                             
                             return (
                               <li 
                                 key={search._id} 
                                 className="py-3 flex justify-between items-center hover:bg-gray-50 cursor-pointer rounded-lg px-3 transition-colors"
                                 onClick={() => handleSearchClick(search)}
                               >
                                 <div className="flex items-center">
                                   {streetViewImage ? (
                                     <div className="w-16 h-12 rounded-lg mr-3 overflow-hidden bg-gray-100 flex-shrink-0">
                                       <img 
                                         src={streetViewImage} 
                                         alt="Street View" 
                                         className="w-full h-full object-cover"
                                         onError={(e) => {
                                           console.log("Image failed to load:", streetViewImage);
                                           e.target.style.display = 'none';
                                           e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-gray-400 text-xs">No image</span></div>';
                                         }}
                                       />
                                     </div>
                                   ) : (
                                     <div className="bg-blue-100 p-2 rounded-lg mr-3 w-16 h-12 flex items-center justify-center flex-shrink-0">
                                       <Search className="h-4 w-4 text-blue-600" />
                                     </div>
                                   )}
                                   <div>
                                     <p className="text-sm font-medium text-gray-900 line-clamp-1">{search.query}</p>
                                     {search.propertyId && (
                                       <p className="text-xs text-gray-500">Property ID: {search.propertyId}</p>
                                     )}
                                   </div>
                                 </div>
                                 <div className="flex items-center text-xs text-gray-500 whitespace-nowrap ml-4">
                                   <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                   <span>{new Date(search.createdAt).toLocaleDateString()}</span>
                                 </div>
                               </li>
                             );
                           })}
                         </ul>
                       ) : (
                         <div className="py-8 text-center">
                           <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                           <p className="text-gray-500 text-sm">
                             {searchQuery ? 'No matching searches found' : 'No recent searches'}
                           </p>
                         </div>
                       )}
                     </div>
                   </div>
                   
                   {/* Quick Actions */}
                   <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                     <div className="p-4 border-b border-gray-100 flex items-center">
                       <Plus className="h-5 w-5 mr-2 text-blue-600" />
                       <h2 className="text-lg font-medium text-gray-800">Quick Actions</h2>
                     </div>
                     <div className="p-4">
                       <ul className="space-y-3">
                         <li>
                           <button 
                             onClick={() => navigateTo('map', 'Property Map')}
                             className="w-full flex items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg text-gray-800 transition-colors"
                           >
                             <Map className="h-5 w-5 text-blue-600 mr-3" />
                             <span className="text-sm font-medium">Explore Property Map</span>
                           </button>
                         </li>
                         <li>
                           <Link to="/search" className="w-full flex items-center p-3 bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 rounded-lg text-gray-800 transition-colors">
                             <Search className="h-5 w-5 text-indigo-600 mr-3" />
                             <span className="text-sm font-medium">New Property Search</span>
                           </Link>
                         </li>
                         <li>
                           <Link to="/analytics/export" className="w-full flex items-center p-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg text-gray-800 transition-colors">
                             <BarChart3 className="h-5 w-5 text-green-600 mr-3" />
                             <span className="text-sm font-medium">Export Analytics</span>
                           </Link>
                         </li>
                         {isAdmin && (
                           <li>
                             <Link to="/team/invite" className="w-full flex items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg text-gray-800 transition-colors">
                               <UserPlus className="h-5 w-5 text-purple-600 mr-3" />
                               <span className="text-sm font-medium">Invite Team Member</span>
                             </Link>
                           </li>
                         )}
                       </ul>
                     </div>
                   </div>
                 </div>
               </>
             )}
             
             
             {activeSection === 'activity' && (
               <>
                 <SectionHeader 
                   title="Recent Activity" 
                   description="Track recent searches, saved properties, and team activity"
                   icon={Clock}
                 />
                 
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                   <div className="p-4 border-b border-gray-100 flex items-center">
                     <Clock className="h-5 w-5 mr-2 text-blue-600" />
                     <h2 className="text-lg font-medium text-gray-800">Recent Activity</h2>
                   </div>
                   <div className="p-4">
                     {filteredActivity.length > 0 ? (
                       <ul className="divide-y divide-gray-100">
                         {filteredActivity.map((activity) => (
                           <li key={activity._id} className="py-3">
                             <div className="flex space-x-3">
                               <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center ${
                                 activity.type === 'search' 
                                   ? 'bg-blue-100 text-blue-600' 
                                   : 'bg-green-100 text-green-600'
                               }`}>
                                 {activity.type === 'search' ? <Search className="h-4 w-4" /> : <BookmarkIcon className="h-4 w-4" />}
                               </div>
                               <div>
                                 <p className="text-sm text-gray-900">{activity.action}</p>
                                 <div className="flex items-center mt-1 text-xs text-gray-500">
                                   <Clock className="h-3 w-3 mr-1" />
                                   <span>{new Date(activity.timestamp).toLocaleString()}</span>
                                 </div>
                               </div>
                             </div>
                           </li>
                         ))}
                       </ul>
                     ) : (
                       <div className="py-8 text-center">
                         <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                         <p className="text-gray-500 text-sm">
                           {searchQuery ? 'No matching activity found' : 'No recent activity'}
                         </p>
                       </div>
                     )}
                   </div>
                 </div>
                 
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
                   <div className="p-4 border-b border-gray-100 flex items-center">
                     <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                     <h2 className="text-lg font-medium text-gray-800">Activity Timeline</h2>
                   </div>
                   <div className="p-4 relative">
                     <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-200"></div>
                     
                     {stats.recentActivity.length > 0 ? (
                       <div className="space-y-6 relative">
                         {stats.recentActivity.slice(0, 4).map((activity, index) => (
                           <div key={index} className="flex items-start ml-2">
                             <div className={`absolute left-6 w-4 h-4 rounded-full border-2 border-white ${
                               activity.type === 'search' ? 'bg-blue-500' : 'bg-green-500'
                             }`}></div>
                             <div className="ml-10">
                               <p className="text-sm text-gray-900">{activity.action}</p>
                               <p className="text-xs text-gray-500 mt-0.5">
                                 {new Date(activity.timestamp).toLocaleString()}
                               </p>
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="py-8 text-center">
                         <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                         <p className="text-gray-500 text-sm">No timeline activity</p>
                       </div>
                     )}
                   </div>
                 </div>
                 
                 {/* Contextual navigation */}
                 <div className="mt-6 flex justify-end">
                   <Link 
                     to="/saved-properties" 
                     className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
                   >
                     View Saved Properties
                     <ArrowRight className="h-4 w-4 ml-2" />
                   </Link>
                 </div>
               </>
             )}
             
             {activeSection === 'analytics' && (
               <>
                 <SectionHeader 
                   title="Analytics & Insights" 
                   description="Analyze your property data and visualize market trends"
                   icon={BarChart3}
                 />
                 
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                   <div className="p-4 border-b border-gray-100 flex items-center">
                     <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                     <h2 className="text-lg font-medium text-gray-800">Property Analytics</h2>
                   </div>
                   <div className="p-4 text-center">
                     <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-12">
                       <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                       <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                       <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                         Access detailed property analytics, market trends, and investment insights to make data-driven decisions.
                       </p>
                       <Link 
                         to="/analytics"
                         className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                       >
                         View Full Analytics
                       </Link>
                     </div>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                     <div className="p-4 border-b border-gray-100 flex items-center">
                       <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                       <h2 className="text-lg font-medium text-gray-800">Property Distribution</h2>
                     </div>
                     <div className="p-4 h-64 flex items-center justify-center">
                       <div className="text-center">
                         <PieChart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                         <p className="text-gray-500 text-sm">Property type distribution chart will appear here</p>
                       </div>
                     </div>
                   </div>
                   
                   <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                   <div className="p-4 border-b border-gray-100 flex items-center">
                       <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                       <h2 className="text-lg font-medium text-gray-800">Value Trends</h2>
                     </div>
                     <div className="p-4 h-64 flex items-center justify-center">
                       <div className="text-center">
                         <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                         <p className="text-gray-500 text-sm">Property value trends chart will appear here</p>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Contextual navigation */}
                 <div className="mt-6 flex justify-end">
                   <Link 
                     to="/analytics/export" 
                     className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
                   >
                     Export Analytics Data
                     <ArrowRight className="h-4 w-4 ml-2" />
                   </Link>
                 </div>
               </>
             )}
           </div>
         )}
         
         {currentView === 'map' && (
           <div className="h-full">
             <SectionHeader 
               title="Interactive Property Map" 
               description="Explore properties geographically and search for opportunities"
               icon={Map}
             />
             
             {/* Full page map implementation */}
             <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[calc(100vh-220px)]">
               <Suspense fallback={
                 <div className="h-full flex items-center justify-center bg-gray-50">
                   <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                   <p className="ml-3 text-gray-600">Loading map...</p>
                 </div>
               }>
                 <PropertyMap 
                   isOpen={true}
                   onPropertySelect={handlePropertySelect}
                   onPropertySaved={handleSaveProperty}
                   initialState={mapInitialState}
                 />
               </Suspense>
             </div>
             
             {/* Add contextual navigation buttons */}
             <div className="mt-4 flex justify-between">
               <button
                 onClick={() => navigateTo('dashboard', 'Dashboard')}
                 className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
               >
                 <ArrowLeft className="h-4 w-4 mr-2" />
                 Back to Dashboard
               </button>
               
               <Link
                 to="/saved-properties"
                 className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
               >
                 View Saved Properties
                 <ArrowRight className="h-4 w-4 ml-2" />
               </Link>
             </div>
           </div>
         )}
         
         {/* Add other views as needed */}
       </div>
     </div>
     
     {/* Property Map Modal - Modified to open as a full view instead of a modal */}
     {showMap && currentView !== 'map' && (
       <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
         <div className="bg-white rounded-xl w-full max-w-6xl h-[80vh] overflow-hidden shadow-2xl border border-gray-200">
           <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
             <h2 className="text-lg font-semibold flex items-center">
               <Map className="h-5 w-5 mr-2 text-blue-600" />
               Interactive Property Map
             </h2>
             <div className="flex space-x-2">
               <button 
                 onClick={() => {
                   navigateTo('map', 'Property Map');
                   setShowMap(false);
                 }}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
               >
                 Open Full Map
               </button>
               <button 
                 onClick={() => {
                   setShowMap(false);
                   setMapInitialState(null);
                 }}
                 className="text-gray-500 hover:text-gray-700 bg-white p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                 aria-label="Close map"
               >
                 <X className="h-5 w-5" />
               </button>
             </div>
           </div>
           <div className="h-full">
             <Suspense fallback={
               <div className="h-full flex items-center justify-center bg-gray-50">
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                 <p className="ml-3 text-gray-600">Loading map preview...</p>
               </div>
             }>
               <PropertyMap 
                 isOpen={showMap}
                 onClose={() => {
                   setShowMap(false);
                   setMapInitialState(null);
                 }}
                 onPropertySelect={handlePropertySelect}
                 onPropertySaved={handleSaveProperty}
                 initialState={mapInitialState}
               />
             </Suspense>
           </div>
         </div>
       </div>
     )}
     
     {/* Property Details Modal - with back navigation */}
     {selectedProperty && (
       <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
         <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
           <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
             <div className="flex items-center">
               <button
                 onClick={() => setSelectedProperty(null)}
                 className="mr-3 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
               >
                 <ArrowLeft className="h-5 w-5" />
               </button>
               <h2 className="text-lg font-semibold flex items-center">
                 <Building className="h-5 w-5 mr-2 text-blue-600" />
                 Property Details
               </h2>
             </div>
             <div className="flex items-center gap-3">
               <button 
                 onClick={() => handleSaveProperty(selectedProperty)}
                 disabled={saveStatus === 'saving'}
                 className={`px-4 py-2 text-sm rounded-lg transition-all ${
                   saveStatus === 'saved' 
                     ? 'bg-green-600 text-white cursor-default' 
                     : saveStatus === 'saving'
                     ? 'bg-blue-400 text-white cursor-not-allowed'
                     : 'bg-blue-600 text-white hover:bg-blue-700'
                 } flex items-center shadow-sm`}
               >
                 {saveStatus === 'saving' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                 {saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'saving' ? 'Saving...' : 'Save Property'}
               </button>
               <button 
                 onClick={() => setSelectedProperty(null)}
                 className="text-gray-500 hover:text-gray-700 bg-white p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                 aria-label="Close details"
               >
                 <X className="h-5 w-5" />
               </button>
             </div>
           </div>
           <div className="overflow-auto max-h-[calc(90vh-80px)]">
             <Suspense fallback={
               <div className="p-8 flex items-center justify-center">
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                 <p className="ml-3 text-gray-600">Loading property details...</p>
               </div>
             }>
               <PropertyDetails property={selectedProperty} />
             </Suspense>
           </div>
         </div>
       </div>
     )}
   </div>
 );
}