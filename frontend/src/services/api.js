import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: '/api', // This will use your Vite proxy
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

// Company registration - special handling for FormData
export const registerCompany = async (formData) => {
  try {
    console.log('Submitting registration form data...');
    
    // Log what we're sending
    const formDataEntries = {};
    for (let [key, value] of formData.entries()) {
      // Don't log the actual password value
      if (key === 'password') {
        formDataEntries[key] = '********';
      } else if (key === 'logo' && value instanceof File) {
        formDataEntries[key] = `${value.name} (${value.type}, ${value.size} bytes)`;
      } else {
        formDataEntries[key] = value;
      }
    }
    console.log('Form data entries:', formDataEntries);
    
    // Important: Don't manually set Content-Type for FormData
    const response = await axios.post('/api/companies', formData);
    
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

// User login
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Login failed';
    }
    throw 'Login failed. Please try again.';
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

// Health check
export const checkApiHealth = async () => {
  try {
    const response = await axios.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw 'API health check failed.';
  }
};

// In your api.js
export const validateToken = async () => {
  try {
    const response = await api.get('/auth/validate-token');
    return response.data.valid;
  } catch (error) {
    // Clear invalid token
    localStorage.removeItem('authToken');
    return false;
  }
};

// Fixed: Changed from authFetch to api.get
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

// api.js
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

// Get user's saved properties
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

// Get company-wide statistics
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

// Save a user's search
export const saveUserSearch = async (searchData) => {
  try {
    const response = await api.post('/user/search-history', searchData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to save search';
    }
    throw 'Failed to save search.';
  }
};

// Save a property for a user
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

// Get recent company activity
export const getRecentActivity = async () => {
  try {
    const response = await api.get('/analytics/recent-activity');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data?.message || 'Failed to get recent activity';
    }
    throw 'Failed to get recent activity.';
  }
};

// Search properties with filters
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

// Advanced property search
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

// Get property details by ID
export const getPropertyById = async (propertyId) => {
  try {
    // First, try to get from saved properties in cache
    const savedPropertiesResponse = await api.get('/user/saved-properties');
    const savedProperties = savedPropertiesResponse.data?.data || [];
    
    // Check if the property exists in saved properties
    const savedProperty = savedProperties.find(p => 
      p.attomId === propertyId || 
      p.propertyData?.identifier?.attomId === propertyId
    );
    
    if (savedProperty) {
      return savedProperty.propertyData;
    }
    
    // If not found in saved properties, try to get from the API
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

// Export analytics data
export const exportAnalytics = async (exportParams) => {
  try {
    const response = await api.post('/analytics/export', exportParams, {
      responseType: 'blob'
    });
    
    // Create a download link
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

// Save API key
export const saveApiKey = async (apiKey) => {
  try {
    // Store ATTOM API key in localStorage (you might want to store it securely on server)
    localStorage.setItem('attomApiKey', apiKey);
    return { success: true };
  } catch (error) {
    console.error('Error saving API key:', error);
    throw 'Failed to save API key.';
  }
};


// Add these functions to your api.js file

/**
 * Get a street view image URL for a property
 * @param {string|number} propertyId - The property ID (ATTOM ID)
 * @returns {string} - URL to the street view image
 */
export const getPropertyImageUrl = (propertyId) => {
  if (!propertyId) return null;
  return `/api/images/streetview/streetview_${propertyId}.png`;
};

/**
 * Check if a street view image exists and get its status
 * @param {string|number} propertyId - The property ID (ATTOM ID)
 * @returns {Promise<Object>} - Status object with information about the image
 */
export const checkStreetViewStatus = async (propertyId) => {
  try {
    const response = await axios.get(`/api/images/streetview-status/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking street view status:', error);
    return { status: 'error', error: error.message };
  }
};

/**
 * Request a new street view capture for a property
 * @param {string} address - The property address
 * @param {string|number} propertyId - The property ID (ATTOM ID)
 * @returns {Promise<Object>} - Response with status of the capture request
 */
export const requestStreetViewCapture = async (address, propertyId) => {
  try {
    const response = await api.post('/api/images/capture-streetview', {
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

// Get API key
export const getApiKey = () => {
  return localStorage.getItem('attomApiKey') || process.env.REACT_APP_ATTOM_API_KEY;
};

export default api;