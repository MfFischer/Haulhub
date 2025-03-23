import axios from 'axios';
import { toast } from 'react-toastify';

// Create API instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    // Handle different error scenarios
    if (!response) {
      // Network error or server down
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }
    
    switch (response.status) {
      case 401:
        // Unauthorized - token expired or invalid
        toast.error('Session expired. Please log in again.');
        
        // Clear auth data
        localStorage.removeItem('authToken');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        break;
        
      case 403:
        // Forbidden - user doesn't have permission
        toast.error('You do not have permission to perform this action.');
        break;
        
      case 404:
        // Not found
        // Don't toast for 404s as they might be expected in some cases
        break;
        
      case 422:
        // Validation errors
        const validationErrors = response.data.errors;
        if (validationErrors && Array.isArray(validationErrors)) {
          validationErrors.forEach(error => {
            toast.error(error.msg || error.message || 'Validation error');
          });
        } else {
          toast.error(response.data.message || 'Validation error');
        }
        break;
        
      case 500:
        // Server error
        toast.error('Server error. Please try again later.');
        break;
        
      default:
        // Other errors
        if (response.data && response.data.message) {
          toast.error(response.data.message);
        } else {
          toast.error('An error occurred. Please try again.');
        }
    }
    
    return Promise.reject(error);
  }
);

export default api;