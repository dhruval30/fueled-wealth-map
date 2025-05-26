import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'https://fueled-wealth-map-dhruval.onrender.com/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to handle auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error.response || error);
    return Promise.reject(error);
  }
);

// Company registration - USE API INSTANCE
export const registerCompany = async (formData) => {
  try {
    console.log('Submitting registration form data...');
    
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
    
    // ✅ Use api instance instead of axios directly
    const response = await api.post('/companies', formData);
    
    console.log('Registration successful!');
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.response) {
      throw error.response.data?.message || `Server error: ${error.response.status}`;
    } else if (error.request) {
      throw 'No response from server. Please check your connection.';
    } else {
      throw error.message || 'Error occurred during registration';
    }
  }
};

// User login - USE API INSTANCE
export const login = async (credentials) => {
  try {
    // ✅ Use api instance instead of axios directly
    const response = await api.post('/auth/login', credentials, {
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        throw 'Invalid email or password. Please try again.';
      } else if (error.response.status === 429) {
        throw 'Too many login attempts. Please try again later.';
      } else {
        throw error.response.data?.message || 'Login failed';
      }
    } else if (error.request) {
      throw 'No response from server. Please check your connection.';
    } else {
      throw 'Login failed. Please try again.';
    }
  }
};

// Health check - USE API INSTANCE
export const checkApiHealth = async () => {
  try {
    // ✅ Use api instance instead of axios directly
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw 'API health check failed.';
  }
};

// Street view functions - USE API INSTANCE
export const checkStreetViewStatus = async (propertyId) => {
  try {
    // ✅ Use api instance instead of axios directly
    const response = await api.get(`/images/streetview-status/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking street view status:', error);
    return { status: 'error', error: error.message };
  }
};

export const requestStreetViewCapture = async (address, propertyId) => {
  try {
    // ✅ Remove duplicate /api from path
    const response = await api.post('/images/capture-streetview', {
      address,
      propertyId
    });
    return response.data;
  } catch (error) {
    console.error('Error requesting street view capture:', error);
    if (error.response) {
      throw error.response.data?.message || 'Failed to capture street view';
    }
    throw 'Failed to capture street view';
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get user';
    }
    throw 'Failed to get user information.';
  }
};

// Get company details
export const getCompanyDetails = async (companyId) => {
  try {
    const response = await api.get(`/companies/${companyId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get company details';
    }
    throw 'Failed to get company information.';
  }
};

// Get company invitations
export const getInvitations = async () => {
  try {
    const response = await api.get('/invitations');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get invitations';
    }
    throw 'Failed to get invitations.';
  }
};

// Invite employee
export const inviteEmployee = async (employeeData) => {
  try {
    const response = await api.post('/invitations', employeeData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to send invitation';
    }
    throw 'Failed to send invitation.';
  }
};

