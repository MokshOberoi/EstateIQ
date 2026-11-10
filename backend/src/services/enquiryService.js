// backend/src/services/enquiryService.js
// Service for handling property enquiries (Buyer submission, Agent retrieval, and updates).

const { query } = require('../config/database');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_STATUSES = ['PENDING', 'CONTACTED', 'CLOSED'];

/**
 * Create a new enquiry for a property.
 * Agent ID is derived directly from the property to prevent spoofing.
 */
async function createEnquiry({ propertyId, message, phone }, user) {
  if (!propertyId || !UUID_REGEX.test(propertyId)) {
    return { notFound: true, message: 'Valid property ID is required' };
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return { badRequest: true, message: 'Enquiry message is required' };
  }

  // 1. Verify property exists and fetch agent_id
  const propRes = await query('SELECT id, agent_id, title FROM properties WHERE id = $1', [propertyId]);
  const property = propRes.rows[0];
  if (!property) {
    return { notFound: true, message: 'Property not found' };
  }

  // 2. Prevent self-enquiry if agent attempts to enquire on own property
  if (property.agent_id === user.id) {
    return { badRequest: true, message: 'You cannot submit an enquiry for your own property' };
  }

  // 3. Insert enquiry
  const insertSql = `
    INSERT INTO enquiries (property_id, buyer_id, agent_id, message, phone, status)
    VALUES ($1, $2, $3, $4, $5, 'PENDING')
    RETURNING id, property_id, buyer_id, agent_id, message, phone, status, agent_notes, created_at, updated_at
  `;
  const values = [
    property.id,
    user.id,
    property.agent_id,
    message.trim(),
    phone && typeof phone === 'string' ? phone.trim() : null,
  ];

  const result = await query(insertSql, values);
  return { enquiry: result.rows[0] };
}

/**
 * Retrieve enquiries submitted by the authenticated buyer.
 */
async function getBuyerEnquiries(buyerId) {
  const sql = `
    SELECT 
      e.id, e.property_id, e.buyer_id, e.agent_id, e.message, e.phone, e.status, e.agent_notes, e.created_at, e.updated_at,
      p.title AS property_title, p.price AS property_price, p.city AS property_city, p.state AS property_state, p.address AS property_address,
      u_agent.full_name AS agent_name, u_agent.email AS agent_email, u_agent.phone AS agent_phone,
      pi.image_url AS property_image_url
    FROM enquiries e
    JOIN properties p ON p.id = e.property_id
    JOIN users u_agent ON u_agent.id = e.agent_id
    LEFT JOIN property_images pi ON pi.property_id = p.id AND pi.is_primary = TRUE
    WHERE e.buyer_id = $1
    ORDER BY e.created_at DESC
  `;
  const result = await query(sql, [buyerId]);
  return result.rows;
}

/**
 * Retrieve enquiries assigned to the authenticated agent (or all for ADMIN).
 */
async function getAgentEnquiries(user) {
  let sql;
  let params = [];

  if (user.role === 'ADMIN') {
    sql = `
      SELECT 
        e.id, e.property_id, e.buyer_id, e.agent_id, e.message, e.phone, e.status, e.agent_notes, e.created_at, e.updated_at,
        p.title AS property_title, p.price AS property_price, p.city AS property_city, p.state AS property_state,
        u_buyer.full_name AS buyer_name, u_buyer.email AS buyer_email,
        u_agent.full_name AS agent_name, u_agent.email AS agent_email,
        pi.image_url AS property_image_url
      FROM enquiries e
      JOIN properties p ON p.id = e.property_id
      JOIN users u_buyer ON u_buyer.id = e.buyer_id
      JOIN users u_agent ON u_agent.id = e.agent_id
      LEFT JOIN property_images pi ON pi.property_id = p.id AND pi.is_primary = TRUE
      ORDER BY e.created_at DESC
    `;
  } else {
    sql = `
      SELECT 
        e.id, e.property_id, e.buyer_id, e.agent_id, e.message, e.phone, e.status, e.agent_notes, e.created_at, e.updated_at,
        p.title AS property_title, p.price AS property_price, p.city AS property_city, p.state AS property_state,
        u_buyer.full_name AS buyer_name, u_buyer.email AS buyer_email,
        u_agent.full_name AS agent_name, u_agent.email AS agent_email,
        pi.image_url AS property_image_url
      FROM enquiries e
      JOIN properties p ON p.id = e.property_id
      JOIN users u_buyer ON u_buyer.id = e.buyer_id
      JOIN users u_agent ON u_agent.id = e.agent_id
      LEFT JOIN property_images pi ON pi.property_id = p.id AND pi.is_primary = TRUE
      WHERE e.agent_id = $1
      ORDER BY e.created_at DESC
    `;
    params = [user.id];
  }

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Update enquiry status and/or agent notes.
 * Enforces agent ownership (or ADMIN role).
 */
async function updateEnquiry(enquiryId, { status, agent_notes }, user) {
  if (!enquiryId || !UUID_REGEX.test(enquiryId)) {
    return { notFound: true, message: 'Valid enquiry ID is required' };
  }

  // 1. Verify enquiry exists
  const checkRes = await query('SELECT id, agent_id, status, agent_notes FROM enquiries WHERE id = $1', [enquiryId]);
  const enquiry = checkRes.rows[0];
  if (!enquiry) {
    return { notFound: true, message: 'Enquiry not found' };
  }

  // 2. Ownership check
  if (user.role !== 'ADMIN' && enquiry.agent_id !== user.id) {
    return { forbidden: true, message: 'Forbidden: you are not assigned to this enquiry' };
  }

  // 3. Validate status
  if (status !== undefined) {
    if (!ALLOWED_STATUSES.includes(status)) {
      return { badRequest: true, message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}` };
    }
  }

  // 4. Build updates dynamically
  const setClauses = [];
  const values = [enquiryId];
  let idx = 2;

  if (status !== undefined) {
    setClauses.push(`status = $${idx}`);
    values.push(status);
    idx++;
  }

  if (agent_notes !== undefined) {
    setClauses.push(`agent_notes = $${idx}`);
    values.push(agent_notes);
    idx++;
  }

  if (setClauses.length === 0) {
    return { enquiry };
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
  const updateSql = `UPDATE enquiries SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`;
  const result = await query(updateSql, values);
  return { enquiry: result.rows[0] };
}

module.exports = {
  createEnquiry,
  getBuyerEnquiries,
  getAgentEnquiries,
  updateEnquiry,
};

