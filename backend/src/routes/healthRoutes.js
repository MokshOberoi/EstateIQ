const express = require('express');
const { getHealth } = require('../controllers/healthController');

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    API and PostgreSQL health probe
 * @access  Public
 */
router.get('/health', getHealth);

module.exports = router;
