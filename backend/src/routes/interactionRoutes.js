// backend/src/routes/interactionRoutes.js
// Routes for Interaction Tracking API

const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { createInteraction, createBatch, getMyInteractions } = require('../controllers/interactionController');

const router = express.Router();

// All routes require authentication (any role)
router.use(authenticate);

router.post('/interactions', createInteraction);
router.post('/interactions/batch', createBatch);
router.get('/interactions/me', getMyInteractions);

module.exports = router;

