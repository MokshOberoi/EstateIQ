// backend/src/services/favouriteService.js
// Service layer for handling favourites (BUYER role)

const { query } = require('../config/database');
const { sendError } = require('../utils/apiResponse');

/**
 * Retrieve the authenticated user's favourite properties.
 * Returns an array of favourite rows joined with property data.
 */
async function getMyFavourites(userId) {
  const sql = `
    SELECT f.id AS favourite_id, f.created_at, p.*
    FROM favourites f
    JOIN properties p ON p.id = f.property_id
    WHERE f.user_id = $1
    ORDER BY f.created_at DESC
  `;
  const res = await query(sql, [userId]);
  return res.rows;
}

/**
 * Add a property to the user's favourites.
 * Ensures the property exists and that the favourite is not duplicated.
 */
async function addFavourite(userId, propertyId) {
  // Verify property exists
  const propRes = await query('SELECT id FROM properties WHERE id = $1', [propertyId]);
  if (!propRes.rowCount) {
    return { notFound: true, message: 'Property not found' };
  }

  // Prevent duplicate favourite
  const dupRes = await query(
    'SELECT id FROM favourites WHERE user_id = $1 AND property_id = $2',
    [userId, propertyId]
  );
  if (dupRes.rowCount) {
    return { conflict: true, message: 'Property already favourited' };
  }

  const insertSql = `
    INSERT INTO favourites (user_id, property_id)
    VALUES ($1, $2)
    RETURNING id, user_id, property_id, created_at
  `;
  const insertRes = await query(insertSql, [userId, propertyId]);
  return { favourite: insertRes.rows[0] };
}

/**
 * Remove a favourite for the authenticated user.
 */
async function removeFavourite(userId, propertyId) {
  const delRes = await query(
    'DELETE FROM favourites WHERE user_id = $1 AND property_id = $2 RETURNING id',
    [userId, propertyId]
  );
  if (!delRes.rowCount) {
    return { notFound: true, message: 'Favourite not found' };
  }
  return { deletedId: delRes.rows[0].id };
}

/**
 * Check if a property is favourited by the user.
 */
async function isFavourite(userId, propertyId) {
  const res = await query(
    'SELECT 1 FROM favourites WHERE user_id = $1 AND property_id = $2',
    [userId, propertyId]
  );
  return res.rowCount > 0;
}

module.exports = {
  getMyFavourites,
  addFavourite,
  removeFavourite,
  isFavourite,
};


