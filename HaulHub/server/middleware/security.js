const helmet = require('helmet');
const cors = require('cors');
const { body, validationResult } = require('express-validator');

const securityMiddleware = [
  helmet(), // Adds various HTTP headers for security
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  }),
];

const validateWithdrawal = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Invalid amount'),
  body('method').isIn(['crypto', 'paypal', 'bank']).withMessage('Invalid payment method'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { securityMiddleware, validateWithdrawal };