/**
 * Standardized API Response Utilities
 * Enforces consistent JSON schemas across all EstateIQ endpoints.
 */

const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

const sendError = (res, message, statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: {
      message,
      statusCode,
      ...(details && { details }),
    },
  };
  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};

