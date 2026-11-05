const { sendError } = require('../utils/apiResponse');

/**
 * 404 Not Found Middleware
 * Intercepts unmapped endpoints and returns a structured JSON error.
 */
const notFound = (req, res, next) => {
  return sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
};

module.exports = notFound;

