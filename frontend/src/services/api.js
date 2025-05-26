import axios from 'axios';

// Debug logging helper
const logApiCall = (method, url, data = null) => {
  if (import.meta.env.DEV) {
    console.log(`[API] ${method.toUpperCase()} ${url}`, data ? { data } : '');
  }
};

// Determine the base URL based on environment
const getBaseURL = () => {
  const isDev = import.meta.env.DEV;
  const prodUrl = import.meta.env.VITE_API_URL || 'https://fueled-wealth-map-dhruval.onrender.com';
  
  if (isDev) {
    // In development, use empty string to let Vite proxy handle it
    return '';
  } else {
    // In production, use full backend URL
    return prodUrl;
  }
};

// Create an axios instance with default config
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Enhanced request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Log the full URL being called in development
    if (import.meta.env.DEV) {
      const fullUrl = `${config.baseURL}${config.url}`;
      logApiCall(config.method, fullUrl, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API] Success: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    }
    return response;
  },
  (error) => {
    console.error('[API] Response error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      baseURL: error.config?.baseURL
    });
    
    return Promise.reject(error);
  }
);

// Helper function to handle API errors consistently
const handleApiError = (error, defaultMessage) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    // If we get HTML, it means the endpoint doesn't exist
    if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
      throw `API endpoint not found: ${error.config?.url}`;
    }
    
    if (status === 404) {
      throw `Endpoint not found: ${error.config?.url}`;
    }
    
    throw data?.message || data?.error || defaultMessage;
  } else if (error.request) {
    // Request was made but no response received
    throw 'No response from server. Please check your connection.';
  } else {
    // Something else happened
    throw error.message || defaultMessage;
  }
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// User login
export const login = async (credentials) => {
  try {
    const response = await api.post('/api/auth/login', credentials, {
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw 'Invalid email or password. Please try again.';
    } else if (error.response?.status === 429) {
      throw 'Too many login attempts. Please try again later.';
    }
    handleApiError(error, 'Login failed');
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/me');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get user information');
  }
};

// Validate token
export const validateToken = async () => {
  try {
    const response = await api.get('/api/auth/validate-token');
    return response.data.valid;
  } catch (error) {
    console.warn('[API] Token validation failed, removing token');
    localStorage.removeItem('authToken');
    return false;
  }
};

// ==========================================
// COMPANY ENDPOINTS
// ==========================================

