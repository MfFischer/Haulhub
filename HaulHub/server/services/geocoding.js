const axios = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config();

// Cache setup - store geocode results for 7 days, reverse geocode for 1 day
const geocodeCache = new NodeCache({ stdTTL: 60 * 60 * 24 * 7 });
const reverseGeocodeCache = new NodeCache({ stdTTL: 60 * 60 * 24 });

// API configurations
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const GEOCODING_PROVIDER = process.env.GEOCODING_PROVIDER || 'google'; // 'google' or 'mapbox'

/**
 * Geocode an address to coordinates
 * @param {string} address - The address to geocode
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Geocoding result with coordinates and metadata
 */
const geocodeAddress = async (address, options = {}) => {
  try {
    // Return from cache if available
    const cacheKey = `geocode:${address}`;
    const cachedResult = geocodeCache.get(cacheKey);
    if (cachedResult) {
      return {
        ...cachedResult,
        source: 'cache'
      };
    }
    
    // Handle different geocoding providers
    let result;
    
    if (GEOCODING_PROVIDER === 'mapbox' && MAPBOX_ACCESS_TOKEN) {
      result = await geocodeWithMapbox(address, options);
    } else if (GOOGLE_MAPS_API_KEY) {
      result = await geocodeWithGoogle(address, options);
    } else {
      // Fallback to offline mock geocoding
      result = mockGeocoding(address);
    }
    
    // Cache the result
    geocodeCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Geocoding error:', error);
    
    // Return a fallback mock result if API fails
    const mockResult = mockGeocoding(address);
    return {
      ...mockResult,
      error: error.message,
      source: 'fallback'
    };
  }
};

/**
 * Geocode with Google Maps API
 * @param {string} address - The address to geocode
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Geocoding result
 */
const geocodeWithGoogle = async (address, options = {}) => {
  const { region = 'us', language = 'en' } = options;
  
  const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: {
      address,
      key: GOOGLE_MAPS_API_KEY,
      region,
      language
    }
  });
  
  if (response.data.status !== 'OK') {
    throw new Error(`Google Geocoding API error: ${response.data.status}`);
  }
  
  const result = response.data.results[0];
  
  // Extract address components
  const components = {};
  result.address_components.forEach(component => {
    component.types.forEach(type => {
      components[type] = component.long_name;
    });
  });
  
  return {
    address: result.formatted_address,
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    placeId: result.place_id,
    locationType: result.geometry.location_type,
    streetNumber: components.street_number || '',
    street: components.route || '',
    city: components.locality || components.administrative_area_level_2 || '',
    state: components.administrative_area_level_1 || '',
    country: components.country || '',
    postalCode: components.postal_code || '',
    accuracy: getAccuracyFromGoogle(result.geometry.location_type),
    provider: 'google',
    raw: result
  };
};

/**
 * Geocode with Mapbox API
 * @param {string} address - The address to geocode
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Geocoding result
 */
