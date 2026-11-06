// Property Controller
const { sendSuccess, sendError } = require('../utils/apiResponse');
const propertyService = require('../services/propertyService');
const { validatePropertyPayload, validateQueryParams } = require('../validators/propertyValidator');
const { paginationMeta } = require('../utils/pagination');

// GET /properties - public listing with pagination, filters, search, sort
async function getAllProperties(req, res, next) {
  try {
    const { error, value } = validateQueryParams(req.query);
    if (error) return sendError(res, error.message, 400);

    const result = await propertyService.listProperties(value);
    return sendSuccess(res, 'Properties retrieved successfully', { data: result.rows, pagination: paginationMeta(value.page, value.limit, result.total) });
  } catch (err) {
    next(err);
  }
}

// GET /properties/:id - public details
async function getPropertyById(req, res, next) {
  try {
    const { id } = req.params;
    const property = await propertyService.getPropertyDetails(id);
    if (!property) return sendError(res, 'Property not found', 404);
    return sendSuccess(res, 'Property retrieved successfully', { data: property });
  } catch (err) {
    next(err);
  }
}

// GET /properties/my/listings - agent/admin own listings
async function getMyListings(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const result = await propertyService.listMyProperties(userId, { page: Number(page), limit: Number(limit) });
    return sendSuccess(res, 'My listings retrieved successfully', { data: result.rows, pagination: paginationMeta(Number(page), Number(limit), result.total) });
  } catch (err) {
    next(err);
  }
}

// POST /properties - create
async function createProperty(req, res, next) {
  try {
    const { error, value } = validatePropertyPayload(req.body, 'create');
    if (error) return sendError(res, error.message, 400);

    const user = req.user; // contains id and role
    const created = await propertyService.createProperty(value, user);
    return sendSuccess(res, "Property created successfully", { data: created }, 201);
  } catch (err) {
    next(err);
  }
}

// PUT /properties/:id - update
async function updateProperty(req, res, next) {
  try {
    const { id } = req.params;
    const { error, value } = validatePropertyPayload(req.body, 'update');
    if (error) return sendError(res, error.message, 400);

    const user = req.user;
    const updated = await propertyService.updateProperty(id, value, user);
    if (updated === null) return sendError(res, 'Property not found', 404);
    if (updated === false) return sendError(res, 'Forbidden: you do not own this property', 403);
    return sendSuccess(res, "Property updated successfully", { data: updated });
  } catch (err) {
    next(err);
  }
}

// DELETE /properties/:id - delete
async function deleteProperty(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;
    const result = await propertyService.deleteProperty(id, user);
    if (result === null) return sendError(res, 'Property not found', 404);
    if (result === false) return sendError(res, 'Forbidden: you do not own this property', 403);
    return sendSuccess(res, 'Property deleted successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllProperties,
  getPropertyById,
  getMyListings,
  createProperty,
  updateProperty,
  deleteProperty,
};