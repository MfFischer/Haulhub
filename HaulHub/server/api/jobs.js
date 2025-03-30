const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middlewares/auth');
const { calculatePrice } = require('../services/pricing');

// Sample in-memory data store for demonstration
// In production, this would be a database
const jobs = [];

// Development environment check
const isDev = process.env.NODE_ENV === 'development';

// Helper middleware that bypasses auth in development mode
const conditionalAuth = (req, res, next) => {
  if (isDev) {
    // Skip auth in development
    req.user = { id: 'dev-user-id', userType: 'poster' }; // Mock user
    return next();
  }
  // Use real auth in production
  return auth(req, res, next);
};

// Add mock data for development
if (process.env.NODE_ENV === 'development') {
  // Push some sample job data
  jobs.push({
    id: '123456789',
    posterId: 'dev-user-id', // This matches the mock user ID in your conditionalAuth middleware
    title: 'Move a couch',
    description: 'Need help moving a large couch from apartment to new house',
    pickup: {
      address: '123 Main St, Anytown, USA',
      latitude: 40.7128,
      longitude: -74.0060
    },
    dropoff: {
      address: '456 Oak Ave, Othertown, USA',
      latitude: 40.7300,
      longitude: -73.9950
    },
    pickupCoordinates: {
      lat: 40.7128,
      lng: -74.0060
    },
    dropoffCoordinates: {
      lat: 40.7300,
      lng: -73.9950
    },
    weight: 80, // in kg
    distance: 5.2, // in km
    isRush: false,
    price: {
      amount: 45.50,
      currencyCode: 'USD',
      currencySymbol: '$'
    },
    postedAt: new Date(Date.now() - 3600000), // 1 hour ago
    status: 'created',
    claimed: false,
    claimedBy: null
  });
  
  // Add another job for haulers to see
  jobs.push({
    id: '987654321',
    posterId: 'another-poster-id',
    title: 'Deliver a Package',
    description: 'Need a small package delivered across town',
    pickup: {
      address: '789 Pine St, Anytown, USA',
      latitude: 40.7200,
      longitude: -74.0100
    },
    dropoff: {
      address: '101 Maple Ave, Othertown, USA',
      latitude: 40.7400,
      longitude: -73.9800
    },
    pickupCoordinates: {
      lat: 40.7200,
      lng: -74.0100
    },
    dropoffCoordinates: {
      lat: 40.7400,
      lng: -73.9800
    },
    weight: 5, // in kg
    distance: 3.8, // in km
    isRush: true,
    price: {
      amount: 25.75,
      currencyCode: 'USD',
      currencySymbol: '$'
    },
    status: 'open',
    postedAt: new Date().toISOString(),
    claimed: false,
    claimedBy: null
  });
  
  console.log('Added mock job data for development');
}

/**
 * @route   GET api/jobs/test
 * @desc    Test route
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.json({ message: 'Jobs route is working!' });
});

/**
 * @route   GET api/jobs/poster/active
 * @desc    Get active jobs for a poster
 * @access  Private
 */
router.get('/poster/active', conditionalAuth, (req, res) => {
  // Debug info
  console.log('DEBUG: Accessed /poster/active route');
  console.log('DEBUG: User info:', req.user);
  
  // Filter jobs that belong to this poster
  // In a real app, this would be a database query
  const posterId = req.user ? req.user.id : req.query.posterId || 'dev-user-id';
  const posterJobs = jobs.filter(job => 
    job.posterId === posterId && 
    ['open', 'in_progress', 'created'].includes(job.status)
  );
  
  res.json(posterJobs);
});

/**
 * @route   GET api/jobs/hauler
 * @desc    Get jobs for a hauler
 * @access  Private
 */
router.get('/hauler', conditionalAuth, (req, res) => {
  // Debug info
  console.log('DEBUG: Accessed /hauler route');
  console.log('DEBUG: User info:', req.user);
  
  // In a real app, you'd filter based on the authenticated user
  const userId = req.user ? req.user.id : req.query.userId || 'dev-user-id';
  
  // Filter jobs claimed by this hauler
  const haulerJobs = jobs.filter(job => job.claimedBy === userId);
  
  // If no claimed jobs, return sample data for development
  if (haulerJobs.length === 0 && isDev) {
    return res.json([{
      id: '987654321',
      posterId: 'test-poster-id',
      title: 'Move a Sofa',
      description: 'Need help moving a large sofa from apartment to new house',
      pickup: {
        address: '123 Main St, Anytown, USA',
        latitude: 40.7128,
        longitude: -74.0060
      },
      dropoff: {
        address: '456 Oak Ave, Othertown, USA',
        latitude: 40.7300,
        longitude: -73.9950
      },
      pickupCoordinates: {
        lat: 40.7128,
        lng: -74.0060
      },
      dropoffCoordinates: {
        lat: 40.7300,
        lng: -73.9950
      },
      weight: 80, // in kg
      distance: 5.2, // in km
      price: {
        amount: 45.50,
        currencyCode: 'USD',
        currencySymbol: '$'
      },
      status: 'in_progress',
      claimedAt: new Date().toISOString(),
      claimedBy: userId,
      claimed: true,
      estimatedDeliveryTime: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    }]);
  }
  
  return res.json(haulerJobs);
});

