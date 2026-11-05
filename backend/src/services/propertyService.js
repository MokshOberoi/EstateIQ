// Property Service
const { query, pool } = require('../config/database');
const { sendError } = require('../utils/apiResponse');

/**
 * List properties with pagination, filters, search and sorting.
 * `params` contains page, limit, sort, filters, search.
 */
async function listProperties(params) {
  const { page, limit, sort, filters, search } = params;
  const offset = (page - 1) * limit;
  const where = [];
  const values = [];
  let idx = 1;

  // Filters
  if (filters.city) {
    where.push(`city ILIKE $${idx}`);
    values.push(`%${filters.city}%`);
    idx++;
  }
  if (filters.state) {
    where.push(`state ILIKE $${idx}`);
    values.push(`%${filters.state}%`);
    idx++;
  }
  if (filters.property_type) {
    where.push(`property_type = $${idx}`);
    values.push(filters.property_type);
    idx++;
  }
  if (filters.status) {
    where.push(`status = $${idx}`);
    values.push(filters.status);
    idx++;
  }
  if (filters.minPrice !== undefined) {
    where.push(`price >= $${idx}`);
    values.push(filters.minPrice);
    idx++;
  }
  if (filters.maxPrice !== undefined) {
    where.push(`price <= $${idx}`);
    values.push(filters.maxPrice);
    idx++;
  }
  if (filters.minBedrooms !== undefined) {
    where.push(`bedrooms >= $${idx}`);
    values.push(filters.minBedrooms);
    idx++;
  }
  if (filters.maxBedrooms !== undefined) {
    where.push(`bedrooms <= $${idx}`);
    values.push(filters.maxBedrooms);
    idx++;
  }
  if (filters.minBathrooms !== undefined) {
    where.push(`bathrooms >= $${idx}`);
    values.push(filters.minBathrooms);
    idx++;
  }
  if (filters.maxBathrooms !== undefined) {
    where.push(`bathrooms <= $${idx}`);
    values.push(filters.maxBathrooms);
    idx++;
  }
  if (filters.minArea !== undefined) {
    where.push(`square_feet >= $${idx}`);
    values.push(filters.minArea);
    idx++;
  }
  if (filters.maxArea !== undefined) {
    where.push(`square_feet <= $${idx}`);
    values.push(filters.maxArea);
    idx++;
  }

  // Search across a few text columns using ILIKE
  if (search) {
    const searchClause = `(
      title ILIKE $${idx} OR
      description ILIKE $${idx} OR
      city ILIKE $${idx} OR
      state ILIKE $${idx}
    )`;
    where.push(searchClause);
    values.push(`%${search}%`);
    idx++;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Sorting
  const sortMap = {
    newest: 'p.created_at DESC',
    price_low: 'p.price ASC',
    price_high: 'p.price DESC',
    area_high: 'p.square_feet DESC',
  };
  const orderBy = sort ? `ORDER BY ${sortMap[sort]}` : 'ORDER BY p.created_at DESC';

  // Count total
  const countResult = await query(`SELECT COUNT(*) FROM properties p ${whereSql}`, values);
  const total = Number(countResult.rows[0].count);

  // Data query – include primary image and agent basic info
  const dataQuery = `
    SELECT p.*, u.id AS agent_id, u.full_name AS agent_name, u.email AS agent_email, u.avatar_url AS agent_avatar,
      pi.id AS image_id, pi.image_url, pi.caption, pi.is_primary
    FROM properties p
    LEFT JOIN users u ON u.id = p.agent_id
    LEFT JOIN property_images pi ON pi.property_id = p.id AND pi.is_primary = TRUE
    ${whereSql}
    ${orderBy}
    LIMIT $${idx} OFFSET $${idx + 1}
  `;
  values.push(limit, offset);

  const dataResult = await query(dataQuery, values);
  return { rows: dataResult.rows, total };
}

/** Get detailed property with images and amenities */
async function getPropertyDetails(id) {
  // Validate UUID format quickly – let DB throw if malformed, catch later
  const propResult = await query(
    `SELECT p.*, u.id AS agent_id, u.full_name AS agent_name, u.email AS agent_email, u.avatar_url AS agent_avatar
     FROM properties p
     LEFT JOIN users u ON u.id = p.agent_id
     WHERE p.id = $1`,
    [id]
  );
  if (propResult.rowCount === 0) return null;
  const property = propResult.rows[0];

  // Images (all)
  const imagesRes = await query(
    `SELECT id, image_url, caption, display_order, is_primary FROM property_images WHERE property_id = $1 ORDER BY display_order`,
    [id]
  );
  property.images = imagesRes.rows;

  // Amenities (joined)
  const amenitiesRes = await query(
    `SELECT a.id, a.name, a.category, a.icon_name
       FROM property_amenities pa
       JOIN amenities a ON a.id = pa.amenity_id
       WHERE pa.property_id = $1`,
    [id]
  );
  property.amenities = amenitiesRes.rows;

  return property;
}

/** List properties belonging to a specific agent (or all for admin) */
async function listMyProperties(userId, { page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const countRes = await query(
    'SELECT COUNT(*) FROM properties WHERE agent_id = $1',
    [userId]
  );
  const total = Number(countRes.rows[0].count);

  const dataRes = await query(
    `SELECT * FROM properties WHERE agent_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return { rows: dataRes.rows, total };
}

/** Create property (with optional amenities) */
async function createProperty(payload, user) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Determine agent_id
    let agentId = user.id;
    if (user.role === 'ADMIN' && payload.agent_id) {
      // Verify that provided agent_id exists and is an AGENT (or ADMIN) user
      const agentCheck = await client.query(
        `SELECT id FROM users WHERE id = $1 AND role IN ('AGENT', 'ADMIN')`,
        [payload.agent_id]
      );
      if (agentCheck.rowCount === 0) {
        throw new Error('Provided agent_id does not exist or is not an agent');
      }
      agentId = payload.agent_id;
    }

    const insertFields = [
      'agent_id',
      'title',
      'description',
      'price',
      'property_type',
      'status',
      'bedrooms',
      'bathrooms',
      'square_feet',
      'address',
      'city',
      'state',
      'zip_code',
    ];
    const values = [
      agentId,
      payload.title,
      payload.description,
      payload.price,
      payload.property_type,
      payload.status,
      payload.bedrooms,
      payload.bathrooms,
      payload.square_feet,
      payload.address,
      payload.city,
      payload.state,
      payload.zip_code,
    ];
    let idx = values.length + 1;
    // optional fields
    if (payload.year_built !== undefined) {
      insertFields.push('year_built');
      values.push(payload.year_built);
    }
    if (payload.latitude !== undefined) {
      insertFields.push('latitude');
      values.push(payload.latitude);
    }
    if (payload.longitude !== undefined) {
      insertFields.push('longitude');
      values.push(payload.longitude);
    }

    const fieldList = insertFields.join(', ');
    const placeholderList = values.map((_, i) => `$${i + 1}`).join(', ');

    const insertSql = `INSERT INTO properties (${fieldList}) VALUES (${placeholderList}) RETURNING *`;
    const insertRes = await client.query(insertSql, values);
    const property = insertRes.rows[0];

    // Amenities association
    if (payload.amenities && payload.amenities.length) {
      // Validate amenity IDs exist
      const amenityCheckRes = await client.query(
        `SELECT id FROM amenities WHERE id = ANY($1)`,
        [payload.amenities]
      );
      if (amenityCheckRes.rowCount !== payload.amenities.length) {
        throw new Error('One or more amenity IDs are invalid');
      }
      const insertAmenityValues = payload.amenities.map((aid) => `('${property.id}', '${aid}')`).join(', ');
      await client.query(
        `INSERT INTO property_amenities (property_id, amenity_id) VALUES ${insertAmenityValues}`
      );
    }

    await client.query('COMMIT');
    return property;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Update property (ownership‑aware) */
async function updateProperty(id, payload, user) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Build SET clause
    const setClauses = [];
    const values = [];
    let idx = 1;
    const updatable = [
      'title',
      'description',
      'price',
      'property_type',
      'status',
      'bedrooms',
      'bathrooms',
      'square_feet',
      'address',
      'city',
      'state',
      'zip_code',
      'year_built',
      'latitude',
      'longitude',
    ];
    updatable.forEach((field) => {
      if (payload[field] !== undefined) {
        setClauses.push(`${field} = $${idx}`);
        values.push(payload[field]);
        idx++;
      }
    });
    if (setClauses.length === 0 && !(payload.amenities && payload.amenities.length)) {
      // Nothing to update
      await client.query('ROLLBACK');
      return null; // caller will treat as not found? We'll just return null.
    }

    // Ownership condition
    let whereClause = 'WHERE id = $' + idx;
    values.push(id);
    idx++;
    if (user.role === 'AGENT') {
      whereClause += ` AND agent_id = $${idx}`;
      values.push(user.id);
      idx++;
    }

    const updateSql = `UPDATE properties SET ${setClauses.join(', ')}, updated_at = NOW() ${whereClause} RETURNING *`;
    const updateRes = await client.query(updateSql, values);
    if (updateRes.rowCount === 0) {
      // Could be not found or ownership violation
      // Check existence without agent filter
      const existenceCheck = await client.query('SELECT id FROM properties WHERE id = $1', [id]);
      if (existenceCheck.rowCount === 0) {
        await client.query('ROLLBACK');
        return null; // not found
      }
      await client.query('ROLLBACK');
      return false; // forbidden
    }
    const property = updateRes.rows[0];

    // Amenity handling – replace all if provided
    if (payload.amenities) {
      // Validate IDs
      const amenityCheckRes = await client.query(
        `SELECT id FROM amenities WHERE id = ANY($1)`,
        [payload.amenities]
      );
      if (amenityCheckRes.rowCount !== payload.amenities.length) {
        throw new Error('One or more amenity IDs are invalid');
      }
      // Delete existing links then insert new
      await client.query('DELETE FROM property_amenities WHERE property_id = $1', [id]);
      if (payload.amenities.length) {
        const valuesList = payload.amenities.map((aid) => `('${id}', '${aid}')`).join(', ');
        await client.query(`INSERT INTO property_amenities (property_id, amenity_id) VALUES ${valuesList}`);
      }
    }

    await client.query('COMMIT');
    return property;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Delete property with ownership check */
async function deleteProperty(id, user) {
  // Build where clause similar to update
  let where = 'WHERE id = $1';
  const params = [id];
  let idx = 2;
  if (user.role === 'AGENT') {
    where += ` AND agent_id = $${idx}`;
    params.push(user.id);
    idx++;
  }
  const deleteRes = await query(`DELETE FROM properties ${where} RETURNING id`, params);
  if (deleteRes.rowCount === 0) {
    // Determine if property exists at all
    const exist = await query('SELECT id FROM properties WHERE id = $1', [id]);
    if (exist.rowCount === 0) return null; // not found
    return false; // forbidden
  }
  return true;
}

module.exports = {
  listProperties,
  getPropertyDetails,
  listMyProperties,
  createProperty,
  updateProperty,
  deleteProperty,
};

