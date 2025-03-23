import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LocationContext } from '../context/LocationContext';
import { calculateDistance } from '../utils/location';

/**
 * Custom hook for tracking and updating user location
 * Useful for haulers to track their position during delivery
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Polling interval in milliseconds (default: 10000)
 * @param {boolean} options.autoStart - Whether to start tracking immediately (default: false)
 * @param {boolean} options.highAccuracy - Whether to request high accuracy (default: true)
 * @param {number} options.maxAge - Maximum age of cached position in milliseconds (default: 0)
 * @param {number} options.timeout - Timeout for position request in milliseconds (default: 10000)
 * @returns {Object} Location tracking methods and state
 */
const useLocationTracker = (options = {}) => {
  const { 
    interval = 10000, 
    autoStart = false,
    highAccuracy = true,
    maxAge = 0,
    timeout = 10000
  } = options;
  
  const { user } = useContext(AuthContext);
  const { updateUserLocation } = useContext(LocationContext);
  
  const [isTracking, setIsTracking] = useState(autoStart);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  
  /**
   * Handles successful location updates
   */
  const handlePositionSuccess = useCallback((position) => {
    const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
    const timestamp = position.timestamp;
    
    const newLocation = {
      coords: {
        latitude,
        longitude,
        accuracy,
        altitude: altitude || null,
        heading: heading || null,
        speed: speed || null
      },
      timestamp
    };
    
    setCurrentLocation(newLocation);
    setError(null);
    
    // Add to location history
    setLocationHistory(prevHistory => {
      const updatedHistory = [...prevHistory, newLocation];
      
      // Calculate distance traveled if we have at least two points
      if (prevHistory.length > 0) {
        const lastLocation = prevHistory[prevHistory.length - 1];
        const newDistance = calculateDistance(
          lastLocation.coords.latitude,
          lastLocation.coords.longitude,
          newLocation.coords.latitude,
          newLocation.coords.longitude
        );
        
        setDistanceTraveled(prevDistance => prevDistance + newDistance);
      }
      
      // Only keep the last 100 locations to avoid memory issues
      if (updatedHistory.length > 100) {
        return updatedHistory.slice(-100);
      }
      
      return updatedHistory;
    });
    
    // Update server with new location if user is authenticated
    if (user && user.id) {
      updateUserLocation({
        userId: user.id,
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        timestamp
      });
    }
  }, [user, updateUserLocation]);
  
  /**
   * Handles location errors
   */
  const handlePositionError = useCallback((positionError) => {
    const errorMessage = {
      1: 'Location permission denied. Please enable location services for this app.',
      2: 'Location information unavailable. Please try again.',
      3: 'Location request timed out. Please try again.'
    };
    
    setError({
      code: positionError.code,
      message: errorMessage[positionError.code] || 'Unknown location error occurred.'
    });
  }, []);
  
  /**
   * Starts location tracking
   */
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by your browser.'
      });
      return;
    }
    
    // Clear any existing watch
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    
    // Set up geolocation watching
    const id = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: highAccuracy,
        maximumAge: maxAge,
        timeout: timeout
      }
    );
    
    setWatchId(id);
    setIsTracking(true);
  }, [watchId, handlePositionSuccess, handlePositionError, highAccuracy, maxAge, timeout]);
  
  /**
   * Stops location tracking
   */
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  }, [watchId]);
  
  /**
   * Gets the current position once
   */
  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = {
          code: 0,
          message: 'Geolocation is not supported by your browser.'
        };
        setError(error);
        reject(error);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handlePositionSuccess(position);
          resolve(position);
        },
        (error) => {
          handlePositionError(error);
          reject(error);
        },
        {
          enableHighAccuracy: highAccuracy,
          maximumAge: maxAge,
          timeout: timeout
        }
      );
    });
  }, [handlePositionSuccess, handlePositionError, highAccuracy, maxAge, timeout]);
  
  /**
   * Clear location history and reset distance traveled
   */
  const clearHistory = useCallback(() => {
    setLocationHistory([]);
    setDistanceTraveled(0);
  }, []);
  
  // Start tracking on mount if autoStart is true
  useEffect(() => {
    if (autoStart) {
      startTracking();
    }
    
    // Clean up on unmount
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [autoStart, startTracking, watchId]);
  
  return {
    isTracking,
    currentLocation,
    locationHistory,
    error,
    distanceTraveled,
    startTracking,
    stopTracking,
    getCurrentPosition,
    clearHistory
  };
};

export default useLocationTracker;