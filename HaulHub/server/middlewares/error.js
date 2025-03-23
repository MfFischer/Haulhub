/**
 * Not Found Error Handler
 * Catch 404 errors and forward to error handler
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
  };
  
  /**
   * General Error Handler
   * Provides full error handling for the API
   */
  const errorHandler = (err, req, res, next) => {
    // Log error in development/staging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error:', err);
    }
    
    // If response is already sent, pass to next error handler
    if (res.headersSent) {
      return next(err);
    }
    
    // Get status code
    const statusCode = err.status || err.statusCode || 500;
    
    // Prepare error response
    const errorResponse = {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    };
    
    // Send error response
    res.status(statusCode).json(errorResponse);
  };
  
  /**
   * Async Error Handler Wrapper
   * Wraps async route handlers to catch and forward errors
   */
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
  module.exports = {
    notFound,
    errorHandler,
    asyncHandler
  };