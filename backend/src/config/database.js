const { Pool } = require('pg');

// Validate critical database environment variables
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.warn(`[Database Warning] Missing environment variables: ${missingVars.join(', ')}`);
}

// PostgreSQL connection pool configuration
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'estateiq',
  user: process.env.DB_USER || 'estateiq_user',
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT, 10) || 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(poolConfig);

// Handle idle pool errors
pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error] Unexpected idle client error:', err.message);
});

/**
 * Execute a parameterized query against the pool.
 * @param {string} text - SQL statement
 * @param {Array} params - Parameter values
 */
const query = (text, params) => pool.query(text, params);

/**
 * Safely verify database connectivity with a lightweight probe.
 * Returns metadata including response latency and server timestamp.
 */
const testConnection = async () => {
  const start = Date.now();
  const result = await pool.query(
    'SELECT NOW() as server_time, current_database() as database_name, version() as version;'
  );
  const duration = Date.now() - start;

  return {
    connected: true,
    database: result.rows[0].database_name,
    serverTime: result.rows[0].server_time,
    version: result.rows[0].version,
    latencyMs: duration,
  };
};

/**
 * Gracefully close the pool during application shutdown.
 */
const closePool = () => pool.end();

module.exports = {
  pool,
  query,
  testConnection,
  closePool,
};

