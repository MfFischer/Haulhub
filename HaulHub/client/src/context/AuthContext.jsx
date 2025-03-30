import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'hauler' or 'poster'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      
      try {
        // Check for token in localStorage
        const token = localStorage.getItem('token');
        const storedUserType = localStorage.getItem('userType');
        
        if (!token) {
          // No token found, not authenticated
          setIsAuthenticated(false);
          setCurrentUser(null);
          setUserRole(null);
          setIsLoading(false);
          return;
        }
        
        // Dev mode quick login (bypass API call)
        if (process.env.NODE_ENV === 'development') {
          console.log('DEV MODE: Auto-logged in as Test Hauler');
          setIsAuthenticated(true);
          setCurrentUser({
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
            userType: storedUserType || 'hauler'
          });
          setUserRole(storedUserType || 'hauler');
          setIsLoading(false);
          return;
        }
        
        // Verify token with backend (only in production)
        const response = await api.get('/auth/verify');
        
        // Set auth state based on response
        setIsAuthenticated(true);
        setCurrentUser(response.data.user);
        setUserRole(response.data.user.userType);
        
        // Update localStorage if needed
        if (response.data.user.userType !== storedUserType) {
          localStorage.setItem('userType', response.data.user.userType);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        
        // In development mode, don't clear tokens on error
        if (process.env.NODE_ENV !== 'development') {
          // Clear invalid token in production
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
          
          setIsAuthenticated(false);
          setCurrentUser(null);
          setUserRole(null);
          setError('Authentication failed. Please log in again.');
        } else {
          // In development, keep the session active despite API errors
          const storedUserType = localStorage.getItem('userType');
          if (localStorage.getItem('token')) {
            console.log('DEV MODE: Maintaining authentication despite API error');
            setIsAuthenticated(true);
            setCurrentUser({
              id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
              userType: storedUserType || 'hauler'
            });
            setUserRole(storedUserType || 'hauler');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Login function
  const login = async (email, password) => {
    try {
      // DEVELOPMENT MODE BYPASS
      if (process.env.NODE_ENV === 'development') {
        console.log('DEV MODE: Bypassing API login');
        
        // Determine user type based on email
        const userType = email.includes('hauler') ? 'hauler' : 'poster';
        const userName = userType === 'hauler' ? 'Test Hauler' : 'Test Poster';
        
        // Store token and user type
        localStorage.setItem('token', 'dev-token-123456');
        localStorage.setItem('userType', userType);
        
        // Update state
        setIsAuthenticated(true);
        setCurrentUser({
          id: `test-${userType}-id`,
          name: userName,
          email: email,
          userType: userType
        });
        setUserRole(userType);
        setError(null);
        
        return true;
      }
      
      // PRODUCTION MODE - ACTUAL API CALL
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      const { token, user } = response.data;
      
      // Store token and user type
      localStorage.setItem('token', token);
      localStorage.setItem('userType', user.userType); 
      
      // Update state
      setIsAuthenticated(true);
      setCurrentUser(user);
      setUserRole(user.userType);
      setError(null);
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      
      // For development mode, still log in on error
      if (process.env.NODE_ENV === 'development') {
        console.log('DEV MODE: Auto-authenticating despite API error');
        
        // Determine user type based on email
        const userType = email.includes('hauler') ? 'hauler' : 'poster';
        const userName = userType === 'hauler' ? 'Test Hauler' : 'Test Poster';
        
        // Store token and user type
        localStorage.setItem('token', 'dev-token-fallback');
        localStorage.setItem('userType', userType);
        
        // Update state
        setIsAuthenticated(true);
        setCurrentUser({
          id: `test-${userType}-id`,
          name: userName,
          email: email,
          userType: userType
        });
        setUserRole(userType);
        setError(null);
        
        return true;
      }
      
      setError(err.response?.data?.message || 'Login failed');
      return false;
    }
  };
  
  // Register function
  const register = async (userData) => {
    try {
      // DEVELOPMENT MODE BYPASS
      if (process.env.NODE_ENV === 'development') {
        console.log('DEV MODE: Bypassing API register');
        
        const userType = userData.userType || 'hauler';
        
        // Store token and user type
        localStorage.setItem('token', 'dev-token-register');
        localStorage.setItem('userType', userType);
        
        // Update state
        setIsAuthenticated(true);
        setCurrentUser({
          id: `test-reg-${userType}-id`,
          name: userData.name || 'New Test User',
          email: userData.email,
          userType: userType
        });
        setUserRole(userType);
        setError(null);
        
        return true;
      }
      
      // PRODUCTION MODE - ACTUAL API CALL
      const response = await api.post('/auth/register', userData);
      
      const { token, user } = response.data;
      
      // Store token and user type
      localStorage.setItem('token', token);
      localStorage.setItem('userType', user.userType);
      
      // Update state
      setIsAuthenticated(true);
      setCurrentUser(user);
      setUserRole(user.userType);
      setError(null);
      
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      
      // For development mode, still register on error
      if (process.env.NODE_ENV === 'development') {
        console.log('DEV MODE: Auto-registering despite API error');
        
        const userType = userData.userType || 'hauler';
        
        // Store token and user type
        localStorage.setItem('token', 'dev-token-reg-fallback');
        localStorage.setItem('userType', userType);
        
        // Update state
        setIsAuthenticated(true);
        setCurrentUser({
          id: `test-reg-${userType}-id`,
          name: userData.name || 'New Test User',
          email: userData.email,
          userType: userType
        });
        setUserRole(userType);
        setError(null);
        
        return true;
      }
      
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };
  
  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    
    // Update state
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserRole(null);
    setError(null);
  };

  const toggleRole = () => {
    // Only allow toggling if authenticated
    if (!isAuthenticated) return;
    
    // Get current type and toggle it
    const currentType = localStorage.getItem('userType');
    const newType = currentType === 'hauler' ? 'poster' : 'hauler';
    
    // Update localStorage
    localStorage.setItem('userType', newType);
    
    // Update state
    setUserRole(newType);
    
    console.log(`Switched role from ${currentType} to ${newType}`);
    
    // Redirect to appropriate home page
    window.location.href = newType === 'hauler' ? '/hauler-home' : '/poster-home';
  };

  // Context value (single declaration)
  const contextValue = {
    isAuthenticated,
    currentUser,
    userRole,
    isLoading,
    error,
    login,
    register,
    logout,
    toggleRole
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
