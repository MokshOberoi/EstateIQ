const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  calculateRefreshTokenExpiry,
} = require('../utils/tokenUtils');

/**
 * Register a new user with BUYER role only.
 */
const registerUser = async ({ name, email, password, phone, deviceInfo }) => {
  // Check if email already exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password with 12 bcrypt salt rounds
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Insert user with enforced 'BUYER' role
  const insertUserSql = `
    INSERT INTO users (full_name, email, password_hash, phone, role, is_active)
    VALUES ($1, $2, $3, $4, 'BUYER', TRUE)
    RETURNING id, full_name, email, phone, role, avatar_url, is_active, created_at;
  `;
  const result = await query(insertUserSql, [name, email, passwordHash, phone]);
  const user = result.rows[0];

  // Initialize lead profile for new buyer
  await query(
    'INSERT INTO lead_profiles (user_id, current_score, classification) VALUES ($1, 0, $2) ON CONFLICT (user_id) DO NOTHING;',
    [user.id, 'COLD']
  );

  // Issue tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = calculateRefreshTokenExpiry();

  // Store hashed refresh token
  const insertTokenSql = `
    INSERT INTO refresh_tokens (user_id, token_hash, device_info, expires_at)
    VALUES ($1, $2, $3, $4);
  `;
  await query(insertTokenSql, [user.id, refreshTokenHash, deviceInfo || null, expiresAt]);

  return {
    user,
    tokens: {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
    },
  };
};

/**
 * Authenticate user and issue tokens.
 */
const loginUser = async ({ email, password, deviceInfo }) => {
  const result = await query(
    'SELECT id, full_name, email, password_hash, phone, role, avatar_url, is_active, created_at FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];

  // Generic message prevents username harvesting
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  if (!user.is_active) {
    const error = new Error('Your account is currently inactive. Please contact support.');
    error.statusCode = 403;
    throw error;
  }

  // Issue tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = calculateRefreshTokenExpiry();

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, device_info, expires_at)
     VALUES ($1, $2, $3, $4);`,
    [user.id, refreshTokenHash, deviceInfo || null, expiresAt]
  );

  // Strip sensitive password hash before returning
  delete user.password_hash;

  return {
    user,
    tokens: {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
    },
  };
};

/**
 * Rotate refresh token and issue new token pair.
 */
const refreshTokens = async ({ refreshToken, deviceInfo }) => {
  const tokenHash = hashToken(refreshToken);

  const tokenQuery = `
    SELECT rt.id as token_id, rt.user_id, rt.expires_at, rt.revoked_at,
           u.id, u.full_name, u.email, u.phone, u.role, u.avatar_url, u.is_active, u.created_at
    FROM refresh_tokens rt
    JOIN users u ON rt.user_id = u.id
    WHERE rt.token_hash = $1;
  `;
  const result = await query(tokenQuery, [tokenHash]);
  const tokenRecord = result.rows[0];

  if (!tokenRecord) {
    const error = new Error('Invalid refresh token.');
    error.statusCode = 401;
    throw error;
  }

  // Token reuse detection: if revoked token is used, reject immediately
  if (tokenRecord.revoked_at) {
    const error = new Error('Refresh token has already been revoked.');
    error.statusCode = 401;
    throw error;
  }

  // Expiration check
  if (new Date(tokenRecord.expires_at) < new Date()) {
    const error = new Error('Refresh token has expired. Please login again.');
    error.statusCode = 401;
    throw error;
  }

  if (!tokenRecord.is_active) {
    const error = new Error('Account is deactivated.');
    error.statusCode = 403;
    throw error;
  }

  // 1. Revoke the used refresh token (Rotation)
  await query('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1', [
    tokenRecord.token_id,
  ]);

  // 2. Issue new token pair
  const user = {
    id: tokenRecord.id,
    full_name: tokenRecord.full_name,
    email: tokenRecord.email,
    phone: tokenRecord.phone,
    role: tokenRecord.role,
    avatar_url: tokenRecord.avatar_url,
    is_active: tokenRecord.is_active,
    created_at: tokenRecord.created_at,
  };

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken();
  const newRefreshTokenHash = hashToken(newRefreshToken);
  const newExpiresAt = calculateRefreshTokenExpiry();

  // 3. Store new hashed refresh token
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, device_info, expires_at)
     VALUES ($1, $2, $3, $4);`,
    [user.id, newRefreshTokenHash, deviceInfo || null, newExpiresAt]
  );

  return {
    tokens: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
    },
  };
};

/**
 * Revoke refresh token upon logout.
 */
const logoutUser = async ({ refreshToken }) => {
  if (!refreshToken) return true;

  try {
    const tokenHash = hashToken(refreshToken);
    await query(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1 AND revoked_at IS NULL;',
      [tokenHash]
    );
  } catch (err) {
    // Graceful error swallow ensures logout never crashes
  }

  return true;
};

/**
 * Fetch authenticated user profile.
 */
const getUserProfile = async (userId) => {
  const result = await query(
    'SELECT id, full_name, email, phone, role, avatar_url, is_active, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );

  const user = result.rows[0];
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

module.exports = {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
  getUserProfile,
};