const geocodeWithMapbox = async (address, options = {}) => {
  const { country = '', proximity = '', language = 'en' } = options;
  
  // URL encode the address
  const encodedAddress = encodeURIComponent(address);
  
  let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=${language}`;
  
  // Add optional parameters
  if (country) {
    url += `&country=${country}`;
  }
  
  if (proximity) {
    url += `&proximity=${proximity}`;
  }
  
  const response = await axios.get(url);
  
  if (!response.data.features || response.data.features.length === 0) {
    throw new Error('Mapbox Geocoding API error: No results found');
  }
  
  const feature = response.data.features[0];
  const [longitude, latitude] = feature.center;
  
  // Parse context for address components
  const context = feature.context || [];
  const contextMap = {};
  
  context.forEach(item => {
    const id = item.id.split('.')[0];
    contextMap[id] = item.text;
  });
  
  return {
    address: feature.place_name,
    latitude,
    longitude,
    placeId: feature.id,
    locationType: feature.place_type[0],
    streetNumber: feature.address || '',
    street: feature.text || '',
    city: contextMap.place || contextMap.locality || '',
    state: contextMap.region || '',
    country: contextMap.country || '',
    postalCode: contextMap.postcode || '',
    accuracy: getAccuracyFromMapbox(feature.place_type[0]),
    provider: 'mapbox',
    raw: feature
  };
};

/**
 * Reverse geocode coordinates to address
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Reverse geocoding result with address and metadata
 */
const reverseGeocode = async (latitude, longitude, options = {}) => {
  try {
    // Return from cache if available
    const cacheKey = `reverse:${latitude},${longitude}`;
    const cachedResult = reverseGeocodeCache.get(cacheKey);
    if (cachedResult) {
      return {
        ...cachedResult,
        source: 'cache'
      };
    }
    
    // Handle different geocoding providers
    let result;
    
    if (GEOCODING_PROVIDER === 'mapbox' && MAPBOX_ACCESS_TOKEN) {
      result = await reverseGeocodeWithMapbox(latitude, longitude, options);
    } else if (GOOGLE_MAPS_API_KEY) {
      result = await reverseGeocodeWithGoogle(latitude, longitude, options);
    } else {
      // Fallback to offline mock reverse geocoding
      result = mockReverseGeocoding(latitude, longitude);
    }
    
    // Cache the result
    reverseGeocodeCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    
    // Return a fallback mock result if API fails
    const mockResult = mockReverseGeocoding(latitude, longitude);
    return {
      ...mockResult,
      error: error.message,
      source: 'fallback'
    };
  }
};

/**
 * Reverse geocode with Google Maps API
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Reverse geocoding result
 */
const reverseGeocodeWithGoogle = async (latitude, longitude, options = {}) => {
  const { language = 'en', resultType = '' } = options;
  
  const params = {
    latlng: `${latitude},${longitude}`,
    key: GOOGLE_MAPS_API_KEY,
    language
  };
  
  if (resultType) {
    params.result_type = resultType;
  }
  
  const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', { params });
  
  if (response.data.status !== 'OK') {
    throw new Error(`Google Reverse Geocoding API error: ${response.data.status}`);
  }
  
  const result = response.data.results[0];
  
  // Extract address components
  const components = {};
  result.address_components.forEach(component => {
    component.types.forEach(type => {
      components[type] = component.long_name;
    });
  });
  
  return {
    address: result.formatted_address,
    latitude,
    longitude,
    placeId: result.place_id,
    locationType: result.geometry.location_type,
    streetNumber: components.street_number || '',
    street: components.route || '',
    city: components.locality || components.administrative_area_level_2 || '',
    state: components.administrative_area_level_1 || '',
    country: components.country || '',
    postalCode: components.postal_code || '',
    accuracy: getAccuracyFromGoogle(result.geometry.location_type),
    provider: 'google',
    raw: result
  };
};

/**
 * Reverse geocode with Mapbox API
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Reverse geocoding result
 */
const reverseGeocodeWithMapbox = async (latitude, longitude, options = {}) => {
  const { language = 'en', types = '' } = options;
  
  let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=${language}`;
  
  if (types) {
    url += `&types=${types}`;
  }
  
  const response = await axios.get(url);
  
  if (!response.data.features || response.data.features.length === 0) {
    throw new Error('Mapbox Reverse Geocoding API error: No results found');
  }
  
  const feature = response.data.features[0];
  
  // Parse context for address components
  const context = feature.context || [];
  const contextMap = {};
  
  context.forEach(item => {
    const id = item.id.split('.')[0];
    contextMap[id] = item.text;
  });
  
  return {
    address: feature.place_name,
    latitude,
    longitude,
    placeId: feature.id,
    locationType: feature.place_type[0],
    streetNumber: feature.address || '',
    street: feature.text || '',
    city: contextMap.place || contextMap.locality || '',
    state: contextMap.region || '',
    country: contextMap.country || '',
    postalCode: contextMap.postcode || '',
    accuracy: getAccuracyFromMapbox(feature.place_type[0]),
    provider: 'mapbox',
    raw: feature
  };
};

