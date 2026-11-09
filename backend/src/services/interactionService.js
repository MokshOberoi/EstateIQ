// backend/src/services/interactionService.js
// Service layer for handling user interactions (telemetry)

const { query, pool } = require('../config/database');
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Valid enum values taken from database/schema.sql
const VALID_EVENT_TYPES = [
  'PAGE_VIEW',
  'PROPERTY_VIEW',
  'FAVOURITE_ADD',
  'FAVOURITE_REMOVE',
  'ENQUIRY_SUBMIT',
  'SEARCH_FILTER',
  'IMAGE_GALLERY_EXPAND',
  'CONTACT_AGENT_CLICK',
];

/** Validate a single interaction payload */
function validateInteraction(payload) {
  const {
    event_type,
    property_id,
    session_id,
    dwell_time_seconds,
    metadata,
  } = payload;

  if (!event_type) {
    return { ok: false, message: 'event_type is required' };
  }
  if (!VALID_EVENT_TYPES.includes(event_type)) {
    return {
      ok: false,
      message: `Invalid event_type. Allowed values: ${VALID_EVENT_TYPES.join(', ')}`,
    };
  }
  if (property_id && !UUID_REGEX.test(property_id)) {
    return { ok: false, message: 'Invalid property_id' };
  }
  if (session_id && !UUID_REGEX.test(session_id)) {
    return { ok: false, message: 'Invalid session_id' };
  }
  if (dwell_time_seconds !== undefined) {
    const num = Number(dwell_time_seconds);
    if (!Number.isInteger(num) || num < 0) {
      return {
        ok: false,
        message: 'dwell_time_seconds must be a non-negative integer',
      };
    }
  }
  if (metadata !== undefined) {
    if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return { ok: false, message: 'metadata must be an object' };
    }
  }
  return { ok: true };
}

/** Record a single interaction */
async function recordInteraction(userId, payload) {
  const validation = validateInteraction(payload);
  if (!validation.ok) return { badRequest: true, message: validation.message };

  const { event_type, property_id, session_id, dwell_time_seconds = 0, metadata = {} } = payload;
  const sql = `
    INSERT INTO user_interactions (user_id, property_id, session_id, event_type, dwell_time_seconds, metadata)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`;
  const values = [
    userId,
    property_id || null,
    session_id || null,
    event_type,
    dwell_time_seconds,
    JSON.stringify(metadata),
  ];
  const res = await query(sql, values);
  return { interaction: res.rows[0] };
}

/** Batch insert up to 50 interactions atomically */
async function recordBatch(userId, interactions) {
  if (!Array.isArray(interactions) || interactions.length === 0) {
    return { badRequest: true, message: 'interactions array is required' };
  }
  if (interactions.length > 50) {
    return { badRequest: true, message: 'Batch limit exceeded (max 50 interactions)' };
  }

  // Validate each interaction before starting transaction
  for (const i of interactions) {
    const v = validateInteraction(i);
    if (!v.ok) return { badRequest: true, message: v.message };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const placeholders = [];
    const values = [];
    let idx = 1;
    for (const i of interactions) {
      const { event_type, property_id, session_id, dwell_time_seconds = 0, metadata = {} } = i;
      placeholders.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5})`);
      values.push(
        userId,
        property_id || null,
        session_id || null,
        event_type,
        dwell_time_seconds,
        JSON.stringify(metadata)
      );
      idx += 6;
    }
    const insertSql = `
      INSERT INTO user_interactions (user_id, property_id, session_id, event_type, dwell_time_seconds, metadata)
      VALUES ${placeholders.join(', ')}`;
    await client.query(insertSql, values);
    await client.query('COMMIT');
    return { count: interactions.length };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Retrieve paginated interactions for a user */
async function getUserInteractions(userId, { page = 1, limit = 20 }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (safePage - 1) * safeLimit;

  const countRes = await query('SELECT COUNT(*) FROM user_interactions WHERE user_id = $1', [userId]);
  const total = Number(countRes.rows[0].count);

  const dataRes = await query(
    `SELECT * FROM user_interactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, safeLimit, offset]
  );
  return { rows: dataRes.rows, total, page: safePage, limit: safeLimit };
}

module.exports = {
  recordInteraction,
  recordBatch,
  getUserInteractions,
  VALID_EVENT_TYPES,
};

