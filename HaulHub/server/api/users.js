const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middlewares/auth');

// In-memory storage for users and their vehicles/ratings
const users = [];
const vehicles = [];
const ratings = [];
const badges = [];

/**
 * @route   GET api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', auth, (req, res) => {
  try {
    // Find user
    const user = users.find(user => user.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive info
    const { password, ...userProfile } = user;
    
    // Get user's vehicles if they're a hauler
    if (user.userType === 'hauler') {
      const userVehicles = vehicles.filter(vehicle => vehicle.userId === req.user.id);
      userProfile.vehicles = userVehicles;
      
      // Get hauler's ratings
      const userRatings = ratings.filter(rating => rating.haulerId === req.user.id);
      userProfile.ratings = userRatings;
      
      // Calculate average rating
      if (userRatings.length > 0) {
        const ratingSum = userRatings.reduce((sum, rating) => sum + rating.rating, 0);
        userProfile.averageRating = ratingSum / userRatings.length;
      } else {
        userProfile.averageRating = 0;
      }
    }
    
    // Get badges
    const userBadges = badges.filter(badge => badge.userId === req.user.id);
    userProfile.badges = userBadges;
    
    res.json(userProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   PUT api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', [
  auth,
  check('fullName', 'Full name is required').optional().not().isEmpty(),
  check('phoneNumber', 'Valid phone number is required').optional().isMobilePhone(),
  check('profileImage', 'Profile image URL must be valid').optional().isURL(),
  check('bio', 'Bio must be less than 500 characters').optional().isLength({ max: 500 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { fullName, phoneNumber, profileImage, bio } = req.body;
    
    // Find user
    const userIndex = users.findIndex(user => user.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (fullName) users[userIndex].fullName = fullName;
    if (phoneNumber) users[userIndex].phoneNumber = phoneNumber;
    if (profileImage) users[userIndex].profileImage = profileImage;
    if (bio !== undefined) users[userIndex].bio = bio;
    
    users[userIndex].updatedAt = new Date();
    
    // Return updated profile without sensitive info
    const { password, ...updatedProfile } = users[userIndex];
    
    res.json(updatedProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user
    const user = users.find(user => user.id === id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive info
    const { password, email, phoneNumber, ...publicProfile } = user;
    
    // Get user's vehicles if they're a hauler
    if (user.userType === 'hauler') {
      const userVehicles = vehicles.filter(vehicle => vehicle.userId === id);
      publicProfile.vehicles = userVehicles;
      
      // Get hauler's ratings
      const userRatings = ratings.filter(rating => rating.haulerId === id);
      publicProfile.ratings = userRatings;
      
      // Calculate average rating
      if (userRatings.length > 0) {
        const ratingSum = userRatings.reduce((sum, rating) => sum + rating.rating, 0);
        publicProfile.averageRating = ratingSum / userRatings.length;
      } else {
        publicProfile.averageRating = 0;
      }
    }
    
    // Get badges
    const userBadges = badges.filter(badge => badge.userId === id);
    publicProfile.badges = userBadges;
    
    res.json(publicProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST api/users/vehicle
 * @desc    Add a vehicle (for haulers)
 * @access  Private
 */
