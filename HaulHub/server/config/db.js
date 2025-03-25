const mongoose = require('mongoose');
require('dotenv').config();

// Simplified connection string for development
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/haulhub';

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Don't exit process - just log the error
    return false;
  }
};

module.exports = connectDB;