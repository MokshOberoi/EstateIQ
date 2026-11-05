// Recommendation Controller
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { validateUuid, validatePagination, validateGenerateBody } = require('../validators/recommendationValidator');
const recommendationService = require('../services/recommendationService');
const { paginationMeta } = require('../utils/pagination');

/** POST /recommendations/generate */
async function generate(req, res, next) {
  try {
    const { error, value } = validateGenerateBody(req.body);
    if (error) return sendError(res, error.message, 400);
    const limit = value.limit;
    const userId = req.user.id;
    const results = await recommendationService.generateRecommendations(userId, limit);
    return sendSuccess(res, 'Recommendations generated', results);
  } catch (err) {
    next(err);
  }
}

/** GET /recommendations/me */
async function listMe(req, res, next) {
  try {
    const { error, value } = validatePagination(req.query);
    if (error) return sendError(res, error.message, 400);
    const { page, limit } = value;
    const userId = req.user.id;
    const { rows, total } = await recommendationService.listRecommendations(userId, page, limit);
    const meta = paginationMeta(page, limit, total);
    return sendSuccess(res, 'Recommendations retrieved', { items: rows, meta });
  } catch (err) {
    next(err);
  }
}

/** GET /recommendations/:userId (ADMIN only) */
async function listUser(req, res, next) {
  try {
    const { error, value } = validatePagination(req.query);
    if (error) return sendError(res, error.message, 400);
    const { page, limit } = value;
    const { error: uuidErr } = validateUuid(req.params.userId);
    if (uuidErr) return sendError(res, uuidErr.message, 400);
    const targetUserId = req.params.userId;
    const { rows, total } = await recommendationService.listRecommendations(targetUserId, page, limit);
    const meta = paginationMeta(page, limit, total);
    return sendSuccess(res, 'User recommendations retrieved', { items: rows, meta });
  } catch (err) {
    next(err);
  }
}

module.exports = { generate, listMe, listUser };

