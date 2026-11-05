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

/** POST /leads/:userId/predict - ADMIN only */
async function predictLead(req, res, next) {
  try {
    const { userId } = req.params;
    const { error } = validateUuid(userId);
    if (error) return sendError(res, error.message, 400);

    const ruleProfile = await leadService.getLeadProfile(userId);
    if (!ruleProfile) return sendError(res, 'Lead profile not found', 404);

    // Build feature payload matching the ML model schema
    const features = {
      total_views: ruleProfile.total_views || 0,
      total_favourites: ruleProfile.total_favourites || 0,
      total_enquiries: ruleProfile.total_enquiries || 0,
      total_dwell_time: ruleProfile.total_dwell_time || 0,
      engagement_score: ruleProfile.engagement_score,
      recency_score: ruleProfile.recency_score,
      intent_score: ruleProfile.intent_score,
    };

    const mlResult = await predict(features);
    return sendSuccess(res, 'Lead prediction', {
      ruleBasedProfile: ruleProfile,
      mlPrediction: mlResult,
    });
  } catch (err) {
    next(err);
  }
}

const { predict } = require('../services/mlPredictionService');

module.exports = {
  calculateLead,
  getLeadProfile,
  getMyLeadProfile,
  listLeads,
  getLeadHistory,
  predictLead,
};

