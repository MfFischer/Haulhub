const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middlewares/auth');

// In-memory storage for locations
const userLocations = [];
const activeHaulers = [];

/**
 * @route   POST api/location/update
 * @desc    Update user's current location
 * @access  Private
 */
router.post('/update', [
  auth,
  check('latitude', 'Latitude is required').isFloat({ min: -90, max: 90 }),
  check('longitude', 'Longitude is required').isFloat({ min: -180, max: 180 }),
  check('accuracy', 'Accuracy is required').optional().isFloat({ min: 0 }),
  check('heading', 'Heading must be a number').optional().isFloat(),
  check('speed', 'Speed must be a number').optional().isFloat({ min: 0 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { latitude, longitude, accuracy, heading, speed } = req.body;

    // Update user's location
    const locationUpdate = {
      userId: req.user.id,
      latitude,
      longitude,
      accuracy: accuracy || null,
      heading: heading || null,
      speed: speed || null,
      timestamp: new Date()
    };

    // Find and update or create new location entry
    const locationIndex = userLocations.findIndex(loc => loc.userId === req.user.id);
    if (locationIndex >= 0) {
      userLocations[locationIndex] = locationUpdate;
    } else {
      userLocations.push(locationUpdate);
    }

    // If user is a hauler, update active haulers list
    if (req.user.userType === 'hauler') {
      const haulerIndex = activeHaulers.findIndex(h => h.userId === req.user.id);
      
      if (haulerIndex >= 0) {
        // Update existing active hauler
        activeHaulers[haulerIndex] = {
          ...activeHaulers[haulerIndex],
          latitude,
          longitude,
          accuracy: accuracy || null,
          heading: heading || null,
          speed: speed || null,
          lastUpdated: new Date()
        };
      } else {
        // Add to active haulers
        activeHaulers.push({
          userId: req.user.id,
          latitude,
          longitude,
          accuracy: accuracy || null,
          heading: heading || null,
          speed: speed || null,
          isAvailable: true,
          lastUpdated: new Date()
        });
      }
    }

    res.json({ 
      success: true, 
      location: locationUpdate 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST api/location/availability
 * @desc    Update hauler's availability status
 * @access  Private (haulers only)
 */
router.post('/availability', [
  auth,
  check('isAvailable', 'Availability status is required').isBoolean(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user is a hauler
    if (req.user.userType !== 'hauler') {
      return res.status(403).json({ message: 'Only haulers can update availability status' });
    }

    const { isAvailable } = req.body;

    // Find hauler in active haulers list
    const haulerIndex = activeHaulers.findIndex(h => h.userId === req.user.id);
    
    if (haulerIndex >= 0) {
      // Update availability
      activeHaulers[haulerIndex].isAvailable = isAvailable;
      activeHaulers[haulerIndex].lastUpdated = new Date();
    } else {
      // Not in active list yet, need location first
      return res.status(400).json({ 
        message: 'Location must be updated before setting availability' 
      });
    }

    res.json({ 
      success: true, 
      isAvailable 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET api/location/nearby-haulers
 * @desc    Get nearby available haulers
 * @access  Private
 */
router.get('/nearby-haulers', [
  auth,
  check('latitude', 'Latitude is required').isFloat({ min: -90, max: 90 }),
  check('longitude', 'Longitude is required').isFloat({ min: -180, max: 180 }),
  check('radius', 'Radius must be a positive number').optional().isFloat({ min: 0.1 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { latitude, longitude, radius = 5 } = req.query; // radius in km

    // Filter active haulers by availability and time
    const availableHaulers = activeHaulers.filter(hauler => {
      // Check if hauler is available
      if (!hauler.isAvailable) return false;
      
      // Check if update was recent (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (hauler.lastUpdated < fiveMinutesAgo) return false;
      
      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        latitude, 
        longitude, 
        hauler.latitude, 
        hauler.longitude
      );
      
      // Check if within radius
      return distance <= radius;
    });

    // Return nearby haulers (without sensitive info)
    const haulerData = availableHaulers.map(hauler => ({
      userId: hauler.userId,
      latitude: hauler.latitude,
      longitude: hauler.longitude,
      // Calculate distance from requested location
      distance: calculateDistance(
        latitude, 
        longitude, 
        hauler.latitude, 
        hauler.longitude
      ),
      lastUpdated: hauler.lastUpdated
    }));

    res.json(haulerData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET api/location/job-route
 * @desc    Get routing information for a job
 * @access  Private
 */
router.get('/job-route', [
  auth,
  check('pickupLat', 'Pickup latitude is required').isFloat({ min: -90, max: 90 }),
  check('pickupLng', 'Pickup longitude is required').isFloat({ min: -180, max: 180 }),
  check('dropoffLat', 'Dropoff latitude is required').isFloat({ min: -90, max: 90 }),
  check('dropoffLng', 'Dropoff longitude is required').isFloat({ min: -180, max: 180 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng } = req.query;

    // In a real app, you'd call a routing API like Google Maps, Mapbox, etc.
    // For this example, we'll return a simplified response
    
    // Calculate direct distance
    const distance = calculateDistance(
      pickupLat, 
      pickupLng, 
      dropoffLat, 
      dropoffLng
    );
    
    // Estimate travel time (very rough estimate assuming 30km/h)
    const durationMinutes = Math.round(distance * 2); // 2 minutes per km
    
    // Generate a simplified route
    const route = [
      { lat: parseFloat(pickupLat), lng: parseFloat(pickupLng) },
      // Midpoint (very simplified)
      { 
        lat: (parseFloat(pickupLat) + parseFloat(dropoffLat)) / 2, 
        lng: (parseFloat(pickupLng) + parseFloat(dropoffLng)) / 2 
      },
      { lat: parseFloat(dropoffLat), lng: parseFloat(dropoffLng) }
    ];

    res.json({
      distance: distance, // in km
      duration: durationMinutes, // in minutes
      route: route
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET api/location/geocode
 * @desc    Geocode an address to coordinates
 * @access  Private
 */
router.get('/geocode', [
  auth,
  check('address', 'Address is required').not().isEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { address } = req.query;

    // In a real app, you'd call a geocoding API like Google Maps, Mapbox, etc.
    // For this example, we'll return a mock response
    
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

    res.json({
      address: address,
      latitude: parseFloat(latitude.toFixed(6)),
      longitude: parseFloat(longitude.toFixed(6)),
      accuracy: "high"
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET api/location/reverse-geocode
 * @desc    Convert coordinates to address
 * @access  Private
 */
router.get('/reverse-geocode', [
  auth,
  check('latitude', 'Latitude is required').isFloat({ min: -90, max: 90 }),
  check('longitude', 'Longitude is required').isFloat({ min: -180, max: 180 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { latitude, longitude } = req.query;

    // In a real app, you'd call a reverse geocoding API
    // For this example, we'll return a mock response
    
    const lat = parseFloat(latitude).toFixed(4);
    const lng = parseFloat(longitude).toFixed(4);
    
    res.json({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: `${lat}, ${lng} Area`,
      streetAddress: `${Math.abs(lat * 100).toFixed(0)} Main St`,
      city: lat > 0 ? "North City" : "South City",
      state: lng > 0 ? "East State" : "West State",
      country: "United States",
      postalCode: `${Math.abs((lat * 100 + lng * 100)).toFixed(0).padStart(5, '0')}`,
      formatted: `${Math.abs(lat * 100).toFixed(0)} Main St, ${lat > 0 ? "North City" : "South City"}, ${lng > 0 ? "East State" : "West State"} ${Math.abs((lat * 100 + lng * 100)).toFixed(0).padStart(5, '0')}`
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

module.exports = router;