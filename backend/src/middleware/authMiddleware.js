const { verifyAccessToken } = require('../utils/tokenUtils');
const { query } = require('../config/database');
const { sendError } = require('../utils/apiResponse');

/**
 * Authentication Middleware
 * Validates JWT access token in Authorization header and populates req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(
        res,
        'Access token is required. Provide token via Authorization: Bearer <token>',
        401
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Access token is malformed', 401);
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return sendError(res, 'Access token has expired. Please refresh token', 401, {
          code: 'TOKEN_EXPIRED',
        });
      }
      return sendError(res, 'Invalid access token', 401, { code: 'TOKEN_INVALID' });
    }

    // Verify user exists and remains active in database
    const userResult = await query(
      'SELECT id, email, role, is_active, full_name FROM users WHERE id = $1',
      [decoded.userId]
    );
    const user = userResult.rows[0];

    if (!user) {
      return sendError(res, 'Authenticated user account no longer exists', 401);
    }

    if (!user.is_active) {
      return sendError(res, 'User account is deactivated', 403);
    }

    // Attach authenticated identity to request context
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  authenticate,
};

