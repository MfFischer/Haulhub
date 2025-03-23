const { validationResult } = require('express-validator');

/**
 * Middleware to validate request data
 * Used after express-validator checks
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Check if user is a hauler
 */
const isHauler = (req, res, next) => {
  if (req.user && req.user.userType === 'hauler') {
    return next();
  }
  
  return res.status(403).json({ message: 'Access denied. Hauler role required.' });
};

/**
 * Check if user is a poster
 */
const isPoster = (req, res, next) => {
  if (req.user && req.user.userType === 'poster') {
    return next();
  }
  
  return res.status(403).json({ message: 'Access denied. Poster role required.' });
};

/**
 * Check if the requested resource belongs to the authenticated user
 * Requires resourceIdParam to be provided (e.g., 'id' for /api/resource/:id)
 */
const isResourceOwner = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({ message: 'Resource ID not provided' });
      }
      
      // In a real app, you would query your database
      // const resource = await resourceModel.findById(resourceId);
      
      // For demonstration, we'll use an in-memory approach
      // This should be replaced with proper database queries
      const resource = global[resourceModel.collection.name]?.find(
        r => r.id.toString() === resourceId.toString()
      );
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      if (resource.userId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Access denied. Not the owner of this resource.' });
      }
      
      req.resource = resource;
      next();
    } catch (err) {
      console.error(`Error in isResourceOwner middleware: ${err.message}`);
      res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = {
  validate,
  isHauler,
  isPoster,
  isResourceOwner
};