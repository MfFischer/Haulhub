const { body, param, query, validationResult } = require('express-validator');

/**
 * Common validation helper methods for Express routes
 */

/**
 * Process validation results into a standardized format
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object|void} - Returns validation errors or continues to next middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array({ onlyFirstError: true })
    });
  }
  next();
};

/**
 * Common validations for user registration
 */
const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/).withMessage('Password must include at least one uppercase letter, one lowercase letter, and one number'),
  
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isMobilePhone().withMessage('Please enter a valid phone number'),
  
  body('userType')
    .trim()
    .notEmpty().withMessage('User type is required')
    .isIn(['hauler', 'poster']).withMessage('User type must be either hauler or poster'),
  
  body('agreeToTerms')
    .equals('true').withMessage('You must agree to the Terms of Service and Privacy Policy')
];

/**
 * Common validations for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

/**
 * Common validations for job creation
 */
const createJobValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Job title is required')
    .isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Job description is required')
    .isLength({ min: 20, max: 2000 }).withMessage('Description must be between 20 and 2000 characters'),
  
  body('pickup')
    .notEmpty().withMessage('Pickup location is required')
    .isObject().withMessage('Pickup must be a valid object'),
  
  body('pickup.address')
    .trim()
    .notEmpty().withMessage('Pickup address is required'),
  
  body('pickup.location')
    .notEmpty().withMessage('Pickup coordinates are required')
    .isObject().withMessage('Pickup location must be a valid object'),
  
  body('pickup.location.coordinates')
    .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be an array with exactly 2 elements'),
  
  body('pickup.location.coordinates.*')
    .isFloat().withMessage('Coordinates must be valid numbers'),
  
  body('dropoff')
    .notEmpty().withMessage('Dropoff location is required')
    .isObject().withMessage('Dropoff must be a valid object'),
  
  body('dropoff.address')
    .trim()
    .notEmpty().withMessage('Dropoff address is required'),
  
  body('dropoff.location')
    .notEmpty().withMessage('Dropoff coordinates are required')
    .isObject().withMessage('Dropoff location must be a valid object'),
  
  body('dropoff.location.coordinates')
    .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be an array with exactly 2 elements'),
  
  body('dropoff.location.coordinates.*')
    .isFloat().withMessage('Coordinates must be valid numbers'),
  
  body('schedule.pickupDate')
    .notEmpty().withMessage('Pickup date is required')
    .isISO8601().withMessage('Pickup date must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date < now) {
        throw new Error('Pickup date must be in the future');
      }
      return true;
    }),
  
  body('items.type')
    .trim()
    .notEmpty().withMessage('Item type is required'),
  
  body('items.weight')
    .notEmpty().withMessage('Item weight is required')
    .isFloat({ min: 0.1 }).withMessage('Weight must be a positive number'),
  
  body('payment.amount')
    .notEmpty().withMessage('Payment amount is required')
    .isFloat({ min: 0 }).withMessage('Payment amount must be a positive number')
];

/**
 * Common validations for wallet address linking
 */
const walletAddressValidation = [
  body('address')
    .trim()
    .notEmpty().withMessage('Wallet address is required')
    .matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Please enter a valid Ethereum wallet address')
];

/**
 * Common validations for vehicle creation
 */
const vehicleValidation = [
  body('vehicleType')
    .trim()
    .notEmpty().withMessage('Vehicle type is required')
    .isIn(['car', 'van', 'pickup', 'box_truck', 'flatbed', 'cargo_van', 'suv', 'trailer', 'motorcycle', 'bicycle', 'other'])
    .withMessage('Please select a valid vehicle type'),
  
  body('make')
    .trim()
    .notEmpty().withMessage('Vehicle make is required'),
  
  body('model')
    .trim()
    .notEmpty().withMessage('Vehicle model is required'),
  
  body('year')
    .notEmpty().withMessage('Vehicle year is required')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 1}`),
  
  body('licensePlate')
    .trim()
    .notEmpty().withMessage('License plate is required')
];

/**
 * Common validations for withdrawal requests
 */
const withdrawalValidation = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be at least 0.01'),
  
  body('walletAddress')
    .trim()
    .notEmpty().withMessage('Wallet address is required')
    .matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Please enter a valid Ethereum wallet address')
];

/**
 * Common validations for location updates
 */
const locationUpdateValidation = [
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
];

/**
 * Common validations for rating submissions
 */
const ratingValidation = [
  body('jobId')
    .notEmpty().withMessage('Job ID is required')
    .isMongoId().withMessage('Invalid job ID format'),
  
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
];

/**
 * Common validations for ID parameters
 */
const idParamValidation = [
  param('id')
    .notEmpty().withMessage('ID is required')
    .isMongoId().withMessage('Invalid ID format')
];

/**
 * Validate coordinates in query parameters
 */
const coordinatesValidation = [
  query('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  
  query('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
];

/**
 * Middleware to check if user has hauler role
 */
const isHauler = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (req.user.userType !== 'hauler') {
    return res.status(403).json({ message: 'Access denied. Hauler role required.' });
  }
  
  next();
};

/**
 * Middleware to check if user has poster role
 */
const isPoster = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (req.user.userType !== 'poster') {
    return res.status(403).json({ message: 'Access denied. Poster role required.' });
  }
  
  next();
};

/**
 * Custom validators for reuse
 */
const customValidators = {
  /**
   * Check if value is a valid Ethereum address
   */
  isEthereumAddress: (value) => {
    return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
  },
  
  /**
   * Check if a value is within a specified date range
   */
  isWithinDateRange: (value, fromDate, toDate) => {
    const date = new Date(value);
    return date >= fromDate && date <= toDate;
  },
  
  /**
   * Check if a value is a valid coordinate pair
   */
  isValidCoordinates: (value) => {
    if (!Array.isArray(value) || value.length !== 2) {
      return false;
    }
    
    const [longitude, latitude] = value;
    return (
      !isNaN(latitude) && 
      !isNaN(longitude) && 
      latitude >= -90 && 
      latitude <= 90 && 
      longitude >= -180 && 
      longitude <= 180
    );
  }
};

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createJobValidation,
  walletAddressValidation,
  vehicleValidation,
  withdrawalValidation,
  locationUpdateValidation,
  ratingValidation,
  idParamValidation,
  coordinatesValidation,
  isHauler,
  isPoster,
  customValidators
};