// Recommendation Service
const { query, pool } = require('../config/database');
const { sendError } = require('../utils/apiResponse');
const leadService = require('./leadService');

// Weight constants (must sum to <= 1.0; we normalize later)
const WEIGHTS = {
  type: 0.30,
  city: 0.25,
  price: 0.25,
  behaviour: 0.20,
};

/** Helper to fetch user preferences from lead profile, favourites, or interactions */
async function getPreferences(userId) {
  // Try lead profile first
  const profile = await leadService.getLeadProfile(userId);
  if (profile) {
    const { preferred_property_type, preferred_city, preferred_min_price, preferred_max_price } = profile;
    if (preferred_property_type || preferred_city || preferred_min_price || preferred_max_price) {
      return {
        property_type: preferred_property_type,
        city: preferred_city,
        min_price: preferred_min_price,
        max_price: preferred_max_price,
      };
    }
  }
  // Derive from favourites (strong signal)
  const favPrefRes = await query(
    `SELECT p.property_type, p.city, COUNT(*) AS cnt
       FROM favourites f
       JOIN properties p ON p.id = f.property_id
      WHERE f.user_id = $1
      GROUP BY p.property_type, p.city
      ORDER BY cnt DESC
      LIMIT 1`,
    [userId]
  );
  let property_type = favPrefRes.rowCount ? favPrefRes.rows[0].property_type : null;
  const city = favPrefRes.rowCount ? favPrefRes.rows[0].city : null;

  // Price range from favourites (if any)
  const priceRes = await query(
    `SELECT MIN(p.price) AS min_price, MAX(p.price) AS max_price
       FROM favourites f
       JOIN properties p ON p.id = f.property_id
      WHERE f.user_id = $1`,
    [userId]
  );
  const min_price = priceRes.rows[0].min_price;
  const max_price = priceRes.rows[0].max_price;

  // If still missing type/city, derive from interactions (weaker signal)
  if (!property_type && !city) {
    const interPrefRes = await query(
      `SELECT p.property_type, p.city, COUNT(*) AS cnt
         FROM user_interactions ui
         JOIN properties p ON p.id = ui.property_id
        WHERE ui.user_id = $1 AND ui.property_id IS NOT NULL
        GROUP BY p.property_type, p.city
        ORDER BY cnt DESC
        LIMIT 1`,
      [userId]
    );
    if (interPrefRes.rowCount) {
      const pref = interPrefRes.rows[0];
      if (!property_type) property_type = pref.property_type;
      if (!city) city = pref.city;
    }
    // Price range from interactions
    const priceInterRes = await query(
      `SELECT MIN(p.price) AS min_price, MAX(p.price) AS max_price
         FROM user_interactions ui
         JOIN properties p ON p.id = ui.property_id
        WHERE ui.user_id = $1 AND ui.property_id IS NOT NULL`,
      [userId]
    );
    if (priceInterRes.rowCount) {
      if (!min_price) min_price = priceInterRes.rows[0].min_price;
      if (!max_price) max_price = priceInterRes.rows[0].max_price;
    }
  }

  // Return whatever we could gather (may be all null)
  return { property_type, city, min_price, max_price };
}

/** Fetch recent active properties excluding owned or already enquired properties */
async function fetchCandidateProperties(userId, excludeIds = [], limit = 200) {
  const excludeClause = excludeIds.length ? `AND p.id NOT IN (${excludeIds.map((_, i) => `$${i + 3}`).join(', ')})` : '';
  const sql = `SELECT p.*
                 FROM properties p
                WHERE p.status = 'ACTIVE'
                  AND p.agent_id <> $1
                  AND p.id NOT IN (SELECT property_id FROM enquiries WHERE buyer_id = $1)
                  ${excludeClause}
                ORDER BY p.created_at DESC
                LIMIT $2`;
  const params = [userId, limit, ...excludeIds];
  const res = await query(sql, params);
  return res.rows;
}

/** Build popularity maps for the given candidate property IDs */
async function fetchPopularityData(candidateIds) {
  const favRes = await query(
    `SELECT property_id, COUNT(*) AS fav_cnt
       FROM favourites
      WHERE property_id = ANY($1)
      GROUP BY property_id`,
    [candidateIds]
  );
  const viewRes = await query(
    `SELECT property_id, COUNT(*) AS view_cnt
       FROM user_interactions
      WHERE property_id = ANY($1) AND event_type = 'PROPERTY_VIEW'
      GROUP BY property_id`,
    [candidateIds]
  );
  const favMap = {};
  favRes.rows.forEach(r => { favMap[r.property_id] = Number(r.fav_cnt); });
  const viewMap = {};
  viewRes.rows.forEach(r => { viewMap[r.property_id] = Number(r.view_cnt); });
  return { favMap, viewMap };
}

