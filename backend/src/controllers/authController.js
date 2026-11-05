const authService = require('../services/authService');
const {
  validateRegister,
  validateLogin,
  validateRefresh,
} = require('../validators/authValidator');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Register a new buyer account.
 */
const register = async (req, res, next) => {
  try {
    const { isValid, errors, data } = validateRegister(req.body);
    if (!isValid) {
      return sendError(res, 'Validation error', 400, errors);
    }

    const deviceInfo = req.headers['user-agent'] || 'Unknown client';
    const result = await authService.registerUser({
      ...data,
      deviceInfo,
    });

    return sendSuccess(res, 'Registration successful', result, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Login user and issue token pair.
 */
const login = async (req, res, next) => {
  try {
    const { isValid, errors, data } = validateLogin(req.body);
    if (!isValid) {
      return sendError(res, 'Validation error', 400, errors);
    }

    const deviceInfo = req.headers['user-agent'] || 'Unknown client';
    const result = await authService.loginUser({
      ...data,
      deviceInfo,
    });

    return sendSuccess(res, 'Login successful', result, 200);
  } catch (err) {
    next(err);
  }
};

/**
 * Refresh tokens with rotation.
 */
const refresh = async (req, res, next) => {
  try {
    const { isValid, errors, data } = validateRefresh(req.body);
    if (!isValid) {
      return sendError(res, 'Validation error', 400, errors);
    }

    const deviceInfo = req.headers['user-agent'] || 'Unknown client';
    const result = await authService.refreshTokens({
      refreshToken: data.refreshToken,
      deviceInfo,
    });

    return sendSuccess(res, 'Tokens refreshed successfully', result, 200);
  } catch (err) {
    next(err);
  }
};

/**
 * Logout and revoke refresh token.
 */
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.body?.refreshToken;
    await authService.logoutUser({ refreshToken });

    return sendSuccess(res, 'Logged out successfully', null, 200);
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user profile.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.id);
    return sendSuccess(res, 'User profile retrieved successfully', { user }, 200);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};

