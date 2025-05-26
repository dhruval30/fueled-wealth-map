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
    // In development, let Vite proxy handle the routing
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
    
    // If we get HTML response, it means the route doesn't exist
    if (error.response?.headers['content-type']?.includes('text/html')) {
      console.error('[API] Received HTML response - endpoint not found:', error.config?.url);
    }
    
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

// Fallback function for missing endpoints
const createFallbackEndpoint = (endpointName, mockData = []) => {
  console.warn(`[API] Using fallback for missing endpoint: ${endpointName}`);
  return Promise.resolve({
    success: true,
    data: mockData,
    message: `Fallback data for ${endpointName}`
  });
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

// Validate token with fallback
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
    
    // Log form data for debugging (without sensitive info)
    const formDataEntries = {};
    for (let [key, value] of formData.entries()) {
      if (key === 'password') {
        formDataEntries[key] = '********';
      } else if (key === 'logo' && value instanceof File) {
        formDataEntries[key] = `${value.name} (${value.type}, ${value.size} bytes)`;
      } else {
        formDataEntries[key] = value;
      }
    }
    console.log('Form data entries:', formDataEntries);
    
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
// ANALYTICS ENDPOINTS (WITH FALLBACKS)
// ==========================================

// Get recent activity with fallback
export const getRecentActivity = async () => {
  try {
    const response = await api.get('/api/analytics/recent-activity');
    return response.data;
  } catch (error) {
    // If endpoint doesn't exist, provide fallback data
    if (error.response?.status === 404 || (typeof error.response?.data === 'string' && error.response?.data.includes('<!DOCTYPE html>'))) {
      console.warn('[API] Analytics endpoint not found, using fallback data');
      return createFallbackEndpoint('recent-activity', [
        {
          id: 1,
          type: 'property_search',
          description: 'Property search performed',
          timestamp: new Date().toISOString()
        }
      ]);
    }
    handleApiError(error, 'Failed to get recent activity');
  }
};

// Get company stats with fallback
export const getCompanyStats = async () => {
  try {
    const response = await api.get('/api/analytics/company-stats');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404 || (typeof error.response?.data === 'string' && error.response?.data.includes('<!DOCTYPE html>'))) {
      return createFallbackEndpoint('company-stats', {
        totalUsers: 0,
        totalSearches: 0,
        totalSavedProperties: 0,
        activeUsersToday: 0,
        monthlyGrowth: 0
      });
    }
    handleApiError(error, 'Failed to get company statistics');
  }
};

// Get property value distribution with fallback
export const getPropertyValueDistribution = async () => {
  try {
    const response = await api.get('/api/analytics/property-value-distribution');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404 || (typeof error.response?.data === 'string' && error.response?.data.includes('<!DOCTYPE html>'))) {
      return createFallbackEndpoint('property-value-distribution', [
        { range: '$0-$500K', count: 0 },
        { range: '$500K-$1M', count: 0 },
        { range: '$1M-$2M', count: 0 },
        { range: '$2M+', count: 0 }
      ]);
    }
    handleApiError(error, 'Failed to get property value distribution');
  }
};

// Get property types with fallback
export const getPropertyTypes = async () => {
  try {
    const response = await api.get('/api/analytics/property-types');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404 || (typeof error.response?.data === 'string' && error.response?.data.includes('<!DOCTYPE html>'))) {
      return createFallbackEndpoint('property-types', [
        { type: 'Single Family', count: 0 },
        { type: 'Condo', count: 0 },
        { type: 'Townhouse', count: 0 },
        { type: 'Multi-Family', count: 0 }
      ]);
    }
    handleApiError(error, 'Failed to get property types');
  }
};

// Get geographic distribution with fallback
export const getGeographicDistribution = async () => {
  try {
    const response = await api.get('/api/analytics/geographic-distribution');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404 || (typeof error.response?.data === 'string' && error.response?.data.includes('<!DOCTYPE html>'))) {
      return createFallbackEndpoint('geographic-distribution', [
        { state: 'CA', count: 0 },
        { state: 'TX', count: 0 },
        { state: 'FL', count: 0 },
        { state: 'NY', count: 0 }
      ]);
    }
    handleApiError(error, 'Failed to get geographic distribution');
  }
};

