import axios from 'axios';

// API Base URL - adjust based on your backend deployment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vendor-onboarding-mgmt.azurewebsites.net/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Check for procurement user token first, then vendor token
    const token = localStorage.getItem('authToken') || localStorage.getItem('vendorAuthToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request with auth token:', config.method.toUpperCase(), config.url);
    } else {
      console.warn('API Request without auth token:', config.method.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized error on:', error.config.url);
      
      // Check if we're on vendor or login pages - if so, don't do anything
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath === '/signup' || 
          currentPath === '/vendor-login' || currentPath === '/vendor-onboarding-form') {
        console.log('On vendor/login page, not clearing storage or redirecting');
        return Promise.reject(error);
      }
      
      // Check if we have a procurement token - if not, we're already logged out
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No procurement token found, user already logged out');
        return Promise.reject(error);
      }
      
      console.log('Token exists but got 401 - token might be invalid or expired');
      
      // DON'T redirect immediately - let components handle it
      // Just clear the procurement storage (don't clear vendor tokens)
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('isAuthenticated');
      
      console.warn('Cleared authentication - components will handle redirect');
    }
    return Promise.reject(error);
  }
);

export default api;
