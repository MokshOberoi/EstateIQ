const { sendError } = require('../utils/apiResponse');

/**
 * Role-Based Authorization Guard Middleware
 * Restricts endpoint access to specific authorized user roles.
 *
 * @param {...string} allowedRoles - e.g. authorizeRoles('AGENT', 'ADMIN')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required before role authorization', 401);
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return sendError(
        res,
        `Access denied. Role '${userRole}' is not authorized. Required: [${allowedRoles.join(', ')}]`,
        403
      );
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};

