// backend/src/routes/favouriteRoutes.js

const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const {
  getMyFavourites,
  addFavourite,
  removeFavourite,
  checkFavourite,
} = require('../controllers/favouriteController');

const router = express.Router();

// All favourite routes require authentication and BUYER role.
// Apply middleware only to the actual favourite routes.
router.get(
  '/favourites',
  authenticate,
  authorizeRoles('BUYER'),
  getMyFavourites
);

router.post(
  '/favourites/:propertyId',
  authenticate,
  authorizeRoles('BUYER'),
  addFavourite
);

router.get(
  '/favourites/:propertyId/check',
  authenticate,
  authorizeRoles('BUYER'),
  checkFavourite
);

router.delete(
  '/favourites/:propertyId',
  authenticate,
  authorizeRoles('BUYER'),
  removeFavourite
);

module.exports = router;