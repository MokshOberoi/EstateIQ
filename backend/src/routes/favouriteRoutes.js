// Favourite Routes
const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getMyFavourites,
  addFavourite,
  removeFavourite,
} = require('../controllers/favouriteController');

const router = express.Router();

// All routes require authentication and BUYER role
router.use(authenticate, authorizeRoles('BUYER'));

router.get('/favourites', getMyFavourites);
router.post('/favourites', addFavourite);
router.delete('/favourites/:propertyId', removeFavourite);

module.exports = router;

