// backend/src/controllers/favouriteController.js

// Imports
const { sendSuccess, sendError } = require('../utils/apiResponse');
const favouriteService = require('../services/favouriteService');
const leadService = require('../services/leadService');
const { validateUuid } = require('../validators/leadValidator');

/** GET /api/v1/favourites */
async function getMyFavourites(req, res, next) {
  try {
    const favourites = await favouriteService.getMyFavourites(req.user.id);
    return sendSuccess(res, 'Favourites retrieved successfully', favourites);
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/favourites/:propertyId */
async function addFavourite(req, res, next) {
  try {
    const { propertyId } = req.params;
    if (!propertyId) {
      return sendError(res, 'propertyId parameter is required', 400);
    }
    // UUID validation
    const { error } = validateUuid(propertyId);
    if (error) {
      return sendError(res, error.message, 400);
    }
    const result = await favouriteService.addFavourite(req.user.id, propertyId);
    if (result.notFound) {
      return sendError(res, result.message, 404);
    }
    if (result.conflict) {
      return sendError(res, result.message, 409);
    }
    // Recalculate lead profile after successful addition
    const leadProfile = await leadService.calculateAndSaveLead(req.user.id);
    return sendSuccess(res, 'Property added to favourites', { favourite: result.favourite, leadProfile }, 201);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/v1/favourites/:propertyId */
async function removeFavourite(req, res, next) {
  try {
    const { propertyId } = req.params;
    if (!propertyId) {
      return sendError(res, 'propertyId parameter is required', 400);
    }
    // UUID validation
    const { error } = validateUuid(propertyId);
    if (error) {
      return sendError(res, error.message, 400);
    }
    const result = await favouriteService.removeFavourite(req.user.id, propertyId);
    if (result.notFound) {
      return sendError(res, result.message, 404);
    }
    // Recalculate lead profile after removal
    const leadProfile = await leadService.calculateAndSaveLead(req.user.id);
    return sendSuccess(res, 'Favourite removed successfully', { deletedId: result.deletedId, leadProfile });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/favourites/:propertyId/check */
async function checkFavourite(req, res, next) {
  try {
    const { propertyId } = req.params;
    if (!propertyId) {
      return sendError(res, 'propertyId parameter is required', 400);
    }
    // UUID validation
    const { error } = validateUuid(propertyId);
    if (error) {
      return sendError(res, error.message, 400);
    }
    const isFav = await favouriteService.isFavourite(req.user.id, propertyId);
    return sendSuccess(res, 'Favourite status retrieved', { favourited: isFav });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyFavourites,
  addFavourite,
  removeFavourite,
  checkFavourite,
};
