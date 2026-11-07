// backend/src/routes/enquiryRoutes.js
// Routes for Property Enquiries workflow.

const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  createEnquiry,
  getMyEnquiries,
  getAgentEnquiries,
  updateEnquiry,
} = require('../controllers/enquiryController');

const router = express.Router();

// All enquiry routes require authentication
router.use(authenticate);

// Buyer submits an enquiry for a property
router.post('/enquiries', authorizeRoles('BUYER'), createEnquiry);

// Buyer views own submitted enquiries
router.get('/enquiries/me', authorizeRoles('BUYER'), getMyEnquiries);

// Agent (or Admin) views received enquiries
router.get('/enquiries/agent', authorizeRoles('AGENT', 'ADMIN'), getAgentEnquiries);

// Agent (or Admin) updates enquiry status and agent notes
router.patch('/enquiries/:id', authorizeRoles('AGENT', 'ADMIN'), updateEnquiry);

module.exports = router;

