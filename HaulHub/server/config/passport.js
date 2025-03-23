const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
require('dotenv').config();

// Load User model - in a real app, you would import your User model
// const User = require('../models/User');

// Temporary in-memory user store for demonstration
// In a real app, you would use your database models
const users = [];

// JWT options configuration
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
  // You can also use other options like issuer or audience if needed
  // issuer: 'haulhub.com',
  // audience: 'haulhub.com',
};

// Configure Passport to use JWT Strategy
const configureJwtStrategy = () => {
  passport.use(new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
    try {
      // In a real app, find user in database
      // const user = await User.findById(jwt_payload.user.id);
      
      // For demonstration, find user in memory
      const user = users.find(user => user.id === jwt_payload.user.id);
      
      if (user) {
        // User found, pass to request object
        return done(null, {
          id: user.id,
          userType: user.userType,
          email: user.email
        });
      } else {
        // User not found
        return done(null, false);
      }
    } catch (error) {
      return done(error, false);
    }
  }));
};

// Configure Passport to use Local Strategy for username/password login
const configureLocalStrategy = () => {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      // In a real app, find user in database
      // const user = await User.findOne({ email });
      
      // For demonstration, find user in memory
      const user = users.find(user => user.email === email);
      
      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      // User authenticated
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));
};

// Initialize Passport configuration
const initializePassport = () => {
  // Configure strategies
  configureJwtStrategy();
  configureLocalStrategy();
  
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      // In a real app, find user by ID in database
      // const user = await User.findById(id);
      
      // For demonstration, find user in memory
      const user = users.find(user => user.id === id);
      
      if (!user) {
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  return passport;
};

module.exports = {
  initializePassport,
  jwtOptions
};