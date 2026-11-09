// backend/src/controllers/interactionController.js
// Controllers for Interaction Tracking API

const { sendSuccess, sendError } = require('../utils/apiResponse');
const interactionService = require('../services/interactionService');
const leadService = require('../services/leadService');

/** POST /api/v1/interactions */
async function createInteraction(req, res, next) {
  try {
    const result = await interactionService.recordInteraction(req.user.id, req.body);
    if (result.badRequest) {
      return sendError(res, result.message, 400);
    }
    // Recalculate lead profile after successful insert
    const leadProfile = await leadService.calculateAndSaveLead(req.user.id);
    return sendSuccess(res, 'Interaction recorded', { interaction: result.interaction, leadProfile }, 201);
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/interactions/batch */
async function createBatch(req, res, next) {
  try {
    const { interactions } = req.body;
    const result = await interactionService.recordBatch(req.user.id, interactions || []);
    if (result.badRequest) {
      return sendError(res, result.message, 400);
    }
    const leadProfile = await leadService.calculateAndSaveLead(req.user.id);
    return sendSuccess(res, 'Batch interactions recorded', { count: result.count, leadProfile }, 201);
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/interactions/me */
async function getMyInteractions(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { rows, total, page: safePage, limit: safeLimit } = await interactionService.getUserInteractions(req.user.id, { page, limit });
    return sendSuccess(res, 'Interactions retrieved', { interactions: rows, pagination: { page: safePage, limit: safeLimit, total } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createInteraction,
  createBatch,
  getMyInteractions,
};

