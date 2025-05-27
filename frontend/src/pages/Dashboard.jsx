import {
  AlertCircle,
  BarChart3,
  BookmarkIcon,
  Brain,
  Building,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Coins,
  DollarSign,
  FileText,
  Globe,
  Home,
  Loader2,
  LogOut,
  Map,
  MapPin,
  Menu,
  PieChart,
  Plus,
  Search,
  Settings,
  TrendingDown,
  TrendingUp,
  User,
  UserPlus,
  Users,
  X,
  Zap
} from 'lucide-react';
import { lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getCompanyStats,
  getPropertyById,
  getUserSavedProperties,
  getUserSearchHistory,
  getWealthEstimations,
  runWealthEstimations,
  saveProperty,
  saveUserSearch
} from '../services/api';
// Lazy load heavy components
const PropertyDetails = lazy(() => import('./PropertyDetails'));

// Skeleton Components for loading states
const MetricCardSkeleton = memo(() => (
  <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border border-slate-200/60">
    <div className="flex justify-between items-start mb-4 lg:mb-6">
      <div className="bg-slate-100 p-2 lg:p-3 rounded-xl animate-pulse w-12 h-12"></div>
      <div className="bg-slate-100 h-6 w-16 rounded-full animate-pulse"></div>
    </div>
    <div className="space-y-2">
      <div className="bg-slate-100 h-4 w-24 rounded animate-pulse"></div>
      <div className="bg-slate-100 h-8 w-16 rounded animate-pulse"></div>
    </div>
  </div>
));

const SearchItemSkeleton = memo(() => (
  <div className="flex items-center p-3 lg:p-4 rounded-xl">
    <div className="bg-slate-100 w-12 lg:w-16 h-9 lg:h-12 rounded-lg animate-pulse mr-3 lg:mr-4"></div>
    <div className="flex-1 space-y-2">
      <div className="bg-slate-100 h-4 w-48 rounded animate-pulse"></div>
      <div className="bg-slate-100 h-3 w-24 rounded animate-pulse"></div>
    </div>
    <div className="bg-slate-100 h-3 w-20 rounded animate-pulse"></div>
  </div>
));

const OwnerItemSkeleton = memo(() => (
  <div className="flex items-center space-x-3 lg:space-x-4 p-3 lg:p-4 rounded-xl">
    <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-xl bg-slate-100 animate-pulse"></div>
    <div className="flex-1 space-y-2">
      <div className="bg-slate-100 h-4 w-32 rounded animate-pulse"></div>
      <div className="bg-slate-100 h-3 w-20 rounded animate-pulse"></div>
    </div>
    <div className="bg-slate-100 h-4 w-16 rounded animate-pulse"></div>
  </div>
));

