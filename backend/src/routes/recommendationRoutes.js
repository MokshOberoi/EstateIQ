// Recommendation Routes
const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { generate, listMe, listUser } = require('../controllers/recommendationController');

const router = express.Router();

// All recommendation routes require authentication
router.use(authenticate);

// Generate recommendations (BUYER and ADMIN can generate for self but spec says BUYER only, but we rely on role check if needed)
router.post('/recommendations/generate', authorizeRoles('BUYER'), generate);

// List own recommendations
router.get('/recommendations/me', listMe);

// Admin can view any user's recommendations
router.get('/recommendations/:userId', authorizeRoles('ADMIN'), listUser);

module.exports = router;
