// backend/src/controllers/propertyImageController.js
// Controller for handling property image CRUD operations.
// Uses the standardized API response format (sendSuccess / sendError).

const { sendSuccess, sendError } = require('../utils/apiResponse');
const { query, pool } = require('../config/database');
const path = require('path');
const fs = require('fs');

// Helper to delete a file safely
function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    // Log but do not crash
    console.error('File deletion error:', e);
  }
}

// POST /properties/:id/images – upload one or more images for a property.
async function uploadImages(req, res, next) {
  try {
    const propertyId = req.params.id;
    const user = req.user;

    // Verify property exists and ownership (or ADMIN)
    const propResult = await query('SELECT id, agent_id FROM properties WHERE id = $1', [propertyId]);
    const property = propResult.rows[0];
    if (!property) return sendError(res, 'Property not found', 404);
    if (user.role !== 'ADMIN' && property.agent_id !== user.id) {
      return sendError(res, 'Forbidden: you do not own this property', 403);
    }

    // Multer has placed files in req.files
    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No images uploaded', 400);
    }

    // Enforce max 10 images per property (including existing)
    const countResult = await query('SELECT COUNT(*) FROM property_images WHERE property_id = $1', [propertyId]);
    const existingCount = parseInt(countResult.rows[0].count, 10);
    const totalAfter = existingCount + req.files.length;
    if (totalAfter > 10) {
      // Cleanup uploaded files
      req.files.forEach(f => deleteFile(f.path));
      return sendError(res, 'Maximum 10 images per property exceeded', 400);
    }

    // Insert each image, set primary flag if none exists
    const primaryCheck = await query('SELECT EXISTS (SELECT 1 FROM property_images WHERE property_id = $1 AND is_primary = TRUE)', [propertyId]);
    const hasPrimary = primaryCheck.rows[0].exists;

    const inserted = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const isPrimary = !hasPrimary && i === 0; // first uploaded becomes primary if none
      const result = await query(
        `INSERT INTO property_images (property_id, image_url, is_primary, display_order)
         VALUES ($1, $2, $3, $4) RETURNING id, image_url, is_primary, display_order`,
        [propertyId, `/uploads/properties/${path.basename(file.filename)}`, isPrimary, i]
      );
      inserted.push(result.rows[0]);
    }

    return sendSuccess(res, 'Images uploaded successfully', { data: inserted }, 201);
  } catch (err) {
    next(err);
  }
}

// GET /properties/:id/images – list images for a property.
async function getPropertyImages(req, res, next) {
  try {
    const propertyId = req.params.id;
    const user = req.user;
    const propResult = await query('SELECT id, agent_id FROM properties WHERE id = $1', [propertyId]);
    const property = propResult.rows[0];
    if (!property) return sendError(res, 'Property not found', 404);
    if (user.role !== 'ADMIN' && property.agent_id !== user.id) {
      return sendError(res, 'Forbidden: you do not own this property', 403);
    }
    const imagesResult = await query(
      'SELECT id, image_url, caption, display_order, is_primary FROM property_images WHERE property_id = $1 ORDER BY display_order ASC',
      [propertyId]
    );
    return sendSuccess(res, 'Property images retrieved', { data: imagesResult.rows });
  } catch (err) {
    next(err);
  }
}

// DELETE /properties/:id/images/:imageId – delete an image.
async function deleteImage(req, res, next) {
  const client = await pool.connect();
  try {
    const { id: propertyId, imageId } = req.params;
    const user = req.user;
    // Verify property and ownership
    const propResult = await client.query('SELECT id, agent_id FROM properties WHERE id = $1', [propertyId]);
    const property = propResult.rows[0];
    if (!property) return sendError(res, 'Property not found', 404);
    if (user.role !== 'ADMIN' && property.agent_id !== user.id) {
      return sendError(res, 'Forbidden: you do not own this property', 403);
    }
    // Find image
    const imgResult = await client.query('SELECT id, image_url, is_primary FROM property_images WHERE id = $1 AND property_id = $2', [imageId, propertyId]);
    const image = imgResult.rows[0];
    if (!image) return sendError(res, 'Image not found', 404);

    await client.query('BEGIN');
    // Delete image row
    await client.query('DELETE FROM property_images WHERE id = $1', [imageId]);
    // Delete file from disk
    const filePath = path.join(__dirname, '../../uploads/properties', path.basename(image.image_url));
    deleteFile(filePath);

    // If deleted image was primary, promote another image
    if (image.is_primary) {
      const remaining = await client.query(
        'SELECT id FROM property_images WHERE property_id = $1 ORDER BY display_order ASC LIMIT 1',
        [propertyId]
      );
      if (remaining.rowCount > 0) {
        await client.query('UPDATE property_images SET is_primary = TRUE WHERE id = $1', [remaining.rows[0].id]);
      }
    }
    await client.query('COMMIT');
    return sendSuccess(res, 'Image deleted successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// PATCH /properties/:id/images/:imageId/primary – set an image as primary.
async function setPrimaryImage(req, res, next) {
  const client = await pool.connect();
  try {
    const { id: propertyId, imageId } = req.params;
    const user = req.user;
    // Verify property & ownership
    const propResult = await client.query('SELECT id, agent_id FROM properties WHERE id = $1', [propertyId]);
    const property = propResult.rows[0];
    if (!property) return sendError(res, 'Property not found', 404);
    if (user.role !== 'ADMIN' && property.agent_id !== user.id) {
      return sendError(res, 'Forbidden: you do not own this property', 403);
    }
    // Verify image belongs to property
    const imgResult = await client.query('SELECT id FROM property_images WHERE id = $1 AND property_id = $2', [imageId, propertyId]);
    if (imgResult.rowCount === 0) return sendError(res, 'Image not found for this property', 404);

    await client.query('BEGIN');
    // Unset previous primary
    await client.query('UPDATE property_images SET is_primary = FALSE WHERE property_id = $1', [propertyId]);
    // Set new primary
    await client.query('UPDATE property_images SET is_primary = TRUE WHERE id = $1', [imageId]);
    await client.query('COMMIT');
    return sendSuccess(res, 'Primary image set successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = {
  uploadImages,
  getPropertyImages,
  deleteImage,
  setPrimaryImage,
};

