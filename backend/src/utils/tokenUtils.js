const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Support both JWT_ACCESS_SECRET and JWT_SECRET for flexible deployments
const getAccessSecret = () =>
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'estateiq_default_access_secret';

const getAccessExpiresIn = () =>
  process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m';

const getRefreshExpiresIn = () =>
  process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate a cryptographically signed JWT access token.
 * Payload includes minimal identity fields: userId, email, and role.
 */
const generateAccessToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: getAccessExpiresIn(),
  });
};

/**
 * Generate an opaque, cryptographically random refresh token.
 * 40 bytes = 80 hex characters.
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Hash a token using SHA-256 for secure database persistence.
 * Prevents plain-text token exposure in database breaches.
 */
const hashToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a valid non-empty string');
  }
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Calculate refresh token expiration date.
 * Parses strings like '7d', '24h', or defaults to 7 days.
 */
const calculateRefreshTokenExpiry = () => {
  const durationStr = getRefreshExpiresIn().toLowerCase();
  let ms = 7 * 24 * 60 * 60 * 1000; // Default: 7 days

  if (durationStr.endsWith('d')) {
    const days = parseInt(durationStr.slice(0, -1), 10);
    if (!isNaN(days)) ms = days * 24 * 60 * 60 * 1000;
  } else if (durationStr.endsWith('h')) {
    const hours = parseInt(durationStr.slice(0, -1), 10);
    if (!isNaN(hours)) ms = hours * 60 * 60 * 1000;
  } else if (durationStr.endsWith('m')) {
    const minutes = parseInt(durationStr.slice(0, -1), 10);
    if (!isNaN(minutes)) ms = minutes * 60 * 1000;
  }

  return new Date(Date.now() + ms);
};

/**
 * Verify and decode an access token.
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessSecret());
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  calculateRefreshTokenExpiry,
  verifyAccessToken,
};

