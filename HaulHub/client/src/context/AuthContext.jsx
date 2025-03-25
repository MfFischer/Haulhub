import React, { createContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const AuthContext = createContext();

// Mock users for development
const DEV_USERS = [
  {
    id: 'user-dev-1',
    email: 'hauler@example.com',
    password: 'password123',
    name: 'Test Hauler',
    userType: 'hauler',
    preferredRole: 'hauler',
    profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
    rating: 4.8
  },
  {
    id: 'user-dev-2',
    email: 'poster@example.com',
    password: 'password123',
    name: 'Test Poster',
    userType: 'poster',
    preferredRole: 'poster',
    profileImage: 'https://randomuser.me/api/portraits/women/1.jpg',
    rating: 4.5
  }
];

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

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
          
          if (isDev) {
            // In development, parse the token to get the user info
            try {
              const userJson = atob(token.split('.')[1]);
              const userData = JSON.parse(userJson).user;
              const devUser = DEV_USERS.find(u => u.email === userData.email);
              
              if (devUser) {
                console.log('DEV MODE: Auto-logged in as', devUser.name);
                setCurrentUser(devUser);
                setUserRole(devUser.preferredRole || 'hauler');
              }
            } catch (e) {
              console.warn('DEV MODE: Could not parse dev token', e);
            }
          } else {
            // In production, actually call the API
            const response = await api.get('/users/me');
            if (response.data) {
              setCurrentUser(response.data);
              setUserRole(response.data.preferredRole || 'hauler');
            }
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
      console.log('Attempting login with:', email, password);
      console.log('API URL:', api.defaults.baseURL);
      
      if (isDev) {
        // In development, check against mock users
        const user = DEV_USERS.find(u => 
          u.email.toLowerCase() === email.toLowerCase() && 
          u.password === password
        );
        
        if (user) {
          console.log('DEV MODE: Login successful with mock user');
          
          // Create a fake token
          const fakePayload = {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              userType: user.userType
            }
          };
          
          const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 
                         btoa(JSON.stringify(fakePayload)) + 
                         '.fakeSignature';
          
          localStorage.setItem('authToken', fakeToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${fakeToken}`;
          
          setCurrentUser(user);
          setUserRole(user.preferredRole || 'hauler');
          
          toast.success(`Welcome back, ${user.name}!`);
          return user;
        } else {
          console.log('DEV MODE: Login failed - invalid credentials');
          throw new Error('Invalid email or password');
        }
      } else {
        // In production, make the API call
        const response = await api.post('/auth/login', { email, password });
        const { token, user } = response.data;
        
        localStorage.setItem('authToken', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setCurrentUser(user);
        setUserRole(user.preferredRole || 'hauler');
        
        toast.success(`Welcome back, ${user.name}!`);
        return user;
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    
    try {
      if (isDev) {
        // In development, simulate registration
        const existingUser = DEV_USERS.find(u => 
          u.email.toLowerCase() === userData.email.toLowerCase()
        );
        
        if (existingUser) {
          throw new Error('User with this email already exists');
        }
        
        // Create a new mock user
        const newUser = {
          id: `user-dev-${DEV_USERS.length + 1}`,
          email: userData.email,
          password: userData.password,
          name: userData.fullName,
          userType: userData.userType,
          preferredRole: userData.userType,
          profileImage: userData.userType === 'hauler' 
            ? 'https://randomuser.me/api/portraits/men/2.jpg'
            : 'https://randomuser.me/api/portraits/women/2.jpg',
          rating: 5.0
        };
        
        // Create a fake token
        const fakePayload = {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            userType: newUser.userType
          }
        };
        
        const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 
                       btoa(JSON.stringify(fakePayload)) + 
                       '.fakeSignature';
        
        localStorage.setItem('authToken', fakeToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${fakeToken}`;
        
        setCurrentUser(newUser);
        setUserRole(newUser.preferredRole);
        
        toast.success('Registration successful! Welcome to HaulHub.');
        return newUser;
      } else {
        // In production, make the API call
        const response = await api.post('/auth/register', userData);
        const { token, user } = response.data;
        
        localStorage.setItem('authToken', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setCurrentUser(user);
        setUserRole('hauler'); // Default role for new users
        
        toast.success('Registration successful! Welcome to HaulHub.');
        return user;
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      throw error;
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
        if (!isDev) {
          api.put('/users/preferences', { preferredRole: newRole });
        } else {
          console.log('DEV MODE: Updated role preference to', newRole);
        }
      } catch (error) {
        console.error('Error updating role preference:', error);
      }
    }
    
    toast.info(`Switched to ${newRole === 'hauler' ? 'Hauler' : 'Poster'} mode`);
  }, [userRole, currentUser]);

  const updateProfile = useCallback(async (profileData) => {
    if (!currentUser) return false;
    
    try {
      if (isDev) {
        // In development, just update the current user state
        setCurrentUser(prev => ({
          ...prev,
          ...profileData
        }));
        console.log('DEV MODE: Updated profile', profileData);
        toast.success('Profile updated successfully');
        return true;
      } else {
        // In production, make the API call
        const response = await api.put('/users/me', profileData);
        setCurrentUser(response.data);
        toast.success('Profile updated successfully');
        return true;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile. Please try again.';
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