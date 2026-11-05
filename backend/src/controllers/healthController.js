const { testConnection } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Health Check Controller
 * Verifies API server vitality and PostgreSQL database connectivity.
 */
const getHealth = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const dbStatus = await testConnection();

    return sendSuccess(res, 'EstateIQ API and database are operational', {
      api: {
        status: 'UP',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
      database: {
        status: 'CONNECTED',
        name: dbStatus.database,
        latencyMs: dbStatus.latencyMs,
        serverTime: dbStatus.serverTime,
        version: dbStatus.version.split(' ')[0] + ' ' + dbStatus.version.split(' ')[1], // e.g. "PostgreSQL 17.2"
      },
    }, 200);
  } catch (error) {
    return sendError(res, 'Database connection probe failed', 503, {
      api: {
        status: 'UP',
        timestamp: new Date().toISOString(),
      },
      database: {
        status: 'DISCONNECTED',
        error: error.message,
      },
    });
  }
};

module.exports = {
  getHealth,
};

