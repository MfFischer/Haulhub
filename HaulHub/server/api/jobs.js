const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { calculatePrice } = require('../services/pricing');

// Sample in-memory data store for demonstration
// In production, this would be a database
const jobs = [];

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
 * @route   GET api/jobs/available
 * @desc    Get available jobs based on lat/lng
 * @access  Private
 */
router.get('/available', (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }
  
  // In a real app, you'd query a geo-indexed database
  // This is a simplified example that doesn't actually use the coordinates
  const availableJobs = jobs.filter(job => !job.claimed);
  
  res.json(availableJobs);
});

/**
 * @route   POST api/jobs
 * @desc    Create a new job
 * @access  Private
 */
router.post('/', [
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
  
  // Calculate price based on parameters
  const price = calculatePrice(region, distance, weight, isRush);
  
  const newJob = {
    id: Date.now().toString(),
    title,
    description,
    pickup,
    dropoff,
    weight,
    distance,
    isRush: !!isRush,
    price,
    postedAt: new Date(),
    status: 'open',
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
router.post('/:id/claim', (req, res) => {
  const { id } = req.params;
  const userId = req.body.userId; // In production, get from auth token
  
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
router.post('/:id/complete', (req, res) => {
  const { id } = req.params;
  const userId = req.body.userId; // In production, get from auth token
  
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

module.exports = router;