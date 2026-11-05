// Lead Routes
const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  calculateLead,
  getLeadProfile,
  getMyLeadProfile,
  listLeads,
  getLeadHistory,
  predictLead,
} = require('../controllers/leadController');

const router = express.Router();

// All lead routes require authentication
router.use(authenticate);

// Admin only routes
router.post('/leads/:userId/calculate', authorizeRoles('ADMIN'), calculateLead);
router.get('/leads/:userId', authorizeRoles('ADMIN'), getLeadProfile);
router.get('/leads', authorizeRoles('ADMIN'), listLeads);
router.get('/leads/:userId/history', authorizeRoles('ADMIN'), getLeadHistory);

// Buyer (or any authenticated) own lead profile
router.get('/leads/me', getMyLeadProfile);

module.exports = router;

