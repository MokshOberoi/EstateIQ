const { sendError } = require('../utils/apiResponse');

/**
 * Centralized Error-Handling Middleware
 * Formats uncaught application errors into standardized JSON responses.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log server errors for debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  const details = process.env.NODE_ENV === 'development' ? { stack: err.stack } : null;

  return sendError(res, message, statusCode, details);
};

module.exports = errorHandler;