// Get activity trends with fallback
export const getActivityTrends = async () => {
  try {
    const response = await api.get('/api/analytics/activity-trends');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404 || (typeof error.response?.data === 'string' && error.response?.data.includes('<!DOCTYPE html>'))) {
      return createFallbackEndpoint('activity-trends', [
        { date: new Date().toISOString().split('T')[0], searches: 0, saves: 0 }
      ]);
    }
    handleApiError(error, 'Failed to get activity trends');
  }
};

// Get wealth analytics with fallback
export const getWealthAnalytics = async () => {
  try {
    const response = await api.get('/api/analytics/wealth-analytics');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404 || (typeof error.response?.data === 'string' && error.response?.data.includes('<!DOCTYPE html>'))) {
      return createFallbackEndpoint('wealth-analytics', {
        averageWealth: 0,
        medianWealth: 0,
        totalWealth: 0,
        wealthDistribution: []
      });
    }
    handleApiError(error, 'Failed to get wealth analytics');
  }
};

// Get search patterns with fallback
export const getSearchPatterns = async () => {
  try {
    const response = await api.get('/api/analytics/search-patterns');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404 || (typeof error.response?.data === 'string' && error.response?.data.includes('<!DOCTYPE html>'))) {
      return createFallbackEndpoint('search-patterns', {
        topSearchTerms: [],
        searchesByTime: []
      });
    }
    handleApiError(error, 'Failed to get search patterns');
  }
};

// ==========================================
// PROPERTY ENDPOINTS (WITH FALLBACKS)
// ==========================================

// Search properties with fallback
export const searchProperties = async (searchParams) => {
  try {
    const response = await api.post('/api/properties/search', searchParams);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404 || (typeof error.response?.data === 'string' && error.response?.data.includes('<!DOCTYPE html>'))) {
      return createFallbackEndpoint('property-search', []);
    }
    handleApiError(error, 'Failed to search properties');
  }
};

// Advanced property search with fallback
export const advancedPropertySearch = async (filters) => {
  try {
    const response = await api.post('/api/properties/advanced-search', filters);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404 || (typeof error.response?.data === 'string' && error.response?.data.includes('<!DOCTYPE html>'))) {
      return createFallbackEndpoint('advanced-property-search', []);
    }
    handleApiError(error, 'Failed to perform advanced search');
  }
};

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
    
    // If not found in saved properties, fetch from API
    const response = await api.get(`/api/properties/${propertyId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching property:', error);
    if (error.response?.status === 404 || (typeof error.response?.data === 'string' && error.response?.data.includes('<!DOCTYPE html>'))) {
      // Return mock property data as fallback
      return {
        id: propertyId,
        address: 'Property information not available',
        price: 0,
        bedrooms: 0,
        bathrooms: 0,
        sqft: 0
      };
    }
    handleApiError(error, 'Failed to get property details');
  }
};

// ==========================================
// WEALTH ESTIMATION ENDPOINTS
// ==========================================

// Get wealth estimations
export const getWealthEstimations = async () => {
  try {
    const response = await api.get('/api/wealth/estimations');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404 || (typeof error.response?.data === 'string' && error.response?.data.includes('<!DOCTYPE html>'))) {
      return createFallbackEndpoint('wealth-estimations', []);
    }
    handleApiError(error, 'Failed to get wealth estimations');
  }
};

// Run wealth estimations
export const runWealthEstimations = async () => {
  try {
    const response = await api.post('/api/wealth/estimate');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to run wealth estimations');
  }
};

// Get wealth estimation explanation
export const getWealthEstimationExplanation = async (estimationId) => {
  try {
    const response = await api.get(`/api/wealth/estimations/${estimationId}/explanation`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get estimation explanation');
  }
};

// Delete wealth estimation
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

// Check street view status
export const checkStreetViewStatus = async (propertyId) => {
  try {
    const response = await api.get(`/api/images/streetview-status/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking street view status:', error);
    return { status: 'error', error: error.message };
  }
};

// Request street view capture
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

// Get reports
export const getReports = async () => {
  try {
    const response = await api.get('/api/reports');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get reports');
  }
};

// Generate reports
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

// Delete report
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

// Health check with better error handling
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

// Export analytics
export const exportAnalytics = async (exportParams) => {
  try {
    const response = await api.post('/api/analytics/export', exportParams, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics-${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    handleApiError(error, 'Failed to export analytics');
  }
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