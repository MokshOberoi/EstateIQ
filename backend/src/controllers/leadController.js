// Lead Controller
const { sendSuccess, sendError } = require('../utils/apiResponse');
const leadService = require('../services/leadService');
const { validateUuid, validateLeadQuery } = require('../validators/leadValidator');
const { paginationMeta } = require('../utils/pagination');

/** POST /leads/:userId/calculate - ADMIN only */
async function calculateLead(req, res, next) {
  try {
    const { userId } = req.params;
    const { error } = validateUuid(userId);
    if (error) return sendError(res, error.message, 400);
    const profile = await leadService.calculateAndSaveLead(userId);
    return sendSuccess(res, 'Lead profile calculated', profile);
  } catch (err) {
    next(err);
  }
}

/** GET /leads/:userId - ADMIN only */
async function getLeadProfile(req, res, next) {
  try {
    const { userId } = req.params;
    const { error } = validateUuid(userId);
    if (error) return sendError(res, error.message, 400);
    const profile = await leadService.getLeadProfile(userId);
    if (!profile) return sendError(res, 'Lead profile not found', 404);
    return sendSuccess(res, 'Lead profile retrieved', profile);
  } catch (err) {
    next(err);
  }
}

/** GET /leads/me - any authenticated user */
async function getMyLeadProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await leadService.getLeadProfile(userId);
    if (!profile) return sendError(res, 'Lead profile not found', 404);
    return sendSuccess(res, 'Your lead profile', profile);
  } catch (err) {
    next(err);
  }
}

/** GET /leads - ADMIN list with filters */
async function listLeads(req, res, next) {
  try {
    const { error, value } = validateLeadQuery(req.query);
    if (error) return sendError(res, error.message, 400);
    const result = await leadService.listLeads(value);
    return sendSuccess(res, 'Lead list retrieved', {
      data: result.rows,
      pagination: paginationMeta(value.page, value.limit, result.total),
    });
  } catch (err) {
    next(err);
  }
}

/** GET /leads/:userId/history - ADMIN */
async function getLeadHistory(req, res, next) {
  try {
    const { userId } = req.params;
    const { error } = validateUuid(userId);
    if (error) return sendError(res, error.message, 400);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await leadService.getLeadHistory(userId, { page, limit });
    return sendSuccess(res, 'Lead score history', {
      data: result.rows,
      pagination: paginationMeta(page, limit, result.total),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  calculateLead,
  getLeadProfile,
  getMyLeadProfile,
  listLeads,
  getLeadHistory,
};