/**
 * @route   GET api/jobs/available
 * @desc    Get available jobs based on lat/lng
 * @access  Public
 */
router.get('/available', (req, res) => {
  const { lat, lng } = req.query;
  
  console.log('DEBUG: Accessed /available route');
  console.log('DEBUG: Coordinates:', { lat, lng });
  
  // In a real app, you'd query a geo-indexed database
  // This is a simplified example that doesn't actually use the coordinates
  const availableJobs = jobs.filter(job => !job.claimed && job.status === 'open');
  
  // If no available jobs, return sample data for development
  if ((availableJobs.length === 0 && isDev) || true) {  // Always return sample data for now
    return res.json([{
      id: '654321987',
      posterId: 'random-poster-id',
      title: 'Deliver a Package',
      description: 'Need a small package delivered across town',
      pickup: {
        address: '789 Pine St, Anytown, USA',
        latitude: 40.7200,
        longitude: -74.0100
      },
      dropoff: {
        address: '101 Maple Ave, Othertown, USA',
        latitude: 40.7400,
        longitude: -73.9800
      },
      pickupCoordinates: {
        lat: 40.7200,
        lng: -74.0100
      },
      dropoffCoordinates: {
        lat: 40.7400,
        lng: -73.9800
      },
      weight: 5, // in kg
      distance: 3.8, // in km
      price: {
        amount: 25.75,
        currencyCode: 'USD',
        currencySymbol: '$'
      },
      status: 'open',
      postedAt: new Date().toISOString(),
      claimed: false,
      claimedBy: null
    }]);
  }
  
  res.json(availableJobs);
});

/**
 * @route   GET api/jobs/nearby
 * @desc    Get nearby jobs based on lat/long
 * @access  Private
 */
router.get('/nearby', (req, res) => {
  const { lat, long, radius = 5 } = req.query;
  
  if (!lat || !long) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }
  
  // In a real app, you'd query a geo-indexed database
  // This is a simplified example that doesn't actually use the coordinates
  const nearbyJobs = jobs.filter(job => !job.claimed);
  
  res.json(nearbyJobs);
});

/**
 * @route   GET api/jobs
 * @desc    Get all jobs
 * @access  Public
 */
router.get('/', (req, res) => {
  // In a real app, you'd filter by location, availability, etc.
  res.json(jobs);
});

/**
 * @route   GET api/jobs/:id
 * @desc    Get a job by ID
 * @access  Public
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const job = jobs.find(job => job.id === id);
  
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  
  res.json(job);
});

/**
 * @route   POST api/jobs
 * @desc    Create a new job
 * @access  Private
 */
router.post('/', [
  conditionalAuth,
  check('title', 'Title is required').not().isEmpty(),
  check('pickup', 'Pickup location is required').not().isEmpty(),
  check('dropoff', 'Dropoff location is required').not().isEmpty(),
  check('weight', 'Weight must be a positive number').isNumeric({ min: 0.1 }),
  check('distance', 'Distance must be a positive number').isNumeric({ min: 0.1 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { 
    title, 
    description, 
    pickup, 
    dropoff, 
    weight, 
    distance,
    isRush,
    region = 'us' // Default to US if not specified
  } = req.body;
  
  // Get poster ID from authenticated user
  const posterId = req.user ? req.user.id : req.body.posterId; // Fallback for testing
  
  if (!posterId) {
    return res.status(400).json({ message: 'Poster ID is required' });
  }
  
  // Calculate price based on parameters
  const price = calculatePrice(region, distance, weight, isRush);
  
  const newJob = {
    id: Date.now().toString(),
    posterId,
    title,
    description,
    pickup,
    dropoff,
    pickupCoordinates: {
      lat: pickup.latitude || 40.7128,
      lng: pickup.longitude || -74.0060
    },
    dropoffCoordinates: {
      lat: dropoff.latitude || 40.7300,
      lng: dropoff.longitude || -73.9950
    },
    weight,
    distance,
    isRush: !!isRush,
    price,
    postedAt: new Date(),
    status: 'created',
    claimed: false,
    claimedBy: null
  };
  
  jobs.push(newJob);
  
  res.status(201).json(newJob);
});

/**
 * @route   POST api/jobs/:id/claim
 * @desc    Claim a job
 * @access  Private
 */
router.post('/:id/claim', conditionalAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user.id : req.body.userId;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  const jobIndex = jobs.findIndex(job => job.id === id);
  
  if (jobIndex === -1) {
    return res.status(404).json({ message: 'Job not found' });
  }
  
  if (jobs[jobIndex].claimed) {
    return res.status(400).json({ message: 'Job has already been claimed' });
  }
  
  // Update job
  jobs[jobIndex] = {
    ...jobs[jobIndex],
    claimed: true,
    claimedBy: userId,
    status: 'in_progress',
    claimedAt: new Date()
  };
  
  res.json(jobs[jobIndex]);
});

/**
 * @route   POST api/jobs/:id/accept
 * @desc    Accept a job (alias for claim)
 * @access  Private
 */
router.post('/:id/accept', conditionalAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user.id : req.body.userId;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  const jobIndex = jobs.findIndex(job => job.id === id);
  
  if (jobIndex === -1) {
    return res.status(404).json({ message: 'Job not found' });
  }
  
  if (jobs[jobIndex].claimed) {
    return res.status(400).json({ message: 'Job has already been claimed' });
  }
  
  // Update job
  jobs[jobIndex] = {
    ...jobs[jobIndex],
    claimed: true,
    claimedBy: userId,
    status: 'in_progress',
    claimedAt: new Date()
  };
  
  res.json(jobs[jobIndex]);
});

