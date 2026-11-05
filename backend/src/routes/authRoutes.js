const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { sendSuccess } = require('../utils/apiResponse');

const router = express.Router();

// ============================================================================
// PUBLIC AUTHENTICATION ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new Buyer account
 * @access  Public (Role is always forced to BUYER)
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & return JWT tokens
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Rotate refresh token and issue new token pair
 * @access  Public (Requires valid refresh token)
 */
router.post('/refresh', authController.refresh);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Revoke refresh token
 * @access  Public
 */
router.post('/logout', authController.logout);

// ============================================================================
// PROTECTED USER IDENTITY ROUTE
// ============================================================================

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get profile of the currently logged-in user
 * @access  Private (Requires valid Access Token)
 */
router.get('/me', authenticate, authController.getMe);

// ============================================================================
// ROLE AUTHORIZATION VERIFICATION ROUTES (Used for RBAC testing)
// ============================================================================

/**
 * @route   GET /api/v1/auth/agent-only
 * @desc    Test route restricted to AGENT and ADMIN roles
 * @access  Private (AGENT, ADMIN)
 */
router.get(
  '/agent-only',
  authenticate,
  authorizeRoles('AGENT', 'ADMIN'),
  (req, res) => {
    return sendSuccess(res, 'Access granted to agent-only resource', {
      user: req.user,
      authorizedRoles: ['AGENT', 'ADMIN'],
    });
  }
);

/**
 * @route   GET /api/v1/auth/admin-only
 * @desc    Test route strictly restricted to ADMIN role
 * @access  Private (ADMIN)
 */
router.get(
  '/admin-only',
  authenticate,
  authorizeRoles('ADMIN'),
  (req, res) => {
    return sendSuccess(res, 'Access granted to admin-only resource', {
      user: req.user,
      authorizedRoles: ['ADMIN'],
    });
  }
);

module.exports = router;