router.post('/vehicle', [
  auth,
  check('vehicleType', 'Vehicle type is required').not().isEmpty(),
  check('make', 'Make is required').not().isEmpty(),
  check('model', 'Model is required').not().isEmpty(),
  check('year', 'Year must be a valid number').isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
  check('licensePlate', 'License plate is required').not().isEmpty(),
  check('capacity', 'Capacity must be a positive number').optional().isFloat({ min: 0 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // Check if user is a hauler
    const user = users.find(user => user.id === req.user.id);
    
    if (!user || user.userType !== 'hauler') {
      return res.status(403).json({ message: 'Only haulers can add vehicles' });
    }
    
    const { vehicleType, make, model, year, licensePlate, capacity, color, imageUrl } = req.body;
    
    // Create new vehicle
    const newVehicle = {
      id: Date.now().toString(),
      userId: req.user.id,
      vehicleType,
      make,
      model,
      year: parseInt(year),
      licensePlate,
      capacity: capacity ? parseFloat(capacity) : null,
      color: color || null,
      imageUrl: imageUrl || null,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    vehicles.push(newVehicle);
    
    res.status(201).json(newVehicle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   PUT api/users/vehicle/:id
 * @desc    Update a vehicle
 * @access  Private
 */
router.put('/vehicle/:id', [
  auth,
  check('vehicleType', 'Vehicle type is required').optional().not().isEmpty(),
  check('make', 'Make is required').optional().not().isEmpty(),
  check('model', 'Model is required').optional().not().isEmpty(),
  check('year', 'Year must be a valid number').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
  check('licensePlate', 'License plate is required').optional().not().isEmpty(),
  check('capacity', 'Capacity must be a positive number').optional().isFloat({ min: 0 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { id } = req.params;
    
    // Find vehicle
    const vehicleIndex = vehicles.findIndex(
      vehicle => vehicle.id === id && vehicle.userId === req.user.id
    );
    
    if (vehicleIndex === -1) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    const { vehicleType, make, model, year, licensePlate, capacity, color, imageUrl } = req.body;
    
    // Update fields
    if (vehicleType) vehicles[vehicleIndex].vehicleType = vehicleType;
    if (make) vehicles[vehicleIndex].make = make;
    if (model) vehicles[vehicleIndex].model = model;
    if (year) vehicles[vehicleIndex].year = parseInt(year);
    if (licensePlate) vehicles[vehicleIndex].licensePlate = licensePlate;
    if (capacity !== undefined) vehicles[vehicleIndex].capacity = capacity ? parseFloat(capacity) : null;
    if (color !== undefined) vehicles[vehicleIndex].color = color;
    if (imageUrl !== undefined) vehicles[vehicleIndex].imageUrl = imageUrl;
    
    vehicles[vehicleIndex].updatedAt = new Date();
    // Reset verification status if important details change
    if (make || model || year || licensePlate) {
      vehicles[vehicleIndex].verified = false;
    }
    
    res.json(vehicles[vehicleIndex]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   DELETE api/users/vehicle/:id
 * @desc    Delete a vehicle
 * @access  Private
 */
router.delete('/vehicle/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    
    // Find vehicle
    const vehicleIndex = vehicles.findIndex(
      vehicle => vehicle.id === id && vehicle.userId === req.user.id
    );
    
    if (vehicleIndex === -1) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Remove vehicle
    vehicles.splice(vehicleIndex, 1);
    
    res.json({ message: 'Vehicle removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST api/users/rate
 * @desc    Rate a hauler
 * @access  Private
 */
router.post('/rate', [
  auth,
  check('haulerId', 'Hauler ID is required').not().isEmpty(),
  check('jobId', 'Job ID is required').not().isEmpty(),
  check('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
  check('comment', 'Comment must be less than 500 characters').optional().isLength({ max: 500 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { haulerId, jobId, rating, comment } = req.body;
    
    // Check if user is a poster
    const user = users.find(user => user.id === req.user.id);
    
    if (!user || user.userType !== 'poster') {
      return res.status(403).json({ message: 'Only job posters can rate haulers' });
    }
    
    // Check if hauler exists
    const hauler = users.find(user => user.id === haulerId && user.userType === 'hauler');
    if (!hauler) {
      return res.status(404).json({ message: 'Hauler not found' });
    }
    
    // Check if already rated
    const existingRating = ratings.find(
      r => r.jobId === jobId && r.posterId === req.user.id && r.haulerId === haulerId
    );
    
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this hauler for this job' });
    }
    
    // Create new rating
    const newRating = {
      id: Date.now().toString(),
      haulerId,
      posterId: req.user.id,
      jobId,
      rating: parseInt(rating),
      comment: comment || null,
      createdAt: new Date()
    };
    
    ratings.push(newRating);
    
    // Check if hauler should get a badge based on ratings
    const haulerRatings = ratings.filter(r => r.haulerId === haulerId);
    const ratingSum = haulerRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = ratingSum / haulerRatings.length;
    
    // Award badge if conditions are met
    if (haulerRatings.length >= 10 && averageRating >= 4.5) {
      const existingBadge = badges.find(
        b => b.userId === haulerId && b.type === 'top_rated'
      );
      
      if (!existingBadge) {
        const topRatedBadge = {
          id: Date.now().toString(),
          userId: haulerId,
          type: 'top_rated',
          name: 'Top Rated Hauler',
          description: 'Awarded to haulers with at least 10 ratings and an average of 4.5 stars or higher',
          imageUrl: '/badges/top_rated.svg',
          issuedAt: new Date()
        };
        
        badges.push(topRatedBadge);
      }
    }
    
    res.status(201).json(newRating);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET api/users/ratings/:haulerId
 * @desc    Get ratings for a hauler
 * @access  Private
 */
router.get('/ratings/:haulerId', auth, (req, res) => {
  try {
    const { haulerId } = req.params;
    
    // Check if hauler exists
    const hauler = users.find(user => user.id === haulerId && user.userType === 'hauler');
    if (!hauler) {
      return res.status(404).json({ message: 'Hauler not found' });
    }
    
    // Get ratings
    const haulerRatings = ratings.filter(r => r.haulerId === haulerId);
    
    // Calculate average
    let averageRating = 0;
    if (haulerRatings.length > 0) {
      const ratingSum = haulerRatings.reduce((sum, r) => sum + r.rating, 0);
      averageRating = ratingSum / haulerRatings.length;
    }
    
    res.json({
      ratings: haulerRatings,
      average: averageRating,
      count: haulerRatings.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST api/users/wallet
 * @desc    Link wallet address to user account
 * @access  Private
 */
router.post('/wallet', [
  auth,
  check('address', 'Valid Ethereum address is required').isEthereumAddress(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { address } = req.body;
    
    // Find user
    const userIndex = users.findIndex(user => user.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update wallet address
    users[userIndex].walletAddress = address;
    users[userIndex].updatedAt = new Date();
    
    res.json({ 
      success: true, 
      walletAddress: address 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET api/users/badges
 * @desc    Get user's badges
 * @access  Private
 */
router.get('/badges', auth, (req, res) => {
  try {
    // Get user badges
    const userBadges = badges.filter(badge => badge.userId === req.user.id);
    
    res.json(userBadges);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;