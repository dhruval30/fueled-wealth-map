import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: '/api', // This will use your Vite proxy
  timeout: 10000,
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

export default api;