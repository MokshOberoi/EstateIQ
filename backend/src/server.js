const path = require('path');
const dotenv = require('dotenv');

// Load environment variables before anything else
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { testConnection, closePool } = require('./config/database');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

/**
 * Start the HTTP server after verifying the database connection.
 */
const startServer = async () => {
  try {
    // Probe database on startup
    const dbStatus = await testConnection();
    console.log(
      `[Database] Successfully connected to PostgreSQL '${dbStatus.database}' (${dbStatus.latencyMs}ms)`
    );

    server = app.listen(PORT, () => {
      console.log(`[EstateIQ API] Server running in ${NODE_ENV} mode on http://localhost:${PORT}`);
      console.log(`[EstateIQ API] Health check endpoint: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (err) {
    console.error('[Startup Error] Failed to connect to PostgreSQL database:', err.message);
    console.error('Ensure PostgreSQL is running on port 5432 using: powershell -ExecutionPolicy Bypass -File scripts/db.ps1 start');
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n[EstateIQ API] Received ${signal}. Closing HTTP server and database pool...`);
  if (server) {
    server.close(async () => {
      console.log('[EstateIQ API] HTTP server closed.');
      try {
        await closePool();
        console.log('[EstateIQ API] PostgreSQL pool closed cleanly.');
        process.exit(0);
      } catch (poolErr) {
        console.error('[EstateIQ API] Error closing PostgreSQL pool:', poolErr);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