/**
 * Calculate distance between two coordinates
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @param {string} unit - Unit of measurement (km, mi, m)
 * @returns {number} - Distance between the two points in the specified unit
 */
const calculateDistance = (lat1, lon1, lat2, lon2, unit = 'km') => {
  if ((lat1 === lat2) && (lon1 === lon2)) {
    return 0;
  }
  
  const radlat1 = Math.PI * lat1 / 180;
  const radlat2 = Math.PI * lat2 / 180;
  const theta = lon1 - lon2;
  const radtheta = Math.PI * theta / 180;
  
  let dist = Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  
  if (dist > 1) {
    dist = 1;
  }
  
  dist = Math.acos(dist);
  dist = dist * 180 / Math.PI;
  dist = dist * 60 * 1.1515; // Distance in miles
  
  if (unit === 'km') {
    dist = dist * 1.609344; // Convert to kilometers
  } else if (unit === 'm') {
    dist = dist * 1609.344; // Convert to meters
  }
  
  return dist;
};

/**
 * Calculate estimated travel time between two points
 * @param {number} lat1 - Latitude of origin
 * @param {number} lon1 - Longitude of origin
 * @param {number} lat2 - Latitude of destination
 * @param {number} lon2 - Longitude of destination
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Travel time and distance information
 */
const calculateTravelTime = async (lat1, lon1, lat2, lon2, options = {}) => {
  try {
    const { mode = 'driving', trafficModel = 'best_guess', departureTime = 'now' } = options;
    
    if (GOOGLE_MAPS_API_KEY) {
      return await calculateTravelTimeWithGoogle(lat1, lon1, lat2, lon2, options);
    } else {
      // Fallback to estimation based on distance
      const distance = calculateDistance(lat1, lon1, lat2, lon2, 'km');
      const speed = mode === 'driving' ? 40 : 15; // km/h
      const timeMinutes = Math.ceil(distance / speed * 60);
      
      return {
        distance: {
          value: distance * 1000, // meters
          text: `${distance.toFixed(1)} km`
        },
        duration: {
          value: timeMinutes * 60, // seconds
          text: `${timeMinutes} mins`
        },
        source: 'estimate'
      };
    }
  } catch (error) {
    console.error('Travel time calculation error:', error);
    
    // Fallback to basic estimation
    const distance = calculateDistance(lat1, lon1, lat2, lon2, 'km');
    const speed = 30; // Average speed in km/h
    const timeMinutes = Math.ceil(distance / speed * 60);
    
    return {
      distance: {
        value: distance * 1000, // meters
        text: `${distance.toFixed(1)} km`
      },
      duration: {
        value: timeMinutes * 60, // seconds
        text: `${timeMinutes} mins`
      },
      source: 'fallback',
      error: error.message
    };
  }
};

/**
 * Calculate travel time using Google Maps API
 * @param {number} lat1 - Latitude of origin
 * @param {number} lon1 - Longitude of origin
 * @param {number} lat2 - Latitude of destination
 * @param {number} lon2 - Longitude of destination
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Travel time and distance information
 */
const calculateTravelTimeWithGoogle = async (lat1, lon1, lat2, lon2, options = {}) => {
  const { mode = 'driving', trafficModel = 'best_guess', departureTime = 'now' } = options;
  
  const params = {
    origins: `${lat1},${lon1}`,
    destinations: `${lat2},${lon2}`,
    mode,
    key: GOOGLE_MAPS_API_KEY
  };
  
  if (mode === 'driving') {
    params.traffic_model = trafficModel;
    params.departure_time = departureTime === 'now' ? 'now' : new Date(departureTime).getTime();
  }
  
  const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', { params });
  
  if (response.data.status !== 'OK') {
    throw new Error(`Google Distance Matrix API error: ${response.data.status}`);
  }
  
  const result = response.data.rows[0]?.elements[0];
  
  if (result.status !== 'OK') {
    throw new Error(`Route calculation error: ${result.status}`);
  }
  
  return {
    distance: result.distance,
    duration: result.duration,
    durationInTraffic: result.duration_in_traffic,
    source: 'google'
  };
};

