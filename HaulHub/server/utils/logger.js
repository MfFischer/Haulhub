const winston = require('winston');
require('winston-daily-rotate-file');
require('dotenv').config();

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Define format for console logs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define format for file logs
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json()
);

// Define Daily Rotate File transport
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/haulhub-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
  level: level(),
});

// Initialize winston logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports: [
    // Log to files using rotating logs
    fileRotateTransport,
    // Log to console with colors
    new winston.transports.Console({
      format: consoleFormat,
    })
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// Create a stream object for morgan integration
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

/**
 * Log an info message
 * @param {string} message - The message to log
 * @param {Object} meta - Optional metadata
 */
const info = (message, meta = {}) => {
  logger.info(message, { meta });
};

/**
 * Log a warning message
 * @param {string} message - The message to log
 * @param {Object} meta - Optional metadata
 */
const warn = (message, meta = {}) => {
  logger.warn(message, { meta });
};

/**
 * Log an error message
 * @param {Error|string} error - The error to log
 * @param {Object} meta - Optional metadata
 */
const error = (error, meta = {}) => {
  if (error instanceof Error) {
    logger.error(`${error.message}\n${error.stack}`, { meta });
  } else {
    logger.error(error, { meta });
  }
};

/**
 * Log a debug message
 * @param {string} message - The message to log
 * @param {Object} meta - Optional metadata
 */
const debug = (message, meta = {}) => {
  logger.debug(message, { meta });
};

/**
 * Log an HTTP request/response
 * @param {string} message - The message to log
 * @param {Object} meta - Optional metadata
 */
const http = (message, meta = {}) => {
  logger.http(message, { meta });
};

/**
 * Log API request details
 * @param {Object} req - Express request object
 * @param {string} note - Optional note about the request
 */
const logRequest = (req, note = '') => {
  const details = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || 'unauthenticated',
    userAgent: req.headers['user-agent'],
    note
  };
  
  http(`API Request ${req.method} ${req.originalUrl}`, details);
};

/**
 * Log API errors with request context
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {string} note - Optional note about the error
 */
const logApiError = (err, req, note = '') => {
  const details = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || 'unauthenticated',
    userAgent: req.headers['user-agent'],
    params: req.params,
    query: req.query,
    body: req.body,
    note
  };
  
  error(`API Error: ${err.message}`, details);
};

module.exports = {
  info,
  warn,
  error,
  debug,
  http,
  logRequest,
  logApiError,
  stream: logger.stream
};