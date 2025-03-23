/**
 * Form validation utility functions for HaulHub application
 */

// Email validation regex pattern
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Phone number validation regex (supports multiple formats)
const PHONE_REGEX = /^(\+\d{1,3}[- ]?)?\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/;

// Password must have at least 8 characters, one uppercase, one lowercase, and one number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Ethereum address validation
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Validates registration form data
 * @param {Object} data - Registration form data
 * @returns {Object} - Validation errors (empty if validation passes)
 */
export const validateRegistration = (data) => {
  const errors = {};

  // Full name validation
  if (!data.fullName || data.fullName.trim() === '') {
    errors.fullName = 'Full name is required';
  } else if (data.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }

  // Email validation
  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email address is required';
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone number validation
  if (!data.phoneNumber || data.phoneNumber.trim() === '') {
    errors.phoneNumber = 'Phone number is required';
  } else if (!PHONE_REGEX.test(data.phoneNumber)) {
    errors.phoneNumber = 'Please enter a valid phone number';
  }

  // Password validation
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (!PASSWORD_REGEX.test(data.password)) {
    errors.password = 'Password must contain at least 8 characters, including uppercase, lowercase, and numbers';
  }

  // Password confirmation validation
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // User type validation
  if (!data.userType) {
    errors.userType = 'Please select your user type';
  }

  // Terms agreement validation
  if (!data.agreeToTerms) {
    errors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy';
  }

  return errors;
};

/**
 * Validates login form data
 * @param {Object} data - Login form data
 * @returns {Object} - Validation errors (empty if validation passes)
 */
export const validateLogin = (data) => {
  const errors = {};

  // Email validation
  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email address is required';
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!data.password) {
    errors.password = 'Password is required';
  }

  return errors;
};

/**
 * Validates job creation/editing form data
 * @param {Object} data - Job form data
 * @returns {Object} - Validation errors (empty if validation passes)
 */
export const validateJobForm = (data) => {
  const errors = {};

  // Title validation
  if (!data.title || data.title.trim() === '') {
    errors.title = 'Job title is required';
  } else if (data.title.trim().length < 5) {
    errors.title = 'Job title must be at least 5 characters long';
  }

  // Description validation
  if (!data.description || data.description.trim() === '') {
    errors.description = 'Job description is required';
  } else if (data.description.trim().length < 20) {
    errors.description = 'Job description must be at least 20 characters long';
  }

  // Pickup location validation
  if (!data.pickupLocation || !data.pickupLocation.address) {
    errors.pickupLocation = 'Pickup location is required';
  }

  // Delivery location validation
  if (!data.deliveryLocation || !data.deliveryLocation.address) {
    errors.deliveryLocation = 'Delivery location is required';
  }

  // Date validation
  if (!data.pickupDate) {
    errors.pickupDate = 'Pickup date is required';
  } else {
    // Ensure the date is in the future
    const now = new Date();
    const pickupDate = new Date(data.pickupDate);
    
    if (pickupDate < now) {
      errors.pickupDate = 'Pickup date must be in the future';
    }
  }

  // Budget validation
  if (!data.budget) {
    errors.budget = 'Budget is required';
  } else if (isNaN(parseFloat(data.budget)) || parseFloat(data.budget) <= 0) {
    errors.budget = 'Please enter a valid budget amount';
  }

  // Job type validation
  if (!data.jobType) {
    errors.jobType = 'Please select a job type';
  }

  // Weight validation if provided
  if (data.weight !== undefined && data.weight !== '' && (isNaN(parseFloat(data.weight)) || parseFloat(data.weight) <= 0)) {
    errors.weight = 'Please enter a valid weight';
  }

  // Dimensions validation if provided
  if (data.dimensions) {
    const { length, width, height } = data.dimensions;
    
    if (length && (isNaN(parseFloat(length)) || parseFloat(length) <= 0)) {
      errors.dimensions = {...errors.dimensions, length: 'Please enter a valid length'};
    }
    
    if (width && (isNaN(parseFloat(width)) || parseFloat(width) <= 0)) {
      errors.dimensions = {...errors.dimensions, width: 'Please enter a valid width'};
    }
    
    if (height && (isNaN(parseFloat(height)) || parseFloat(height) <= 0)) {
      errors.dimensions = {...errors.dimensions, height: 'Please enter a valid height'};
    }
  }

  return errors;
};

/**
 * Validates vehicle form data
 * @param {Object} data - Vehicle form data
 * @returns {Object} - Validation errors (empty if validation passes)
 */
export const validateVehicleForm = (data) => {
  const errors = {};

  // Vehicle type validation
  if (!data.vehicleType) {
    errors.vehicleType = 'Vehicle type is required';
  }

  // Make validation
  if (!data.make || data.make.trim() === '') {
    errors.make = 'Vehicle make is required';
  }

  // Model validation
  if (!data.model || data.model.trim() === '') {
    errors.model = 'Vehicle model is required';
  }

  // Year validation
  if (!data.year) {
    errors.year = 'Vehicle year is required';
  } else {
    const yearNum = parseInt(data.year);
    const currentYear = new Date().getFullYear();
    
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      errors.year = `Please enter a valid year between 1900 and ${currentYear + 1}`;
    }
  }

  // License plate validation
  if (!data.licensePlate || data.licensePlate.trim() === '') {
    errors.licensePlate = 'License plate is required';
  }

  // Capacity validation if provided
  if (data.capacity !== undefined && data.capacity !== '' && (isNaN(parseFloat(data.capacity)) || parseFloat(data.capacity) <= 0)) {
    errors.capacity = 'Please enter a valid capacity';
  }

  return errors;
};

/**
 * Validates wallet withdrawal form data
 * @param {Object} data - Withdrawal form data
 * @returns {Object} - Validation errors (empty if validation passes)
 */
export const validateWithdrawalForm = (data) => {
  const errors = {};

  // Amount validation
  if (!data.amount) {
    errors.amount = 'Amount is required';
  } else if (isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
    errors.amount = 'Please enter a valid amount greater than 0';
  } else if (parseFloat(data.amount) > data.availableBalance) {
    errors.amount = 'Withdrawal amount cannot exceed your available balance';
  }

  // Wallet address validation
  if (!data.walletAddress) {
    errors.walletAddress = 'Wallet address is required';
  } else if (!ETH_ADDRESS_REGEX.test(data.walletAddress)) {
    errors.walletAddress = 'Please enter a valid Ethereum wallet address';
  }

  return errors;
};

/**
 * Validates a blockchain wallet address
 * @param {string} address - Wallet address to validate
 * @returns {boolean} - Whether the address is valid
 */
export const isValidWalletAddress = (address) => {
  return ETH_ADDRESS_REGEX.test(address);
};

export default {
  validateRegistration,
  validateLogin,
  validateJobForm,
  validateVehicleForm,
  validateWithdrawalForm,
  isValidWalletAddress
};