/**
 * Retrieve suggested places based on text input and location
 * @param {string} input - The search input
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} - List of suggested places
 */
const getPlaceSuggestions = async (input, options = {}) => {
  try {
    if (input.length < 3) {
      return [];
    }
    
    const { latitude, longitude, radius = 50000, types = '', country = '' } = options;
    
    if (GEOCODING_PROVIDER === 'mapbox' && MAPBOX_ACCESS_TOKEN) {
      return await getPlaceSuggestionsWithMapbox(input, options);
    } else if (GOOGLE_MAPS_API_KEY) {
      return await getPlaceSuggestionsWithGoogle(input, options);
    } else {
      // Fallback to mock suggestions
      return mockPlaceSuggestions(input);
    }
  } catch (error) {
    console.error('Place suggestions error:', error);
    return mockPlaceSuggestions(input);
  }
};

/**
 * Get place suggestions with Google Places API
 * @param {string} input - The search input
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} - List of suggested places
 */
const getPlaceSuggestionsWithGoogle = async (input, options = {}) => {
  const { latitude, longitude, radius = 50000, types = '', country = '', language = 'en' } = options;
  
  const params = {
    input,
    key: GOOGLE_MAPS_API_KEY,
    language
  };
  
  if (latitude && longitude) {
    params.location = `${latitude},${longitude}`;
    params.radius = radius;
  }
  
  if (types) {
    params.types = types;
  }
  
  if (country) {
    params.components = `country:${country}`;
  }
  
  const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', { params });
  
  if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API error: ${response.data.status}`);
  }
  
  return response.data.predictions.map(prediction => ({
    id: prediction.place_id,
    description: prediction.description,
    mainText: prediction.structured_formatting.main_text,
    secondaryText: prediction.structured_formatting.secondary_text,
    types: prediction.types,
    source: 'google'
  }));
};

/**
 * Get place suggestions with Mapbox API
 * @param {string} input - The search input
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} - List of suggested places
 */
const getPlaceSuggestionsWithMapbox = async (input, options = {}) => {
  const { latitude, longitude, country = '', types = '', language = 'en' } = options;
  
  let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=${language}`;
  
  if (latitude && longitude) {
    url += `&proximity=${longitude},${latitude}`;
  }
  
  if (country) {
    url += `&country=${country}`;
  }
  
  if (types) {
    const typeMap = {
      address: 'address',
      establishment: 'poi',
      geocode: 'address',
      locality: 'place',
      region: 'region',
      postal_code: 'postcode'
    };
    
    const mapboxTypes = types.split(',')
      .map(type => typeMap[type] || type)
      .filter(Boolean)
      .join(',');
    
    if (mapboxTypes) {
      url += `&types=${mapboxTypes}`;
    }
  }
  
  const response = await axios.get(url);
  
  return response.data.features.map(feature => ({
    id: feature.id,
    description: feature.place_name,
    mainText: feature.text,
    secondaryText: feature.place_name.replace(feature.text + ', ', ''),
    types: feature.place_type,
    coordinates: feature.center,
    source: 'mapbox'
  }));
};

// Helper functions

/**
 * Get accuracy level from Google location type
 * @param {string} locationType - Google location type
 * @returns {string} - Accuracy level (high, medium, low)
 */
const getAccuracyFromGoogle = (locationType) => {
  switch (locationType) {
    case 'ROOFTOP':
      return 'high';
    case 'RANGE_INTERPOLATED':
    case 'GEOMETRIC_CENTER':
      return 'medium';
    case 'APPROXIMATE':
    default:
      return 'low';
  }
};