/**
 * @route   POST api/jobs/:id/complete
 * @desc    Mark a job as complete
 * @access  Private
 */
router.post('/:id/complete', conditionalAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user.id : req.body.userId;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  const jobIndex = jobs.findIndex(job => job.id === id);
  
  if (jobIndex === -1) {
    return res.status(404).json({ message: 'Job not found' });
  }
  
  if (!jobs[jobIndex].claimed) {
    return res.status(400).json({ message: 'Job has not been claimed yet' });
  }
  
  if (jobs[jobIndex].claimedBy !== userId) {
    return res.status(403).json({ message: 'You are not authorized to complete this job' });
  }
  
  // Update job
  jobs[jobIndex] = {
    ...jobs[jobIndex],
    status: 'completed',
    completedAt: new Date()
  };
  
  // In a real app, you'd trigger payment release here
  
  res.json(jobs[jobIndex]);
});

/**
 * @route   POST api/jobs/:id/confirm
 * @desc    Confirm job completion by poster
 * @access  Private
 */
router.post('/:id/confirm', conditionalAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user.id : req.body.userId;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  const jobIndex = jobs.findIndex(job => job.id === id);
  
  if (jobIndex === -1) {
    return res.status(404).json({ message: 'Job not found' });
  }
  
  if (jobs[jobIndex].status !== 'in_progress') {
    return res.status(400).json({ message: 'Only in-progress jobs can be confirmed' });
  }
  
  if (jobs[jobIndex].posterId !== userId) {
    return res.status(403).json({ message: 'Only the poster can confirm job completion' });
  }
  
  // Update job
  jobs[jobIndex] = {
    ...jobs[jobIndex],
    status: 'completed',
    confirmedAt: new Date()
  };
  
  res.json(jobs[jobIndex]);
});

/**
 * @route   GET api/jobs/:id/hauler-location
 * @desc    Get hauler's current location for a job
 * @access  Private
 */
router.get('/:id/hauler-location', conditionalAuth, (req, res) => {
  const { id } = req.params;
  
  const job = jobs.find(job => job.id === id);
  
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  
  if (!job.claimed || !job.claimedBy) {
    return res.status(400).json({ message: 'Job has not been claimed yet' });
  }
  
  // In a real app, you'd fetch the hauler's actual location
  // For development, return mock location between pickup and dropoff
  const pickupLat = job.pickupCoordinates?.lat || job.pickup.latitude;
  const pickupLng = job.pickupCoordinates?.lng || job.pickup.longitude;
  const dropoffLat = job.dropoffCoordinates?.lat || job.dropoff.latitude;
  const dropoffLng = job.dropoffCoordinates?.lng || job.dropoff.longitude;
  
  // Calculate a position between pickup and dropoff
  const progress = Math.random(); // 0 to 1
  const currentLat = pickupLat + (dropoffLat - pickupLat) * progress;
  const currentLng = pickupLng + (dropoffLng - pickupLng) * progress;
  
  // Calculate ETA based on progress
  const etaMinutes = Math.round((1 - progress) * 30); // 0-30 minutes
  
  res.json({
    location: {
      latitude: currentLat,
      longitude: currentLng,
      accuracy: 10, // meters
      heading: Math.random() * 360, // degrees
      speed: 10 + Math.random() * 30 // km/h
    },
    eta: etaMinutes
  });
});

/**
 * @route   GET api/jobs/:id/blockchain
 * @desc    Get blockchain info for a job
 * @access  Private
 */
router.get('/:id/blockchain', conditionalAuth, (req, res) => {
  const { id } = req.params;
  
  const job = jobs.find(job => job.id === id);
  
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  
  // Mock blockchain data
  res.json({
    onChain: Math.random() > 0.5, // 50% chance job is on blockchain
    chainJobId: '0x' + Math.random().toString(16).substr(2, 40),
    contractAddress: '0x' + Math.random().toString(16).substr(2, 40),
    transactionHash: '0x' + Math.random().toString(16).substr(2, 64)
  });
});

module.exports = router;