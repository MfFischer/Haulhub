/**
 * Debug middleware to log all incoming requests
 * Add this to server/index.js before your routes
 */
const routeDebugMiddleware = (req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.originalUrl}`);
    next();
  };
  
  module.exports = routeDebugMiddleware;