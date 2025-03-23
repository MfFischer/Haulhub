import React, { createContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('hauler'); // 'hauler' or 'poster'

  // Load user from localStorage on initial render
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const response = await api.get('/users/me');
          if (response.data) {
            setCurrentUser(response.data);
            // Set initial role based on user preference or default to hauler
            setUserRole(response.data.preferredRole || 'hauler');
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('authToken');
        api.defaults.headers.common['Authorization'] = '';
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      setUserRole(user.preferredRole || 'hauler');
      
      toast.success(`Welcome back, ${user.name}!`);
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      setUserRole('hauler'); // Default role for new users
      
      toast.success('Registration successful! Welcome to HaulHub.');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    api.defaults.headers.common['Authorization'] = '';
    setCurrentUser(null);
    toast.info('You have been logged out.');
  }, []);

  const toggleRole = useCallback(() => {
    const newRole = userRole === 'hauler' ? 'poster' : 'hauler';
    setUserRole(newRole);
    
    // If user is logged in, update their preference
    if (currentUser) {
      try {
        api.put('/users/preferences', { preferredRole: newRole });
      } catch (error) {
        console.error('Error updating role preference:', error);
      }
    }
    
    toast.info(`Switched to ${newRole === 'hauler' ? 'Hauler' : 'Poster'} mode`);
  }, [userRole, currentUser]);

  const updateProfile = useCallback(async (profileData) => {
    if (!currentUser) return false;
    
    try {
      const response = await api.put('/users/me', profileData);
      setCurrentUser(response.data);
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
      toast.error(errorMessage);
      return false;
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        userRole,
        login,
        register,
        logout,
        toggleRole,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;