// Cancel invitation
export const cancelInvitation = async (invitationId) => {
  try {
    const response = await api.delete(`/invitations/${invitationId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to cancel invitation';
    }
    throw 'Failed to cancel invitation.';
  }
};

export const validateToken = async () => {
  try {
    const response = await api.get('/auth/validate-token');
    return response.data.valid;
  } catch (error) {
    localStorage.removeItem('authToken');
    return false;
  }
};

export const getAllUsers = async () => {
  try {
    console.log("Fetching all users...");
    const response = await api.get('/users');
    console.log("Users API response:", response);
    return response.data;
  } catch (error) {
    console.error("getAllUsers error details:", error);
    if (error.response) {
      throw error.response.data?.message || 'Failed to get users';
    }
    throw 'Failed to get users.';
  }
};

export const getCompanyTeam = async () => {
  try {
    console.log("Fetching company team...");
    const response = await api.get('/invitations/company-team');
    console.log("Company team response:", response);
    return response.data;
  } catch (error) {
    console.error("getCompanyTeam error details:", error);
    if (error.response) {
      throw error.response.data?.message || 'Failed to get team members';
    }
    throw 'Failed to get team members.';
  }
};

export const getUserSearchHistory = async () => {
  try {
    const response = await api.get('/user/search-history');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get search history';
    }
    throw 'Failed to get search history.';
  }
};

export const getUserSavedProperties = async () => {
  try {
    const response = await api.get('/user/saved-properties');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get saved properties';
    }
    throw 'Failed to get saved properties.';
  }
};

export const getCompanyStats = async () => {
  try {
    const response = await api.get('/analytics/company-stats');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get company statistics';
    }
    throw 'Failed to get company statistics.';
  }
};

export const saveUserSearch = async (searchData) => {
  try {
    console.log('Saving search data:', searchData);
    const response = await api.post('/user/search-history', searchData);
    console.log('Search saved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to save search:', error);
    console.error('Response data:', error.response?.data);
    console.error('Request data:', searchData);
    
    if (error.response) {
      throw error.response.data?.message || 'Failed to save search';
    }
    throw 'Failed to save search.';
  }
};

export const saveProperty = async (propertyData) => {
  try {
    const response = await api.post('/user/saved-properties', propertyData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to save property';
    }
    throw 'Failed to save property.';
  }
};

export const searchProperties = async (searchParams) => {
  try {
    const response = await api.post('/properties/search', searchParams);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to search properties';
    }
    throw 'Failed to search properties.';
  }
};

export const advancedPropertySearch = async (filters) => {
  try {
    const response = await api.post('/properties/advanced-search', filters);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to perform advanced search';
    }
    throw 'Failed to perform advanced search.';
  }
};

export const getPropertyById = async (propertyId) => {
  try {
    const savedPropertiesResponse = await api.get('/user/saved-properties');
    const savedProperties = savedPropertiesResponse.data?.data || [];
    
    const savedProperty = savedProperties.find(p => 
      p.attomId === propertyId || 
      p.propertyData?.identifier?.attomId === propertyId
    );
    
    if (savedProperty) {
      return savedProperty.propertyData;
    }
    
    const response = await api.get(`/properties/${propertyId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching property:', error);
    if (error.response) {
      throw error.response.data?.message || 'Failed to get property details';
    }
    throw 'Failed to get property details.';
  }
};

export const exportAnalytics = async (exportParams) => {
  try {
    const response = await api.post('/analytics/export', exportParams, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics-${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to export analytics';
    }
    throw 'Failed to export analytics.';
  }
};

export const saveApiKey = async (apiKey) => {
  try {
    localStorage.setItem('attomApiKey', apiKey);
    return { success: true };
  } catch (error) {
    console.error('Error saving API key:', error);
    throw 'Failed to save API key.';
  }
};

export const getPropertyImageUrl = (propertyId) => {
  if (!propertyId) return null;
  // ✅ Use full URL for production
  return `https://fueled-wealth-map-dhruval.onrender.com/api/images/streetview/streetview_${propertyId}.png`;
};

export const getWealthEstimations = async () => {
  try {
    const response = await api.get('/wealth/estimations');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get wealth estimations';
    }
    throw 'Failed to get wealth estimations.';
  }
};

export const runWealthEstimations = async () => {
  try {
    const response = await api.post('/wealth/estimate');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to run wealth estimations';
    }
    throw 'Failed to run wealth estimations.';
  }
};

export const getWealthEstimationExplanation = async (estimationId) => {
  try {
    const response = await api.get(`/wealth/estimations/${estimationId}/explanation`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get estimation explanation';
    }
    throw 'Failed to get estimation explanation.';
  }
};

export const deleteWealthEstimation = async (estimationId) => {
  try {
    const response = await api.delete(`/wealth/estimations/${estimationId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to delete wealth estimation';
    }
    throw 'Failed to delete wealth estimation.';
  }
};

export const getPropertyValueDistribution = async () => {
  try {
    const response = await api.get('/analytics/property-value-distribution');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get property value distribution';
    }
    throw 'Failed to get property value distribution';
  }
};

export const getPropertyTypes = async () => {
  try {
    const response = await api.get('/analytics/property-types');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get property types';
    }
    throw 'Failed to get property types';
  }
};

export const getGeographicDistribution = async () => {
  try {
    const response = await api.get('/analytics/geographic-distribution');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get geographic distribution';
    }
    throw 'Failed to get geographic distribution';
  }
};

export const getActivityTrends = async () => {
  try {
    const response = await api.get('/analytics/activity-trends');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get activity trends';
    }
    throw 'Failed to get activity trends';
  }
};

export const getWealthAnalytics = async () => {
  try {
    const response = await api.get('/analytics/wealth-analytics');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get wealth analytics';
    }
    throw 'Failed to get wealth analytics';
  }
};

export const getSearchPatterns = async () => {
  try {
    const response = await api.get('/analytics/search-patterns');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get search patterns';
    }
    throw 'Failed to get search patterns';
  }
};

export const getReports = async () => {
  try {
    const response = await api.get('/reports');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get reports';
    }
    throw 'Failed to get reports.';
  }
};

export const generateReports = async (propertyIds, reportType) => {
  try {
    const response = await api.post('/reports/generate', {
      propertyIds,
      reportType
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to generate reports';
    }
    throw 'Failed to generate reports.';
  }
};

export const deleteReport = async (reportId) => {
  try {
    const response = await api.delete(`/reports/${reportId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to delete report';
    }
    throw 'Failed to delete report.';
  }
};

export const getReportPdf = async (reportId) => {
  try {
    const response = await api.get(`/reports/${reportId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get report PDF';
    }
    throw 'Failed to get report PDF.';
  }
};

export const getApiKey = () => {
  return localStorage.getItem('attomApiKey') || process.env.REACT_APP_ATTOM_API_KEY;
};

export default api;