// Lead Service
const { query, pool } = require('../config/database');
const { sendError } = require('../utils/apiResponse');

/** Helper to compute lead scores and preferences */
async function computeLeadMetrics(userId) {
  // Gather interaction metrics
  const interactionRes = await query(
    `SELECT event_type, COUNT(*) AS cnt, SUM(dwell_time_seconds) AS dwell_sum
     FROM user_interactions
     WHERE user_id = $1
     GROUP BY event_type`,
    [userId]
  );
  const counts = {};
  interactionRes.rows.forEach((row) => {
    counts[row.event_type] = Number(row.cnt);
    if (row.dwell_sum !== null) counts.dwell = Number(row.dwell_sum);
  });

  // Favourites and enquiries counts
  const favRes = await query('SELECT COUNT(*) FROM favourites WHERE user_id = $1', [userId]);
  const enquRes = await query('SELECT COUNT(*) FROM enquiries WHERE buyer_id = $1', [userId]);
  const totalViews = counts['PROPERTY_VIEW'] ?? 0;
  const totalFavourites = favRes.rows[0].count ? Number(favRes.rows[0].count) : 0;
  const totalEnquiries = enquRes.rows[0].count ? Number(enquRes.rows[0].count) : 0;
  const totalDwell = counts.dwell ?? 0;

  // Engagement Score (max 40)
  let engagement = 0;
  engagement += Math.min(totalViews, 20); // 1 pt per view, cap 20
  engagement += Math.min(totalFavourites * 3, 10); // 3 pts each, cap 10
  engagement += Math.min(Math.floor(totalDwell / 30), 40 - engagement); // 1 pt per 30s, remaining cap

  // Intent Score (max 40)
  let intent = 0;
  intent += Math.min(totalFavourites * 2, 20); // 2 pts each, cap 20
  intent += Math.min(totalEnquiries * 5, 20); // 5 pts each, cap 20

  // Recency Score (max 20)
  const recentRes = await query(
    `SELECT GREATEST(
       COALESCE((SELECT MAX(created_at) FROM user_interactions WHERE user_id = $1), '1970-01-01'),
       COALESCE((SELECT MAX(created_at) FROM favourites WHERE user_id = $1), '1970-01-01'),
       COALESCE((SELECT MAX(created_at) FROM enquiries WHERE buyer_id = $1), '1970-01-01')
     ) AS last_active`,
    [userId]
  );
  const lastActive = recentRes.rows[0].last_active;
  let recency = 0;
  if (lastActive) {
    const diffDays = Math.floor((new Date() - new Date(lastActive)) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) recency = 20;
    else if (diffDays <= 3) recency = 15;
    else if (diffDays <= 7) recency = 10;
    else if (diffDays <= 30) recency = 5;
  }

  const finalScore = Math.min(100, Math.round(engagement + intent + recency));

  // Classification
  let classification = 'COLD';
  if (finalScore >= 70) classification = 'HOT';
  else if (finalScore >= 40) classification = 'WARM';

  // Preferred property type & city (most frequent)
  const prefRes = await query(
    `SELECT p.property_type, p.city, COUNT(*) AS cnt
     FROM user_interactions ui
     JOIN properties p ON p.id = ui.property_id
     WHERE ui.user_id = $1 AND ui.property_id IS NOT NULL
     GROUP BY p.property_type, p.city
     ORDER BY cnt DESC
     LIMIT 1`,
    [userId]
  );
  const preferredPropertyType = prefRes.rowCount ? prefRes.rows[0].property_type : null;
  const preferredCity = prefRes.rowCount ? prefRes.rows[0].city : null;

  // Preferred price range (min/max of interacted properties)
  const priceRes = await query(
    `SELECT MIN(p.price) AS min_price, MAX(p.price) AS max_price
     FROM user_interactions ui
     JOIN properties p ON p.id = ui.property_id
     WHERE ui.user_id = $1 AND ui.property_id IS NOT NULL`,
    [userId]
  );
  const preferredMinPrice = priceRes.rows[0].min_price;
  const preferredMaxPrice = priceRes.rows[0].max_price;

  return {
    engagement_score: engagement,
    intent_score: intent,
    recency_score: recency,
    current_score: finalScore,
    classification,
    total_views: totalViews,
    total_favourites: totalFavourites,
    total_enquiries: totalEnquiries,
    total_dwell_time: totalDwell,
    preferred_property_type: preferredPropertyType,
    preferred_city: preferredCity,
    preferred_min_price: preferredMinPrice,
    preferred_max_price: preferredMaxPrice,
    last_active_at: lastActive,
  };
}

