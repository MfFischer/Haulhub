require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const { errorHandler, notFound } = require('./middlewares/error');
const logger = require('./utils/logger');

// Import services
const blockchainService = require('./services/blockchain');

// Import routes
const authRoutes = require('./api/auth');
const jobRoutes = require('./api/jobs');
const userRoutes = require('./api/users');
const paymentRoutes = require('./api/payments');
const locationRoutes = require('./api/location');

// Initialize express app
const app = express();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((err) => {
    logger.error('MongoDB connection error', err);
    process.exit(1);
  });

// Middleware
app.use(helmet()); // Security headers

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Logging
app.use(morgan('combined', { stream: logger.stream }));

// Parse JSON bodies
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve static files (if needed)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/location', locationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'HaulHub server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API documentation route
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Welcome to HaulHub API',
    version: '1.0.0',
    docs: 'https://docs.haulhub.com/api'
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  logger.info(`HaulHub server listening on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Initialize blockchain services
blockchainService.initBlockchainService()
  .then(() => {
    logger.info('Blockchain service initialized');
    
    // Set up blockchain event listeners
    return blockchainService.setupEventListeners();
  })
  .then(() => {
    logger.info('Blockchain event listeners set up');
  })
  .catch(err => {
    logger.error('Failed to initialize blockchain services', err);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = server; // Export for testing