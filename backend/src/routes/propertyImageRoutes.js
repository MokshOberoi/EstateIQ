// backend/src/routes/propertyImageRoutes.js
// Routes for managing property images (upload, list, delete, set primary).

const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/multerConfig');
const {
  uploadImages,
  getPropertyImages,
  deleteImage,
  setPrimaryImage,
} = require('../controllers/propertyImageController');

const router = express.Router();

// All routes require authentication. AGENT and ADMIN can manage their own properties; ADMIN can manage any.
router.post('/:id/images', authenticate, authorizeRoles('AGENT', 'ADMIN'), upload.array('images', 10), uploadImages);
router.get('/:id/images', authenticate, authorizeRoles('AGENT', 'ADMIN'), getPropertyImages);
router.delete('/:id/images/:imageId', authenticate, authorizeRoles('AGENT', 'ADMIN'), deleteImage);
router.patch('/:id/images/:imageId/primary', authenticate, authorizeRoles('AGENT', 'ADMIN'), setPrimaryImage);

module.exports = router;

