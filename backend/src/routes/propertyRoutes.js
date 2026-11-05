// Property Routes
const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyListings,
} = require('../controllers/propertyController');

const router = express.Router();

// Public (no auth) routes
// Authenticated routes – placed before dynamic :id routes
router.get(
  '/properties/my/listings',
  authenticate,
  authorizeRoles('AGENT', 'ADMIN'),
  getMyListings
);

// Public (no auth) routes
router.get('/properties', getAllProperties);
router.get('/properties/:id', getPropertyById);

// Protected create / update / delete – require AGENT or ADMIN role
router.post(
  '/properties',
  authenticate,
  authorizeRoles('AGENT', 'ADMIN'),
  createProperty
);
router.put(
  '/properties/:id',
  authenticate,
  authorizeRoles('AGENT', 'ADMIN'),
  updateProperty
);
router.delete(
  '/properties/:id',
  authenticate,
  authorizeRoles('AGENT', 'ADMIN'),
  deleteProperty
);

module.exports = router;
