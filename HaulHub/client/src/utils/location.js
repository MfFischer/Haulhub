import api from './api';

/**
 * Detect user's region based on various signals
 * @param {Object} coordinates - Optional latitude/longitude
 * @returns {Promise<string>} - Region code (e.g., 'us', 'ph', 'eu')
 */
export const detectUserRegion = async (coordinates = null) => {
  try {
    // If coordinates are provided, use reverse geocoding
    if (coordinates) {
      const response = await api.get('/location/region', {
        params: {
          lat: coordinates.latitude,
          lng: coordinates.longitude
        }
      });
      
      return response.data.region;
    }
    
    // Otherwise use IP geolocation
    const response = await api.get('/location/region');
    return response.data.region;
  } catch (error) {
    console.error('Region detection error:', error);
    
    // Fallback to browser locale if API fails
    try {
      const locale = navigator.language || navigator.userLanguage;
      const country = locale.split('-')[1]?.toLowerCase();
      
      // Map country codes to our region codes
      const regionMap = {
        'us': 'us',
        'ph': 'ph',
        'id': 'id',
        'vn': 'vn',
        'gb': 'uk',
        'ca': 'ca',
        // EU countries
        'de': 'eu',
        'fr': 'eu',
        'it': 'eu',
        'es': 'eu',
        'nl': 'eu',
        'be': 'eu',
        'at': 'eu',
        'pt': 'eu',
        'ie': 'eu',
        'fi': 'eu',
        'gr': 'eu'
      };
      
      if (regionMap[country]) {
        return regionMap[country];
      }
    } catch (localeError) {
      console.error('Locale detection error:', localeError);
    }
    
    // Default to US if all else fails
    return 'us';
  }
};

/**
 * Get geocoding information for an address
 * @param {string} address - The address to geocode
 * @returns {Promise<Object>} - Geocoding result with lat/lng
 */
export const geocodeAddress = async (address) => {
  try {
    const response = await api.get('/location/geocode', {
      params: { address }
    });
    
    return response.data;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to geocode address');
  }
};

/**
 * Get reverse geocoding information for coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - Address information
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await api.get('/location/reverse-geocode', {
      params: { lat, lng }
    });
    
    return response.data;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw new Error('Failed to get address from coordinates');
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {Object} start - Starting coordinates {latitude, longitude}
 * @param {Object} end - Ending coordinates {latitude, longitude}
 * @param {string} unit - Distance unit ('km' or 'mi')
 * @returns {number} - Distance in specified unit
 */
export const calculateDistance = (start, end, unit = 'km') => {
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
  
  // Convert to miles if requested
  return unit.toLowerCase() === 'mi' ? distance * 0.621371 : distance;
};

/**
 * Get optimized route between two points
 * @param {Object} start - Starting coordinates {latitude, longitude}
 * @param {Object} end - Ending coordinates {latitude, longitude}
 * @param {string} mode - Transportation mode (car, bike, walk)
 * @returns {Promise<Object>} - Route information including distance, duration, and path
 */
export const getRoute = async (start, end, mode = 'car') => {
  try {
    const response = await api.get('/location/route', {
      params: {
        startLat: start.latitude,
        startLng: start.longitude,
        endLat: end.latitude,
        endLng: end.longitude,
        mode
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Route calculation error:', error);
    throw new Error('Failed to calculate route');
  }
};

/**
 * Check if a location is within service area
 * @param {Object} coordinates - Coordinates {latitude, longitude}
 * @returns {Promise<boolean>} - Whether location is serviceable
 */
export const isLocationServiceable = async (coordinates) => {
  try {
    const response = await api.get('/location/service-area', {
      params: {
        lat: coordinates.latitude,
        lng: coordinates.longitude
      }
    });
    
    return response.data.isServiceable;
  } catch (error) {
    console.error('Service area check error:', error);
    return false;
  }
};