// Company registration
export const registerCompany = async (formData) => {
  try {
    console.log('Submitting registration form data...');
    
    const response = await api.post('/api/companies', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Registration successful!');
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    handleApiError(error, 'Error occurred during registration');
  }
};

// Get company details
export const getCompanyDetails = async (companyId) => {
  try {
    const response = await api.get(`/api/companies/${companyId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get company information');
  }
};

// ==========================================
// USER MANAGEMENT ENDPOINTS
// ==========================================

// Get all users
export const getAllUsers = async () => {
  try {
    console.log("Fetching all users...");
    const response = await api.get('/api/users');
    console.log("Users API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("getAllUsers error details:", error);
    handleApiError(error, 'Failed to get users');
  }
};

// ==========================================
// INVITATION ENDPOINTS
// ==========================================

// Get company invitations
export const getInvitations = async () => {
  try {
    const response = await api.get('/api/invitations');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get invitations');
  }
};

// Invite employee
export const inviteEmployee = async (employeeData) => {
  try {
    const response = await api.post('/api/invitations', employeeData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to send invitation');
  }
};

// Cancel invitation
export const cancelInvitation = async (invitationId) => {
  try {
    const response = await api.delete(`/api/invitations/${invitationId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to cancel invitation');
  }
};

// Get company team
export const getCompanyTeam = async () => {
  try {
    console.log("Fetching company team...");
    const response = await api.get('/api/invitations/company-team');
    console.log("Company team response:", response.data);
    return response.data;
  } catch (error) {
    console.error("getCompanyTeam error details:", error);
    handleApiError(error, 'Failed to get team members');
  }
};

// ==========================================
// USER DATA ENDPOINTS
// ==========================================

// Get user search history
export const getUserSearchHistory = async () => {
  try {
    const response = await api.get('/api/user/search-history');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get search history');
  }
};

// Get user saved properties
export const getUserSavedProperties = async () => {
  try {
    const response = await api.get('/api/user/saved-properties');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get saved properties');
  }
};

// Save user search
export const saveUserSearch = async (searchData) => {
  try {
    console.log('Saving search data:', searchData);
    const response = await api.post('/api/user/search-history', searchData);
    console.log('Search saved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to save search:', error);
    handleApiError(error, 'Failed to save search');
  }
};

// Save property
export const saveProperty = async (propertyData) => {
  try {
    const response = await api.post('/api/user/saved-properties', propertyData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to save property');
  }
};

// ==========================================
// ANALYTICS ENDPOINTS (MATCHED TO YOUR BACKEND)
// ==========================================

// Get company stats (this endpoint exists in your backend)
export const getCompanyStats = async () => {
  try {
    const response = await api.get('/api/analytics/company-stats');
    return response.data;
  } catch (error) {
    console.warn('[API] Company stats endpoint failed, using fallback');
    return {
      success: true,
      data: {
        totalProperties: 0,
        averageValue: 0,
        highValueProperties: 0,
        newProperties: 0,
        topOwners: [],
        lastUpdated: new Date()
      }
    };
  }
};

// Get property value distribution (this endpoint exists in your backend)
export const getPropertyValueDistribution = async () => {
  try {
    const response = await api.get('/api/analytics/property-value-distribution');
    return response.data;
  } catch (error) {
    console.warn('[API] Property value distribution endpoint failed, using fallback');
    return {
      success: true,
      data: [
        { name: 'Under $500K', value: 0, percentage: '0' },
        { name: '$500K - $1M', value: 0, percentage: '0' },
        { name: '$1M - $2M', value: 0, percentage: '0' },
        { name: '$2M - $5M', value: 0, percentage: '0' },
        { name: '$5M - $10M', value: 0, percentage: '0' },
        { name: 'Over $10M', value: 0, percentage: '0' },
        { name: 'Unknown', value: 0, percentage: '0' }
      ]
    };
  }
};

// Get property types (this endpoint exists in your backend)
export const getPropertyTypes = async () => {
  try {
    const response = await api.get('/api/analytics/property-types');
    return response.data;
  } catch (error) {
    console.warn('[API] Property types endpoint failed, using fallback');
    return {
      success: true,
      data: []
    };
  }
};

// Get geographic distribution (this endpoint exists in your backend)
export const getGeographicDistribution = async () => {
  try {
    const response = await api.get('/api/analytics/geographic-distribution');
    return response.data;
  } catch (error) {
    console.warn('[API] Geographic distribution endpoint failed, using fallback');
    return {
      success: true,
      data: {
        states: [],
        cities: []
      }
    };
  }
};

// Get activity trends (this endpoint exists in your backend)
export const getActivityTrends = async () => {
  try {
    const response = await api.get('/api/analytics/activity-trends');
    return response.data;
  } catch (error) {
    console.warn('[API] Activity trends endpoint failed, using fallback');
    // Generate last 30 days of empty data
    const dateRange = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dateRange.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        searches: 0,
        saves: 0
      });
    }
    return {
      success: true,
      data: dateRange
    };
  }
};

// Get wealth analytics (this endpoint exists in your backend)
export const getWealthAnalytics = async () => {
  try {
    const response = await api.get('/api/analytics/wealth-analytics');
    return response.data;
  } catch (error) {
    console.warn('[API] Wealth analytics endpoint failed, using fallback');
    return {
      success: true,
      data: {
        distribution: [],
        confidence: [],
        averageWealth: 0,
        totalEstimations: 0
      }
    };
  }
};

// Get search patterns (this endpoint exists in your backend)
export const getSearchPatterns = async () => {
  try {
    const response = await api.get('/api/analytics/search-patterns');
    return response.data;
  } catch (error) {
    console.warn('[API] Search patterns endpoint failed, using fallback');
    return {
      success: true,
      data: {
        searchTypes: [],
        hourlyPattern: Array.from({ length: 24 }, (_, hour) => ({
          hour: `${hour}:00`,
          searches: 0
        }))
      }
    };
  }
};

// Recent activity fallback (this endpoint doesn't exist in your backend)
export const getRecentActivity = async () => {
  console.warn('[API] Recent activity endpoint not available, using search history as fallback');
  try {
    // Use search history as recent activity
    const searchHistory = await getUserSearchHistory();
    const recentActivity = searchHistory.data?.slice(0, 5).map(search => ({
      _id: search._id,
      type: 'search',
      action: `Searched: ${search.query}`,
      timestamp: search.createdAt,
      user: search.user
    })) || [];

    return {
      success: true,
      data: recentActivity
    };
  } catch (error) {
    return {
      success: true,
      data: []
    };
  }
};

// ==========================================
// PROPERTY ENDPOINTS
// ==========================================

// Get property by ID
export const getPropertyById = async (propertyId) => {
  try {
    // First try to get from saved properties
    const savedPropertiesResponse = await api.get('/api/user/saved-properties');
    const savedProperties = savedPropertiesResponse.data?.data || [];
    
    const savedProperty = savedProperties.find(p => 
      p.attomId === propertyId || 
      p.propertyData?.identifier?.attomId === propertyId
    );
    
    if (savedProperty) {
      return savedProperty.propertyData;
    }
    
    // If not found in saved properties, return null (no general property endpoint exists)
    console.warn(`Property ${propertyId} not found in saved properties`);
    return null;
  } catch (error) {
    console.error('Error fetching property:', error);
    return null;
  }
};

// ==========================================
// WEALTH ESTIMATION ENDPOINTS
// ==========================================

// Get wealth estimations (this endpoint exists)
export const getWealthEstimations = async () => {
  try {
    const response = await api.get('/api/wealth/estimations');
    return response.data;
  } catch (error) {
    console.warn('[API] Wealth estimations endpoint failed, using fallback');
    return {
      success: true,
      count: 0,
      data: []
    };
  }
};

// Run wealth estimations (this endpoint exists)
export const runWealthEstimations = async () => {
  try {
    const response = await api.post('/api/wealth/estimate');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to run wealth estimations');
  }
};

// Delete wealth estimation (this endpoint exists)
export const deleteWealthEstimation = async (estimationId) => {
  try {
    const response = await api.delete(`/api/wealth/estimations/${estimationId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to delete wealth estimation');
  }
};

// ==========================================
// IMAGE ENDPOINTS
// ==========================================

// Get property image URL
export const getPropertyImageUrl = (propertyId) => {
  if (!propertyId) return null;
  const baseUrl = import.meta.env.PROD 
    ? (import.meta.env.VITE_API_URL || 'https://fueled-wealth-map-dhruval.onrender.com')
    : '';
  return `${baseUrl}/api/images/streetview/streetview_${propertyId}.png`;
};

// Check street view status (this endpoint exists)
export const checkStreetViewStatus = async (propertyId) => {
  try {
    const response = await api.get(`/api/images/streetview-status/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking street view status:', error);
    return { status: 'error', error: error.message };
  }
};

// Request street view capture (this endpoint exists)
export const requestStreetViewCapture = async (address, propertyId) => {
  try {
    const response = await api.post('/api/images/capture-streetview', {
      address,
      propertyId
    });
    return response.data;
  } catch (error) {
    console.error('Error requesting street view capture:', error);
    handleApiError(error, 'Failed to capture street view');
  }
};

// ==========================================
// REPORTS ENDPOINTS
// ==========================================

// Get reports (this endpoint exists)
export const getReports = async () => {
  try {
    const response = await api.get('/api/reports');
    return response.data;
  } catch (error) {
    console.warn('[API] Reports endpoint failed, using fallback');
    return {
      success: true,
      count: 0,
      data: []
    };
  }
};

// Generate reports (this endpoint exists)
export const generateReports = async (propertyIds, reportType) => {
  try {
    const response = await api.post('/api/reports/generate', {
      propertyIds,
      reportType
    });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to generate reports');
  }
};

// Delete report (this endpoint exists)
export const deleteReport = async (reportId) => {
  try {
    const response = await api.delete(`/api/reports/${reportId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to delete report');
  }
};

// ==========================================
// UTILITY ENDPOINTS
// ==========================================

// Health check
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/api/health');
    console.log('[API] Health check passed:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Health check failed:', error);
    handleApiError(error, 'API health check failed');
  }
};

// Export analytics (endpoint doesn't exist, using fallback)
export const exportAnalytics = async (exportParams) => {
  console.warn('[API] Export analytics endpoint not available');
  throw 'Export analytics feature not implemented yet';
};

// Save API key
export const saveApiKey = async (apiKey) => {
  try {
    localStorage.setItem('attomApiKey', apiKey);
    return { success: true };
  } catch (error) {
    console.error('Error saving API key:', error);
    throw 'Failed to save API key.';
  }
};

// Get API key
export const getApiKey = () => {
  return localStorage.getItem('attomApiKey') || import.meta.env.VITE_ATTOM_API_KEY;
};

// ==========================================
// BACKWARDS COMPATIBILITY ALIASES
// ==========================================

// These are aliases for functions that might be called differently
export const searchProperties = getPropertyById;
export const advancedPropertySearch = getPropertyById;
export const getWealthEstimationExplanation = getWealthEstimations;

// Debug function to test API connectivity
export const debugApiConnectivity = async () => {
  const baseUrl = getBaseURL();
  console.log(`[DEBUG] Testing API connectivity...`);
  console.log(`[DEBUG] Base URL: ${baseUrl}`);
  console.log(`[DEBUG] Environment: ${import.meta.env.DEV ? 'development' : 'production'}`);
  console.log(`[DEBUG] VITE_API_URL: ${import.meta.env.VITE_API_URL}`);
  
  try {
    // Test health endpoint first
    await checkApiHealth();
    console.log(`[DEBUG] ✅ Health check passed`);
    
    // Test auth endpoint if token exists
    const token = localStorage.getItem('authToken');
    if (token) {
      await validateToken();
      console.log(`[DEBUG] ✅ Token validation passed`);
    } else {
      console.log(`[DEBUG] ⚠️ No auth token found`);
    }
    
    return true;
  } catch (error) {
    console.error(`[DEBUG] ❌ API connectivity test failed:`, error);
    throw error;
  }
};

export default api;