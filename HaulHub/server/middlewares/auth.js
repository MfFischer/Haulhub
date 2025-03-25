const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Authentication middleware for protecting routes
 * Verifies JWT token in Authorization header and adds user data to request
 */
module.exports = function(req, res, next) {
  // Skip auth in development mode if enabled
  if (process.env.NODE_ENV === 'development' && 
      process.env.SKIP_AUTH_FOR_DEV === 'true') {
    console.log('Development mode: Auth check bypassed');
    
    // Add mock user to request
    req.user = {
      id: 'user-dev-1',
      name: 'Test Hauler',
      email: 'hauler@example.com',
      userType: 'hauler',
    };
    
    return next();
  }
  
  // Get token from header
  let token = req.header('Authorization');
  
  // Remove Bearer prefix if present
  if (token && token.startsWith('Bearer ')) {
    token = token.substring(7);
  }
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Add user from payload to request
    req.user = decoded.user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};