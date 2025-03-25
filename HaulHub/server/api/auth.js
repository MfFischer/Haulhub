const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

// Mock users (same as in auth.js)
const devUsers = [
  {
    id: 'user-dev-1',
    email: 'hauler@example.com',
    password: 'password123',
    name: 'Test Hauler',
    userType: 'hauler',
    preferredRole: 'hauler',
    profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
    rating: 4.8,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'user-dev-2',
    email: 'poster@example.com',
    password: 'password123',
    name: 'Test Poster',
    userType: 'poster',
    preferredRole: 'poster',
    profileImage: 'https://randomuser.me/api/portraits/women/1.jpg',
    rating: 4.5,
    createdAt: new Date('2024-01-15')
  }
];

/**
 * @route   GET api/users/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', auth, (req, res) => {
  try {
    // Find the user by ID (from auth middleware)
    const user = devUsers.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data without sensitive fields
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      preferredRole: user.preferredRole,
      profileImage: user.profileImage,
      rating: user.rating
    });
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   PUT api/users/me
 * @desc    Update user profile
 * @access  Private
 */
router.put('/me', auth, (req, res) => {
  try {
    // Find the user by ID (from auth middleware)
    const userIndex = devUsers.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields
    const user = devUsers[userIndex];
    const updatedUser = {
      ...user,
      ...req.body,
      // Don't allow these fields to be updated
      id: user.id,
      email: user.email,
      password: user.password
    };
    
    // Save updated user
    devUsers[userIndex] = updatedUser;
    
    // Return updated user data
    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      userType: updatedUser.userType,
      preferredRole: updatedUser.preferredRole,
      profileImage: updatedUser.profileImage,
      rating: updatedUser.rating
    });
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   PUT api/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', auth, (req, res) => {
  try {
    // Find the user by ID (from auth middleware)
    const userIndex = devUsers.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update preferences
    devUsers[userIndex].preferredRole = req.body.preferredRole || devUsers[userIndex].preferredRole;
    
    res.json({ success: true });
  } catch (err) {
    console.error('Update preferences error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;