/** Upsert lead profile and insert history in a transaction */
async function calculateAndSaveLead(userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const metrics = await computeLeadMetrics(userId);

    // Upsert lead_profiles
    const upsertQuery = `
      INSERT INTO lead_profiles (
        user_id, current_score, classification, engagement_score, intent_score, recency_score,
        total_views, total_favourites, total_enquiries, total_dwell_time,
        preferred_property_type, preferred_city, preferred_min_price, preferred_max_price, last_active_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14, $15
      )
      ON CONFLICT (user_id) DO UPDATE SET
        current_score = EXCLUDED.current_score,
        classification = EXCLUDED.classification,
        engagement_score = EXCLUDED.engagement_score,
        intent_score = EXCLUDED.intent_score,
        recency_score = EXCLUDED.recency_score,
        total_views = EXCLUDED.total_views,
        total_favourites = EXCLUDED.total_favourites,
        total_enquiries = EXCLUDED.total_enquiries,
        total_dwell_time = EXCLUDED.total_dwell_time,
        preferred_property_type = EXCLUDED.preferred_property_type,
        preferred_city = EXCLUDED.preferred_city,
        preferred_min_price = EXCLUDED.preferred_min_price,
        preferred_max_price = EXCLUDED.preferred_max_price,
        last_active_at = EXCLUDED.last_active_at,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`;
    const upsertValues = [
      userId,
      metrics.current_score,
      metrics.classification,
      metrics.engagement_score,
      metrics.intent_score,
      metrics.recency_score,
      metrics.total_views,
      metrics.total_favourites,
      metrics.total_enquiries,
      metrics.total_dwell_time,
      metrics.preferred_property_type,
      metrics.preferred_city,
      metrics.preferred_min_price,
      metrics.preferred_max_price,
      metrics.last_active_at,
    ];
    const upsertRes = await client.query(upsertQuery, upsertValues);

    // Insert into lead_score_history
    const historyQuery = `
      INSERT INTO lead_score_history (user_id, score, classification, feature_contributions)
      VALUES ($1, $2, $3, $4)`;
    const featureContributions = {
      engagement_score: metrics.engagement_score,
      intent_score: metrics.intent_score,
      recency_score: metrics.recency_score,
      total_views: metrics.total_views,
      total_favourites: metrics.total_favourites,
      total_enquiries: metrics.total_enquiries,
      total_dwell_time: metrics.total_dwell_time,
    };
    await client.query(historyQuery, [
      userId,
      metrics.current_score,
      metrics.classification,
      JSON.stringify(featureContributions),
    ]);

    await client.query('COMMIT');
    return upsertRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Retrieve a lead profile */
async function getLeadProfile(userId) {
  const res = await query('SELECT * FROM lead_profiles WHERE user_id = $1', [userId]);
  return res.rowCount ? res.rows[0] : null;
}

/** List lead profiles with filters, pagination, sorting */
async function listLeads({ page = 1, limit = 20, classification, minScore, maxScore, sort }) {
  const offset = (page - 1) * limit;
  const where = [];
  const values = [];
  let idx = 1;
  if (classification) { where.push(`classification = $${idx}`); values.push(classification); idx++; }
  if (minScore !== undefined) { where.push(`current_score >= $${idx}`); values.push(minScore); idx++; }
  if (maxScore !== undefined) { where.push(`current_score <= $${idx}`); values.push(maxScore); idx++; }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortMap = {
    score_high: 'current_score DESC',
    score_low: 'current_score ASC',
    recent: 'last_active_at DESC',
    active: 'updated_at DESC',
  };
  const orderBy = sort ? `ORDER BY ${sortMap[sort]}` : 'ORDER BY current_score DESC';
  const countRes = await query(`SELECT COUNT(*) FROM lead_profiles ${whereSql}`, values);
  const total = Number(countRes.rows[0].count);
  const dataRes = await query(`SELECT * FROM lead_profiles ${whereSql} ${orderBy} LIMIT $${idx} OFFSET $${idx + 1}`, [...values, limit, offset]);
  return { rows: dataRes.rows, total };
}

/** Get lead score history for a user */
async function getLeadHistory(userId, { page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const countRes = await query('SELECT COUNT(*) FROM lead_score_history WHERE user_id = $1', [userId]);
  const total = Number(countRes.rows[0].count);
  const dataRes = await query(
    `SELECT * FROM lead_score_history WHERE user_id = $1 ORDER BY calculated_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return { rows: dataRes.rows, total };
}

module.exports = {
  calculateAndSaveLead,
  getLeadProfile,
  listLeads,
  getLeadHistory,
};

