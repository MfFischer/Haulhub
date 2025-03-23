import React, { createContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { detectUserRegion } from '../utils/location';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRegion, setUserRegion] = useState('us'); // Default to US
  const [locationPermission, setLocationPermission] = useState('unknown'); // 'granted', 'denied', 'unknown'
  const [address, setAddress] = useState(null);
  const [watchId, setWatchId] = useState(null);

  // Initialize location on mount
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // Check if geolocation is available
        if (!navigator.geolocation) {
          setLocationPermission('unavailable');
          setIsLoading(false);
          return;
        }

        // Try to get user's position
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ latitude, longitude });
            setLocationPermission('granted');
            
            // Detect region based on coordinates
            try {
              const region = await detectUserRegion({ latitude, longitude });
              setUserRegion(region);
            } catch (regionError) {
              console.error('Error detecting region:', regionError);
              // Fallback to default region ('us')
            }
            
            // Get address (reverse geocoding)
            try {
              const response = await api.get('/location/reverse-geocode', {
                params: { latitude, longitude }
              });
              setAddress(response.data);
            } catch (addressError) {
              console.error('Error getting address:', addressError);
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationPermission('denied');
            
            // Detect region based on IP address as fallback
            detectUserRegion().then(setUserRegion).catch(() => {});
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (error) {
        console.error('Location initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLocation();

    // Cleanup any watchers on unmount
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Start tracking location
  const startTracking = useCallback(() => {
    if (navigator.geolocation && locationPermission === 'granted') {
      // Clear any existing watch
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      
      // Start a new watch
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
        },
        (error) => {
          console.error('Tracking error:', error);
          toast.error('Unable to track location. Please check your settings.');
          stopTracking();
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
      
      setWatchId(id);
      return true;
    }
    
    toast.error('Location permission is required for tracking.');
    return false;
  }, [locationPermission, watchId]);

  // Stop tracking location
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      return true;
    }
    return false;
  }, [watchId]);

  // Request location permission
  const requestLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return false;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      setCurrentLocation({ latitude, longitude });
      setLocationPermission('granted');
      
      // Detect region based on coordinates
      try {
        const region = await detectUserRegion({ latitude, longitude });
        setUserRegion(region);
      } catch (regionError) {
        console.error('Error detecting region:', regionError);
      }
      
      toast.success('Location access granted');
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      setLocationPermission('denied');
      toast.error('Location access denied. Some features may be limited.');
      return false;
    }
  }, []);

  // Get estimated distance between two points
  const getDistance = useCallback((start, end) => {
    // Implementation of the Haversine formula to calculate distance
    const toRad = (value) => (value * Math.PI) / 180;
    
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(end.latitude - start.latitude);
    const dLon = toRad(end.longitude - start.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(start.latitude)) * Math.cos(toRad(end.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    
    // Convert to miles if userRegion uses imperial
    const useImperial = ['us'].includes(userRegion);
    return useImperial ? distance * 0.621371 : distance;
  }, [userRegion]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        isLoading,
        userRegion,
        locationPermission,
        address,
        isTracking: watchId !== null,
        startTracking,
        stopTracking,
        requestLocationPermission,
        getDistance
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;