/** Build behaviour interaction map for the user */
async function getInteractionMap(userId) {
  const res = await query(
    `SELECT property_id, COUNT(*) AS cnt
       FROM user_interactions
      WHERE user_id = $1
      GROUP BY property_id`,
    [userId]
  );
  const map = {};
  res.rows.forEach(row => {
    map[row.property_id] = Number(row.cnt);
  });
  return map;
}

/** Score a property based on preferences and behaviour */
function scoreProperty(property, prefs, interactionMap) {
  let score = 0;
  const explanations = [];

  if (prefs.property_type && property.property_type === prefs.property_type) {
    score += WEIGHTS.type;
    explanations.push('type match');
  }
  if (prefs.city && property.city === prefs.city) {
    score += WEIGHTS.city;
    explanations.push('city match');
  }
  if (prefs.min_price && prefs.max_price) {
    const price = Number(property.price);
    if (price >= Number(prefs.min_price) && price <= Number(prefs.max_price)) {
      score += WEIGHTS.price;
      explanations.push('price within range');
    }
  }
  const interactionCnt = interactionMap[property.id] || 0;
  if (interactionCnt > 0) {
    const behaviouralScore = Math.min(interactionCnt, 5) / 5 * WEIGHTS.behaviour;
    score += behaviouralScore;
    explanations.push(`behaviour (${interactionCnt} interactions)`);
  }
  const finalScore = Math.min(1, score);
  return { score: Number(finalScore.toFixed(4)), explanation: explanations.join('; ') };
}

/** Persist generated recommendations in a transaction */
async function saveRecommendations(userId, scoredProps) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM recommendations WHERE user_id = $1 AND algorithm = 'CONTENT_BASED'`, [userId]);
    const insertValues = [];
    const placeholders = [];
    let idx = 1;
    scoredProps.forEach((item, rank) => {
      insertValues.push(userId, item.property.id, item.score, 'CONTENT_BASED', item.explanation, rank + 1);
      placeholders.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5})`);
      idx += 6;
    });
    if (placeholders.length) {
      const insertSql = `INSERT INTO recommendations (user_id, property_id, score, algorithm, explanation, rank) VALUES ${placeholders.join(', ')}`;
      await client.query(insertSql, insertValues);
    }
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Public API – generate recommendations for a user */
async function generateRecommendations(userId, limit = 10) {
  const prefs = await getPreferences(userId);
  const interactionMap = await getInteractionMap(userId);
  const candidates = await fetchCandidateProperties(userId, [], 200);

  const hasPrefs = prefs.property_type || prefs.city || (prefs.min_price && prefs.max_price);
  let scored;
  if (hasPrefs) {
    scored = candidates.map(prop => {
      const { score, explanation } = scoreProperty(prop, prefs, interactionMap);
      return { property: prop, score, explanation };
    });
  } else {
    const candidateIds = candidates.map(p => p.id);
    const { favMap, viewMap } = await fetchPopularityData(candidateIds);
    const maxFav = Math.max(...Object.values(favMap), 0) || 1;
    const maxView = Math.max(...Object.values(viewMap), 0) || 1;
    scored = candidates.map(prop => {
      const favCnt = favMap[prop.id] || 0;
      const viewCnt = viewMap[prop.id] || 0;
      const favScore = favCnt / maxFav;
      const viewScore = viewCnt / maxView;
      const popScore = (favScore + viewScore) / 2;
      const finalScore = Number(popScore.toFixed(4));
      const explanation = 'popularity fallback (favourites & views)';
      return { property: prop, score: finalScore, explanation };
    });
  }

  scored.sort((a, b) => b.score - a.score || new Date(b.property.created_at) - new Date(a.property.created_at));
  const top = scored.slice(0, limit);
  await saveRecommendations(userId, top);
  return top;
}

/** List stored recommendations for a user with pagination */
async function listRecommendations(userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const countRes = await query(`SELECT COUNT(*) FROM recommendations WHERE user_id = $1 AND algorithm = 'CONTENT_BASED'`, [userId]);
  const total = Number(countRes.rows[0].count);
  const dataRes = await query(
    `SELECT r.*, p.* FROM recommendations r
        JOIN properties p ON p.id = r.property_id
       WHERE r.user_id = $1 AND r.algorithm = 'CONTENT_BASED'
     ORDER BY r.rank ASC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return { rows: dataRes.rows, total };
}

module.exports = {
  generateRecommendations,
  listRecommendations,
};