// Memoized NavLink component
const NavLink = memo(({ icon: Icon, label, to, isActive, onClick, onNavigate }) => (
  <li>
    {to ? (
      <Link 
        to={to} 
        onClick={onNavigate}
        className={`group flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
          isActive 
            ? 'bg-white/15 text-white font-medium backdrop-blur-sm border border-white/20' 
            : 'text-white/80 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="ml-3 whitespace-nowrap">{label}</span>
      </Link>
    ) : (
      <button 
        onClick={() => {
          onClick && onClick();
          onNavigate();
        }}
        className={`group w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
          isActive 
            ? 'bg-white/15 text-white font-medium backdrop-blur-sm border border-white/20' 
            : 'text-white/80 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="ml-3 whitespace-nowrap">{label}</span>
      </button>
    )}
  </li>
));

// Memoized Metric Card component
const MetricCard = memo(({ icon: Icon, title, value, subtitle, badge, gradient }) => (
  <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4 lg:mb-6">
      <div className={`p-2 lg:p-3 rounded-xl group-hover:opacity-90 transition-colors ${gradient}`}>
        <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-current" />
      </div>
      <div className={`text-xs font-semibold px-2 lg:px-3 py-1 lg:py-1.5 rounded-full flex items-center ${badge.className}`}>
        {badge.icon && <badge.icon className="h-3 w-3 mr-1 lg:mr-1.5" />}
        {badge.text}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-slate-500 text-xs lg:text-sm font-medium">{title}</p>
      <div className="flex items-baseline">
        <p className="text-2xl lg:text-3xl font-bold text-slate-900">{value}</p>
        <span className="ml-1 lg:ml-2 text-xs lg:text-sm text-slate-500 hidden sm:inline">{subtitle}</span>
      </div>
    </div>
  </div>
));

// Wealth Estimation Section Component
// In the WealthEstimationSection component of Dashboard.jsx, replace the existing code with:

const WealthEstimationSection = () => {
  const [estimations, setEstimations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expandedReasoning, setExpandedReasoning] = useState(null);

  // Fetch existing estimations
  const fetchEstimations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWealthEstimations();
      
      if (data.success) {
        setEstimations(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Error fetching wealth estimations:', err);
      setError('Failed to load wealth estimations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEstimations();
  }, [fetchEstimations]);

  // Run new estimations
  const handleRunEstimation = async () => {
    try {
      setEstimating(true);
      setError(null);
      
      const data = await runWealthEstimations();
      
      if (data.success) {
        setSummary(data.summary);
        await fetchEstimations(); // Refresh the list
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Error running estimations:', err);
      setError('Failed to run wealth estimations');
    } finally {
      setEstimating(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceIcon = (confidence) => {
    switch (confidence) {
      case 'High': return <TrendingUp className="h-3 w-3" />;
      case 'Medium': return <BarChart3 className="h-3 w-3" />;
      case 'Low': return <TrendingDown className="h-3 w-3" />;
      default: return <BarChart3 className="h-3 w-3" />;
    }
  };

  const toggleReasoning = (estimationId) => {
    setExpandedReasoning(expandedReasoning === estimationId ? null : estimationId);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
              AI-Powered Wealth Estimation
            </h3>
            <p className="text-gray-600">
              Get estimated net worth for property owners using advanced AI analysis and real income data
            </p>
          </div>
          <button
            onClick={handleRunEstimation}
            disabled={estimating || loading}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {estimating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Run Estimation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Display */}
      {summary && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
          <h4 className="font-semibold text-blue-900 mb-2">Estimation Complete</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Processed:</span>
              <span className="ml-1 text-blue-900">{summary.processed}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Successful:</span>
              <span className="ml-1 text-green-600">{summary.successful}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Failed:</span>
              <span className="ml-1 text-red-600">{summary.failed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Estimations List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h4 className="font-semibold text-gray-900 flex items-center">
            Owner Wealth Estimations ({estimations.length})
          </h4>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <span className="ml-3 text-gray-600">Loading estimations...</span>
            </div>
          ) : estimations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="h-8 w-8 text-gray-400" />
              </div>
              <h5 className="text-lg font-medium text-gray-900 mb-2">No Wealth Estimations Yet</h5>
              <p className="text-gray-500 mb-6">
                Run AI-powered wealth estimation on your saved properties to see owner net worth estimates.
              </p>
              <button
                onClick={handleRunEstimation}
                disabled={estimating}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center mx-auto"
              >
                <Zap className="h-5 w-5 mr-2" />
                Get Started
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {estimations.map((estimation) => (
                <div key={estimation._id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 bg-gray-50 hover:bg-white">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <User className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                          <h6 className="font-semibold text-gray-900 truncate">
                            {estimation.ownerName}
                          </h6>
                          <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(estimation.confidence)}`}>
                            {getConfidenceIcon(estimation.confidence)}
                            <span className="ml-1">{estimation.confidence}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{estimation.propertyAddress}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 block">Property Value</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(estimation.propertyValue)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Annual Tax</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(estimation.annualPropertyTax)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">ZIP Median</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(estimation.zipCodeMedianNetWorth)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Estimated Date</span>
                            <span className="font-medium text-gray-900">
                              {new Date(estimation.estimatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <button
                            onClick={() => toggleReasoning(estimation._id)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                          >
                            <Brain className="h-4 w-4 mr-1" />
                            Logic behind this
                            <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${expandedReasoning === estimation._id ? 'rotate-90' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="ml-6 text-right">
                        <div className="text-xs text-gray-500 mb-1">Estimated Net Worth</div>
                        <div className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(estimation.estimatedNetWorth)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reasoning Panel */}
                  {expandedReasoning === estimation._id && (
                    <div className="border-t border-gray-200 bg-gray-50 p-5">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h6 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Brain className="h-4 w-4 mr-2 text-indigo-600" />
                          AI Analysis & Reasoning
                        </h6>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {estimation.groqResponse || 'No detailed reasoning available for this estimation.'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  
  // Individual loading states for better UX
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    searchHistory: true,
    savedProperties: true,
    recentActivity: true
  });
  
  // Refs for cleanup
  const searchRefreshTimerRef = useRef(null);
  const saveStatusTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  const userEmail = localStorage.getItem('userEmail') || 'User';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalProperties: 0,
    highValueProperties: 0,
    newProperties: 0,
    recentSearches: [],
    savedProperties: [],
    topOwners: [],
    recentActivity: []
  });

  // Cleanup function
  const cleanup = useCallback(() => {
    if (searchRefreshTimerRef.current) {
      clearTimeout(searchRefreshTimerRef.current);
      searchRefreshTimerRef.current = null;
    }
    if (saveStatusTimerRef.current) {
      clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Effect for responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cleanup();
    };
  }, [cleanup]);

  // Optimized data fetching with parallel requests and better error handling
  const fetchDashboardData = useCallback(async () => {
    // Abort previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    // Reset loading states
    setLoadingStates({
      stats: true,
      searchHistory: true,
      savedProperties: true,
      recentActivity: true
    });

    try {
      // Parallel requests with individual error handling
      const requests = [
        getUserSearchHistory().catch(err => {
          console.warn('Failed to fetch search history:', err);
          return { data: [] };
        }),
        getUserSavedProperties().catch(err => {
          console.warn('Failed to fetch saved properties:', err);
          return { data: [] };
        }),
        getCompanyStats().catch(err => {
          console.warn('Failed to fetch company stats:', err);
          return { data: { topOwners: [] } };
        })
        // Remove the fourth element since getRecentActivity doesn't exist
      ];
      
      // Wait for all requests to complete - only 3 items now
      const [searchHistory, savedProperties, companyStats] = await Promise.allSettled(requests);

      // Process results and update loading states individually
      setStats(prev => ({
        ...prev,
        totalProperties: companyStats.status === 'fulfilled' ? companyStats.value.data?.totalProperties || 0 : prev.totalProperties,
        highValueProperties: companyStats.status === 'fulfilled' ? companyStats.value.data?.highValueProperties || 0 : prev.highValueProperties,
        newProperties: companyStats.status === 'fulfilled' ? companyStats.value.data?.newProperties || 0 : prev.newProperties,
        recentSearches: searchHistory.status === 'fulfilled' ? searchHistory.value.data?.slice(0, 5) || [] : prev.recentSearches,
        savedProperties: savedProperties.status === 'fulfilled' ? savedProperties.value.data?.slice(0, 3) || [] : prev.savedProperties,
        topOwners: companyStats.status === 'fulfilled' ? companyStats.value.data?.topOwners || [] : prev.topOwners,
        recentActivity: [] // Set to empty array since endpoint doesn't exist
      }));

      // Update individual loading states
      setLoadingStates({
        stats: companyStats.status === 'pending',
        searchHistory: searchHistory.status === 'pending',
        savedProperties: savedProperties.status === 'pending',
        recentActivity: false // Set to false since endpoint doesn't exist
      });

      // Check if any requests failed
      const failedRequests = [searchHistory, savedProperties, companyStats]
        .filter(result => result.status === 'rejected').length;
      
      if (failedRequests > 0) {
        setError(`Some data could not be loaded (${failedRequests} failed)`);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Memoized property selection handler
  const handlePropertySelect = useCallback(async (property) => {
    navigate('/property-map', { 
      state: { 
        selectedProperty: property,
        initialState: {
          property: property,
          latitude: property.location?.latitude || 
                   property.address?.latitude || 
                   (property.address?.location?.geometry?.coordinates?.[1]) || 
                   40.7128,
          longitude: property.location?.longitude || 
                    property.address?.longitude ||
                    (property.address?.location?.geometry?.coordinates?.[0]) || 
                    -74.0060,
          showPopup: true
        }
      }
    });

    const propertyId = property.identifier?.attomId || property.identifier?.Id || property.attomId;
    const isAlreadyInSearches = stats.recentSearches.some(search => 
      search.propertyId === propertyId || 
      search.query === `Property at ${property.fullAddress || getPropertyAddress(property)}`
    );
    
    if (!isAlreadyInSearches && propertyId) {
      try {
        await saveUserSearch({
          query: `Property at ${property.fullAddress || getPropertyAddress(property)}`,
          propertyId: propertyId,
          searchType: 'map_click',
          results: {
            count: 1,
            properties: [property]
          }
        });
        
        // Clear existing timer
        if (searchRefreshTimerRef.current) {
          clearTimeout(searchRefreshTimerRef.current);
        }
        
        searchRefreshTimerRef.current = setTimeout(() => {
          refreshDashboardData();
        }, 10000);
        
      } catch (err) {
        console.error('Error saving search:', err);
      }
    }
  }, [navigate, stats.recentSearches]);

  // Optimized dashboard refresh
  const refreshDashboardData = useCallback(async () => {
    try {
      const searchHistory = await getUserSearchHistory();
      setStats(prev => ({
        ...prev,
        recentSearches: searchHistory.data?.slice(0, 5) || []
      }));
    } catch (err) {
      console.error('Error refreshing dashboard data:', err);
    }
  }, []);

  // Optimized save property handler
  const handleSaveProperty = useCallback(async (property) => {
    setSaveStatus('saving');
    setSaveMessage('Saving property...');
    
    try {
      await saveProperty(property);
      
      setSaveStatus('saved');
      setSaveMessage('Property saved successfully!');
      
      // Refresh only saved properties data
      const savedProperties = await getUserSavedProperties();
      setStats(prev => ({
        ...prev,
        savedProperties: savedProperties.data?.slice(0, 3) || []
      }));
      
      // Clear save status
      saveStatusTimerRef.current = setTimeout(() => {
        setSaveStatus(null);
        setSaveMessage('');
      }, 2000);
      
    } catch (err) {
      console.error('Error saving property:', err);
      setSaveStatus('error');
      setSaveMessage(err === 'Property already saved' ? 'This property is already saved' : 'Failed to save property');
      
      saveStatusTimerRef.current = setTimeout(() => {
        setSaveStatus(null);
        setSaveMessage('');
      }, 3000);
    }
  }, []);

  // Memoized logout handler
  const handleLogout = useCallback(() => {
    cleanup();
    localStorage.removeItem('authToken');
    localStorage.removeItem('companyId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
    navigate('/login');
  }, [navigate, cleanup]);

  // Optimized search click handler
  const handleSearchClick = useCallback(async (search) => {
    const streetViewImage = search.streetViewImage;
    
    if (search.propertyId && search.results?.properties?.length > 0) {
      const propertyData = search.results.properties[0];
      
      if (streetViewImage) {
        propertyData.streetViewImage = streetViewImage;
      }
      
      const latitude = 
        propertyData.location?.latitude || 
        propertyData.address?.latitude || 
        (propertyData.address?.location?.geometry?.coordinates?.[1]) || 
        40.7128;
      
      const longitude = 
        propertyData.location?.longitude || 
        propertyData.address?.longitude || 
        (propertyData.address?.location?.geometry?.coordinates?.[0]) || 
        -74.0060;
      
      navigate('/property-map', {
        state: {
          selectedProperty: propertyData,
          initialState: {
            property: propertyData,
            latitude: latitude,
            longitude: longitude,
            showPopup: true
          }
        }
      });
    } else if (search.propertyId) {
      try {
        setLoading(true);
        
        const propertyData = await getPropertyById(search.propertyId);
        
        if (propertyData) {
          if (streetViewImage) {
            propertyData.streetViewImage = streetViewImage;
          }
          
          const latitude = 
            propertyData.location?.latitude || 
            propertyData.address?.latitude || 
            (propertyData.address?.location?.geometry?.coordinates?.[1]) || 
            40.7128;
          
          const longitude = 
            propertyData.location?.longitude || 
            propertyData.address?.longitude || 
            (propertyData.address?.location?.geometry?.coordinates?.[0]) || 
            -74.0060;
          
          navigate('/property-map', {
            state: {
              selectedProperty: propertyData,
              initialState: {
                property: propertyData,
                latitude: latitude,
                longitude: longitude,
                showPopup: true
              }
            }
          });
        }
      } catch (error) {
        console.error('Error fetching property data:', error);
        navigate('/property-map');
      } finally {
        setLoading(false);
      }
    } else {
      navigate('/property-map');
    }
  }, [navigate]);

  // Memoized utility functions
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

 const formatNumber = useCallback((num) => {
   if (num >= 1000000) {
     return (num / 1000000).toFixed(1) + 'M';
   } else if (num >= 1000) {
     return (num / 1000).toFixed(0) + 'K';
   } else {
     return num.toString();
   }
 }, []);

 // Memoized sidebar close handler
 const handleSidebarClose = useCallback(() => {
   setIsSidebarOpen(false);
 }, []);

 // Memoized filtered items
 const filteredItems = useMemo(() => {
   const filterItems = (items, query) => {
     if (!query) return items;
     return items.filter(item => {
       if (item.query) {
         return item.query.toLowerCase().includes(query.toLowerCase());
       } else if (item.action) {
         return item.action.toLowerCase().includes(query.toLowerCase());
       }
       return false;
     });
   };
   
   return {
     searches: filterItems(stats.recentSearches, searchQuery),
     activity: filterItems(stats.recentActivity, searchQuery)
   };
 }, [stats.recentSearches, stats.recentActivity, searchQuery]);

 // Memoized metric cards data
 const metricCardsData = useMemo(() => [
   {
     icon: Building,
     title: 'Total Properties',
     value: formatNumber(stats.totalProperties),
     subtitle: 'from last month',
     gradient: 'bg-blue-50 text-blue-600',
     badge: {
       className: 'bg-emerald-50 text-emerald-800'
     }
   },
   {
     icon: DollarSign,
     title: 'High Value Properties',
     value: formatNumber(stats.highValueProperties),
     subtitle: 'over $1M',
     gradient: 'bg-emerald-50 text-emerald-600',
     badge: {
       className: 'bg-emerald-50 text-emerald-800'
     }
   },
   {
     icon: Calendar,
     title: 'New Properties',
     value: formatNumber(stats.newProperties),
     subtitle: 'recently added',
     gradient: 'bg-purple-50 text-purple-600',
     badge: {
       className: 'bg-amber-50 text-amber-800'
     }
   },
   {
     icon: User,
     title: 'Top Owners',
     value: stats.topOwners.length,
     subtitle: 'key individuals',
     gradient: 'bg-amber-50 text-amber-600',
     badge: {
       className: 'bg-slate-50 text-slate-700'
     }
   }
 ], [stats, formatNumber]);

 // Loading state
 if (loading && (!stats.totalProperties && !stats.recentSearches.length)) {
   return (
     <div className="flex h-screen bg-white">
       <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
         <div className="text-center">
           <div className="relative mx-auto w-20 h-20 mb-8">
             <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
             <div className="absolute inset-0 rounded-full border-4 border-slate-600 border-t-transparent animate-spin"></div>
           </div>
           <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Dashboard</h2>
           <p className="text-slate-600">Please wait while we prepare your data</p>
         </div>
       </div>
     </div>
   );
 }

 if (error && !stats.totalProperties && !stats.recentSearches.length) {
   return (
     <div className="flex h-screen bg-gradient-to-br from-slate-50 to-white items-center justify-center p-4">
       <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full text-center">
         <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
           <AlertCircle className="h-8 w-8 text-red-600" />
         </div>
         <h2 className="text-xl font-bold text-slate-900 mb-3">Something went wrong</h2>
         <p className="text-slate-600 mb-6">{error}</p>
         <button 
           onClick={fetchDashboardData}
           className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-3 rounded-xl font-semibold hover:from-slate-800 hover:to-slate-700 transition-all"
         >
           Try Again
         </button>
       </div>
     </div>
   );
 }
 
 return (
   <div className="flex h-screen bg-gradient-to-br from-slate-50 to-white overflow-hidden">
     {/* Premium Save Status Notification */}
     {saveStatus && (
       <div className={`fixed top-4 right-4 z-50 transform transition-all duration-500 ease-out ${
         saveStatus ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-full opacity-0 scale-95'
       }`}>
         <div className={`p-4 rounded-2xl shadow-2xl backdrop-blur-md border max-w-sm ${
           saveStatus === 'saving' ? 'bg-blue-50/95 border-blue-200/50' :
           saveStatus === 'saved' ? 'bg-emerald-50/95 border-emerald-200/50' :
           'bg-red-50/95 border-red-200/50'
         }`}>
           <div className="flex items-center space-x-3">
             <div className={`p-2 rounded-xl ${
               saveStatus === 'saving' ? 'bg-blue-100' :
               saveStatus === 'saved' ? 'bg-emerald-100' :
               'bg-red-100'
             }`}>
               {saveStatus === 'saving' && (
                 <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
               )}
               {saveStatus === 'saved' && (
                 <CheckCircle className="h-5 w-5 text-emerald-600" />
               )}
               {saveStatus === 'error' && (
                 <X className="h-5 w-5 text-red-600" />
               )}
             </div>
             <div>
               <p className={`font-semibold text-sm ${
                 saveStatus === 'saving' ? 'text-blue-900' :
                 saveStatus === 'saved' ? 'text-emerald-900' :
                 'text-red-900'
               }`}>
                 {saveStatus === 'saving' ? 'Saving...' :
                  saveStatus === 'saved' ? 'Success!' :
                  'Error'}
               </p>
               <p className={`text-xs ${
                 saveStatus === 'saving' ? 'text-blue-700' :
                 saveStatus === 'saved' ? 'text-emerald-700' :
                 'text-red-700'
               }`}>
                 {saveMessage}
               </p>
             </div>
           </div>
         </div>
       </div>
     )}

     {/* Premium Sidebar */}
     <div 
       className={`fixed lg:relative h-full transition-all duration-300 ease-in-out z-40 
                   ${isSidebarOpen ? 'w-72' : 'w-0 lg:w-20'} 
                   bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                   shadow-2xl overflow-hidden`}
     >
       {/* Mobile Backdrop */}
       {isSidebarOpen && (
         <div 
           className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden -z-10"
           onClick={handleSidebarClose}
         />
       )}

       {/* Sidebar Content */}
       <div className="h-full flex flex-col">
         {/* Header */}
         <div className="p-6 border-b border-white/10">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-3">
               <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                 <Globe className="h-7 w-7 text-white" />
               </div>
               {(isSidebarOpen || window.innerWidth >= 1280) && (
                 <div>
                   <h1 className="font-bold text-xl text-white tracking-tight">WealthMap</h1>
                 </div>
               )}
             </div>
             <button
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg lg:hidden"
             >
               <X size={20} />
             </button>
           </div>
         </div>
         
         {/* Navigation */}
         <nav className="flex-1 p-6 space-y-8 overflow-y-auto">
           <div>
             <p className="text-xs text-white/50 uppercase font-semibold tracking-wider px-3 mb-4">
               General
             </p>
             <ul className="space-y-2">
               <NavLink 
                 icon={Home} 
                 label="Dashboard" 
                 to="/dashboard" 
                 isActive={true}
                 onNavigate={handleSidebarClose}
               />
               <NavLink 
                 icon={Map} 
                 label="Property Map" 
                 onClick={() => navigate('/property-map')} 
                 isActive={false}
                 onNavigate={handleSidebarClose}
               />
               <NavLink 
                 icon={Search} 
                 label="Search" 
                 to="/search" 
                 isActive={false}
                 onNavigate={handleSidebarClose}
               />
               <NavLink 
                 icon={BarChart3} 
                 label="Analytics" 
                 to="/analytics" 
                 isActive={false}
                 onNavigate={handleSidebarClose}
               />
             </ul>
           </div>
           
           <div>
             <p className="text-xs text-white/50 uppercase font-semibold tracking-wider px-3 mb-4">
               Workspace
             </p>
             <ul className="space-y-2">
               <NavLink 
                 icon={BookmarkIcon} 
                 label="Saved Properties" 
                 to="/saved-properties" 
                 isActive={false}
                 onNavigate={handleSidebarClose}
               />
               <NavLink 
  icon={FileText} 
  label="Smart Reports" 
  to="/reports" 
  isActive={false}
  onNavigate={handleSidebarClose}
/>
               {isAdmin && (
                 <NavLink 
                   icon={Users} 
                   label="Team Management" 
                   to="/team" 
                   isActive={false}
                   onNavigate={handleSidebarClose}
                 />
               )}
               <NavLink 
                 icon={Settings} 
                 label="Settings" 
                 to="/settings" 
                 isActive={false}
                 onNavigate={handleSidebarClose}
               />
             </ul>
           </div>
         </nav>
         {/* User Section */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-white">{userEmail.charAt(0).toUpperCase()}</span>
            </div>
            {(isSidebarOpen || window.innerWidth >= 1280) && (
              <div className="ml-3 flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{userEmail}</p>
                <p className="text-xs text-white/60">{isAdmin ? 'Administrator' : 'User'}</p>
              </div>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className="mt-4 w-full flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-sm text-sm font-medium px-3 py-3 text-white/80 hover:text-white transition-all duration-200 border border-white/10"
          >
            <LogOut className="h-4 w-4" />
            {(isSidebarOpen || window.innerWidth >= 1280) && <span className="ml-3">Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
    
    {/* Main Content */}
    <div className="flex-1 overflow-auto">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30">
        <div className="flex flex-col">
          <div className="flex justify-between items-center p-4 lg:p-6">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="mr-3 lg:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 rounded-lg"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="min-w-0 flex-1">
              <h1 className="text-xl lg:text-3xl font-bold text-slate-900 truncate">
                Hello, {userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1)}
              </h1>
                <p className="text-sm lg:text-base text-slate-600 hidden sm:block">Here's your portfolio performance today</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
              <button 
                onClick={() => navigate('/property-map')}
                className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-3 lg:px-6 py-2 lg:py-3 rounded-xl font-semibold hover:from-slate-800 hover:to-slate-700 transition-all shadow-lg text-sm lg:text-base flex items-center"
              >
                <Map className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">Explore Map</span>
                <span className="sm:hidden">Map</span>
              </button>
              
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shadow-sm">
                <span className="text-xs lg:text-sm font-bold text-slate-700">{userEmail.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          {/* <div className="px-4 lg:px-6 pb-4">
            <div className="relative max-w-md lg:max-w-lg">
              <input
                type="text"
                placeholder="Search properties, owners, addresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent bg-white/80 backdrop-blur-sm text-slate-900 placeholder-slate-500"
              />
              <Search className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            </div>
          </div> */}
          
          {/* Tab Navigation */}
          <div className="px-4 lg:px-6">
            <nav className="flex space-x-6 lg:space-x-8 overflow-x-auto scrollbar-hide border-b border-slate-200">
              <button
                onClick={() => setActiveSection('overview')}
                className={`pb-4 text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-2 ${
                  activeSection === 'overview' 
                    ? 'border-slate-900 text-slate-900' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Overview
              </button>
              {/* <button
                onClick={() => setActiveSection('activity')}
                className={`pb-4 text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-2 ${
                  activeSection === 'activity' 
                    ? 'border-slate-900 text-slate-900' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Recent Activity
              </button> */}
              {/* <button
                onClick={() => setActiveSection('analytics')}
                className={`pb-4 text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-2 ${
                  activeSection === 'analytics' 
                    ? 'border-slate-900 text-slate-900' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Analytics
              </button> */}
              <button
                onClick={() => setActiveSection('wealth')}
                className={`pb-4 text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-2 ${
                  activeSection === 'wealth' 
                    ? 'border-slate-900 text-slate-900' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Wealth Estimation
              </button>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Premium Content */}
      <div className="p-4 lg:p-8 pb-24">
        {activeSection === 'overview' && (
          <div className="space-y-6 lg:space-y-8">
            {/* Key Metrics with Skeleton Loading */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {loadingStates.stats ? (
                <>
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                </>
              ) : (
                metricCardsData.map((card, index) => (
                  <MetricCard
                    key={index}
                    icon={card.icon}
                    title={card.title}
                    value={card.value}
                    subtitle={card.subtitle}
                    badge={card.badge}
                    gradient={card.gradient}
                  />
                ))
              )}
            </div>

            {/* Main Grid - Responsive Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              {/* Property Map Section */}
              <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="p-4 lg:p-6 border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="bg-slate-100 p-2 rounded-lg flex-shrink-0">
                        <MapPin className="h-5 w-5 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-slate-900">Property Map</h2>
                        <p className="text-sm text-slate-500 hidden sm:block">Interactive visualization of your portfolio</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/property-map')}
                      className="text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center group flex-shrink-0"
                    >
                      <span className="hidden sm:inline">Open Full Map</span>
                      <span className="sm:hidden">Open</span>
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <div 
                    className="relative h-64 lg:h-80 rounded-xl overflow-hidden cursor-pointer group bg-slate-100" 
                    onClick={() => navigate('/property-map')}
                  >
                    {/* Actual US Map with OpenStreetMap */}
                    <iframe
                     src="https://www.openstreetmap.org/export/embed.html?bbox=-101.5%2C36.5%2C-89.5%2C43.5&layer=mapnik"
                     className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                     style={{ border: 'none' }}
                     title="Zoomed US Property Map"
                   ></iframe>
                  </div>
                </div>
              </div>
              
              {/* Top Property Owners */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <div className="p-4 lg:p-6 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-100 p-2 rounded-lg flex-shrink-0">
                      <User className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-slate-900">Top Property Owners</h2>
                      <p className="text-sm text-slate-500 hidden sm:block">Ranked by portfolio value</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  {loadingStates.stats ? (
                    <div className="space-y-3 lg:space-y-4">
                      <OwnerItemSkeleton />
                      <OwnerItemSkeleton />
                      <OwnerItemSkeleton />
                      <OwnerItemSkeleton />
                      <OwnerItemSkeleton />
                    </div>
                  ) : stats.topOwners.length > 0 ? (
                    <div className="space-y-3 lg:space-y-4">
                      {stats.topOwners.map((owner, index) => (
                        <div key={index} className="flex items-center space-x-3 lg:space-x-4 p-3 lg:p-4 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className={`w-8 lg:w-10 h-8 lg:h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                            index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600' : 
                            index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' : 
                            'bg-gradient-to-br from-slate-600 to-slate-800'
                          } flex-shrink-0`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate text-sm lg:text-base">{owner.name}</p>
                            <p className="text-xs lg:text-sm text-slate-500">{owner.properties} properties</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-emerald-600 text-sm lg:text-base">{owner.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 lg:py-12 text-center">
                      <div className="w-12 lg:w-16 h-12 lg:h-16 mx-auto mb-3 lg:mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <User className="w-6 lg:w-8 h-6 lg:h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium text-sm lg:text-base">No owner data available</p>
                      <p className="text-slate-400 text-xs lg:text-sm mt-1">Data will appear as you add properties</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Recent Searches & Quick Actions */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              {/* Recent Searches */}
              <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <div className="p-4 lg:p-6 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-100 p-2 rounded-lg flex-shrink-0">
                      <Search className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-slate-900">Recent Searches</h2>
                      <p className="text-sm text-slate-500 hidden sm:block">Your latest property searches</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  {loadingStates.searchHistory ? (
                    <div className="space-y-2 lg:space-y-3">
                      <SearchItemSkeleton />
                      <SearchItemSkeleton />
                      <SearchItemSkeleton />
                      <SearchItemSkeleton />
                      <SearchItemSkeleton />
                    </div>
                  ) : filteredItems.searches.length > 0 ? (
                    <div className="space-y-2 lg:space-y-3">
                      {filteredItems.searches.map((search) => {
                        const streetViewImage = search.streetViewImage;
                        
                        return (
                          <div 
                            key={search._id} 
                            className="flex items-center p-3 lg:p-4 hover:bg-slate-50 cursor-pointer rounded-xl transition-all duration-200 group"
                            onClick={() => handleSearchClick(search)}
                          >
                            <div className="flex-shrink-0 mr-3 lg:mr-4">
                              {streetViewImage ? (
                                <div className="w-12 lg:w-16 h-9 lg:h-12 rounded-lg overflow-hidden bg-slate-100 shadow-sm">
                                  <img 
                                    src={streetViewImage} 
                                    alt="Street View" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="w-full h-full bg-slate-100 items-center justify-center hidden">
                                    <Search className="h-4 w-4 text-slate-400" />
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-slate-100 p-2 lg:p-3 rounded-lg w-12 lg:w-16 h-9 lg:h-12 flex items-center justify-center">
                                  <Search className="h-4 w-4 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 truncate group-hover:text-slate-700 text-sm lg:text-base">{search.query}</p>
                              {search.propertyId && (
                                <p className="text-xs lg:text-sm text-slate-500">ID: {search.propertyId}</p>
                              )}
                            </div>
                            <div className="flex items-center text-xs lg:text-sm text-slate-400 ml-3 lg:ml-4 flex-shrink-0">
                              <Clock className="h-3 lg:h-4 w-3 lg:w-4 mr-1 lg:mr-2" />
                              <span className="hidden sm:inline">{new Date(search.createdAt).toLocaleDateString()}</span>
                              <span className="sm:hidden">{new Date(search.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 lg:py-12 text-center">
                      <div className="w-12 lg:w-16 h-12 lg:h-16 mx-auto mb-3 lg:mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Search className="w-6 lg:w-8 h-6 lg:h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium text-sm lg:text-base">
                        {searchQuery ? 'No matching searches found' : 'No recent searches'}
                      </p>
                      <p className="text-slate-400 text-xs lg:text-sm mt-1">Your search history will appear here</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <div className="p-4 lg:p-6 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-100 p-2 rounded-lg flex-shrink-0">
                      <Plus className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
                      <p className="text-sm text-slate-500 hidden sm:block">Fast access to key features</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <div className="space-y-3">
                    <button 
                      onClick={() => navigate('/property-map')}
                      className="w-full flex items-center p-3 lg:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl text-slate-800 transition-all duration-200 group border border-blue-100/50"
                    >
                      <div className="bg-blue-500 p-2 rounded-lg mr-3 lg:mr-4 group-hover:scale-110 transition-transform flex-shrink-0">
                        <Map className="h-4 lg:h-5 w-4 lg:w-5 text-white" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="font-semibold text-sm lg:text-base">Explore Property Map</p>
                        <p className="text-xs lg:text-sm text-slate-600 hidden sm:block">Interactive map visualization</p>
                      </div>
                    </button>
                    
                    <Link to="/search" className="w-full flex items-center p-3 lg:p-4 bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 rounded-xl text-slate-800 transition-all duration-200 group border border-emerald-100/50">
                      <div className="bg-emerald-500 p-2 rounded-lg mr-3 lg:mr-4 group-hover:scale-110 transition-transform flex-shrink-0">
                        <Search className="h-4 lg:h-5 w-4 lg:w-5 text-white" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="font-semibold text-sm lg:text-base">New Property Search</p>
                        <p className="text-xs lg:text-sm text-slate-600 hidden sm:block">Find properties by criteria</p>
                      </div>
                    </Link>
                    
                    <Link to="/analytics" className="w-full flex items-center p-3 lg:p-4 bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 rounded-xl text-slate-800 transition-all duration-200 group border border-purple-100/50">
                      <div className="bg-purple-500 p-2 rounded-lg mr-3 lg:mr-4 group-hover:scale-110 transition-transform flex-shrink-0">
                        <BarChart3 className="h-4 lg:h-5 w-4 lg:w-5 text-white" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="font-semibold text-sm lg:text-base">Export Analytics</p>
                        <p className="text-xs lg:text-sm text-slate-600 hidden sm:block">Download portfolio reports</p>
                      </div>
                    </Link>
                    
                    {isAdmin && (
                      <Link to="/team" className="w-full flex items-center p-3 lg:p-4 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-xl text-slate-800 transition-all duration-200 group border border-amber-100/50">
                        <div className="bg-amber-500 p-2 rounded-lg mr-3 lg:mr-4 group-hover:scale-110 transition-transform flex-shrink-0">
                          <UserPlus className="h-4 lg:h-5 w-4 lg:w-5 text-white" />
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <p className="font-semibold text-sm lg:text-base">Invite Team Member</p>
                          <p className="text-xs lg:text-sm text-slate-600 hidden sm:block">Expand your team access</p>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeSection === 'activity' && (
          <div className="space-y-6 lg:space-y-8">
            {/* Activity Feed */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-lg transition-all duration-300">
              <div className="p-4 lg:p-6 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="bg-slate-100 p-2 rounded-lg flex-shrink-0">
                    <Clock className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                    <p className="text-sm text-slate-500 hidden sm:block">Latest actions from your team</p>
                  </div>
                </div>
              </div>
              <div className="p-4 lg:p-6">
                {loadingStates.recentActivity ? (
                  <div className="space-y-3 lg:space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-start space-x-3 lg:space-x-4 p-3 lg:p-4 rounded-xl">
                        <div className="mt-1 w-8 lg:w-10 h-8 lg:h-10 rounded-xl bg-slate-100 animate-pulse flex-shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="bg-slate-100 h-4 w-48 rounded animate-pulse"></div>
                          <div className="bg-slate-100 h-3 w-32 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredItems.activity.length > 0 ? (
                  <div className="space-y-3 lg:space-y-4">
                    {filteredItems.activity.map((activity) => (
                      <div key={activity._id} className="flex items-start space-x-3 lg:space-x-4 p-3 lg:p-4 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className={`mt-1 w-8 lg:w-10 h-8 lg:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          activity.type === 'search' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {activity.type === 'search' ? <Search className="h-4 lg:h-5 w-4 lg:w-5" /> : <BookmarkIcon className="h-4 lg:h-5 w-4 lg:w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 font-medium text-sm lg:text-base">{activity.action}</p>
                          <div className="flex items-center mt-2 text-xs lg:text-sm text-slate-500">
                            <Clock className="h-3 lg:h-4 w-3 lg:w-4 mr-1 lg:mr-2" />
                            <span>{new Date(activity.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 lg:py-12 text-center">
                    <div className="w-12 lg:w-16 h-12 lg:h-16 mx-auto mb-3 lg:mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <Clock className="w-6 lg:w-8 h-6 lg:h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium text-sm lg:text-base">
                      {searchQuery ? 'No matching activity found' : 'No recent activity'}
                    </p>
                    <p className="text-slate-400 text-xs lg:text-sm mt-1">Team activity will appear here</p>
                  </div>
                )}
                </div>
            </div>
            
            {/* Activity Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-lg transition-all duration-300">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="bg-slate-100 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Activity Timeline</h2>
                    <p className="text-sm text-slate-500">Chronological view of team actions</p>
                  </div>
                </div>
              </div>
              <div className="p-6 relative">
                <div className="absolute left-12 top-8 bottom-8 w-0.5 bg-slate-200"></div>
                
                {stats.recentActivity.length > 0 ? (
                  <div className="space-y-8 relative">
                    {stats.recentActivity.slice(0, 4).map((activity, index) => (
                      <div key={index} className="flex items-start ml-4">
                        <div className={`absolute left-8 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                          activity.type === 'search' ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}></div>
                        <div className="ml-12">
                          <p className="text-slate-900 font-medium">{activity.action}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No timeline activity</p>
                    <p className="text-slate-400 text-sm mt-1">Activity timeline will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeSection === 'analytics' && (
          <div className="space-y-8">
            {/* Analytics Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-lg transition-all duration-300">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="bg-slate-100 p-2 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Property Analytics</h2>
                    <p className="text-sm text-slate-500">Comprehensive portfolio insights</p>
                  </div>
                </div>
              </div>
              <div className="p-8 text-center">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-12">
                  <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Advanced Analytics Dashboard</h3>
                  <p className="text-slate-600 max-w-md mx-auto mb-8">
                    Access detailed property analytics, market trends, and investment insights to make data-driven decisions.
                  </p>
                  <Link 
                    to="/analytics"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl font-semibold hover:from-slate-800 hover:to-slate-700 transition-all shadow-lg shadow-slate-900/25"
                  >
                    <BarChart3 className="h-5 w-5 mr-2" />
                    View Full Analytics
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <PieChart className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Property Distribution</h2>
                      <p className="text-sm text-slate-500">Portfolio composition by type</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 h-80 flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Property type distribution</p>
                    <p className="text-slate-400 text-sm mt-1">Chart will appear here</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Value Trends</h2>
                      <p className="text-sm text-slate-500">Market performance over time</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 h-80 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Property value trends</p>
                    <p className="text-slate-400 text-sm mt-1">Chart will appear here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'wealth' && (
          <WealthEstimationSection />
        )}
      </div>
    </div>
  </div>
);
}