/**
 * Get accuracy level from Mapbox place type
 * @param {string} placeType - Mapbox place type
 * @returns {string} - Accuracy level (high, medium, low)
 */
const getAccuracyFromMapbox = (placeType) => {
  switch (placeType) {
    case 'address':
      return 'high';
    case 'poi':
    case 'place':
      return 'medium';
    case 'region':
    case 'country':
    default:
      return 'low';
  }
};

/**
 * Fallback mock geocoding function
 * @param {string} address - Address to geocode
 * @returns {Object} - Mock geocoding result
 */
const mockGeocoding = (address) => {
  // Generate deterministic but fake coordinates based on address string
  const addressStr = address.toLowerCase();
  
  // Use hash-like function to generate fake but consistent lat/lng
  let latSeed = 0;
  let lngSeed = 0;
  
  for (let i = 0; i < addressStr.length; i++) {
    latSeed += addressStr.charCodeAt(i) * (i + 1);
    lngSeed += addressStr.charCodeAt(i) * (i + 2);
  }
  
  // Generate latitude between -90 and 90
  const latitude = ((latSeed % 180) - 90);
  // Generate longitude between -180 and 180
  const longitude = ((lngSeed % 360) - 180);
  
  return {
    address,
    latitude: parseFloat(latitude.toFixed(6)),
    longitude: parseFloat(longitude.toFixed(6)),
    accuracy: 'low',
    provider: 'mock',
    source: 'offline'
  };
};

/**
 * Fallback mock reverse geocoding function
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Object} - Mock reverse geocoding result
 */
const mockReverseGeocoding = (latitude, longitude) => {
  const lat = parseFloat(latitude).toFixed(4);
  const lng = parseFloat(longitude).toFixed(4);
  
  return {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    address: `${lat}, ${lng} Area`,
    streetNumber: Math.abs(Math.round(latitude * 100)).toString(),
    street: `${Math.abs(Math.round(longitude * 10))}th Street`,
    city: latitude > 0 ? "North City" : "South City",
    state: longitude > 0 ? "East State" : "West State",
    country: "United States",
    postalCode: `${Math.abs(Math.round(latitude * 100 + longitude * 100)).toString().padStart(5, '0')}`,
    accuracy: 'low',
    provider: 'mock',
    source: 'offline'
  };
};

/**
 * Fallback mock place suggestions function
 * @param {string} input - Search input
 * @returns {Array} - Mock place suggestions
 */
const mockPlaceSuggestions = (input) => {
  const suggestions = [
    {
      id: 'mock1',
      description: `${input} Street, New York`,
      mainText: `${input} Street`,
      secondaryText: 'New York, NY, USA',
      types: ['address'],
      source: 'mock'
    },
    {
      id: 'mock2',
      description: `${input} Avenue, Los Angeles`,
      mainText: `${input} Avenue`,
      secondaryText: 'Los Angeles, CA, USA',
      types: ['address'],
      source: 'mock'
    },
    {
      id: 'mock3',
      description: `${input} Restaurant`,
      mainText: `${input} Restaurant`,
      secondaryText: 'Chicago, IL, USA',
      types: ['establishment', 'restaurant'],
      source: 'mock'
    }
  ];
  
  return suggestions;
};

/**
 * Clear geocoding cache
 * @param {string} type - Type of cache to clear ('geocode', 'reverse', or 'all')
 */
const clearCache = (type = 'all') => {
  switch (type) {
    case 'geocode':
      geocodeCache.flushAll();
      break;
    case 'reverse':
      reverseGeocodeCache.flushAll();
      break;
    case 'all':
      geocodeCache.flushAll();
      reverseGeocodeCache.flushAll();
      break;
  }
};

module.exports = {
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
  calculateTravelTime,
  getPlaceSuggestions,
  clearCache
};