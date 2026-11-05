// Lead Validator
const { validate: uuidValidate } = require('uuid');

const ALLOWED_CLASSIFICATIONS = ['HOT', 'WARM', 'COLD'];
const ALLOWED_SORT = ['score_high', 'score_low', 'recent', 'active'];

/** Validate UUID string */
function validateUuid(id) {
  if (!uuidValidate(id)) {
    return { error: new Error('Invalid UUID format') };
  }
  return {};
}

/** Validate pagination and filter query params for lead listings */
function validateLeadQuery(query) {
  const errors = [];
  const value = {};
  // pagination
  const page = query.page ? Number(query.page) : 1;
  if (isNaN(page) || page < 1) errors.push('"page" must be a positive integer');
  else value.page = page;
  const limit = query.limit ? Number(query.limit) : 20;
  if (isNaN(limit) || limit < 1) errors.push('"limit" must be a positive integer');
  else if (limit > 100) errors.push('"limit" cannot exceed 100');
  else value.limit = limit;
  // classification filter
  if (query.classification) {
    const cls = query.classification.toUpperCase();
    if (!ALLOWED_CLASSIFICATIONS.includes(cls)) {
      errors.push(`"classification" must be one of ${ALLOWED_CLASSIFICATIONS.join(', ')}`);
    } else {
      value.classification = cls;
    }
  }
  // score range
  if (query.minScore !== undefined) {
    const min = Number(query.minScore);
    if (isNaN(min) || min < 0) errors.push('"minScore" must be a non‑negative number');
    else value.minScore = min;
  }
  if (query.maxScore !== undefined) {
    const max = Number(query.maxScore);
    if (isNaN(max) || max < 0) errors.push('"maxScore" must be a non‑negative number');
    else value.maxScore = max;
  }
  if (value.minScore !== undefined && value.maxScore !== undefined && value.minScore > value.maxScore) {
    errors.push('"minScore" cannot be greater than "maxScore"');
  }
  // sort option
  if (query.sort) {
    if (!ALLOWED_SORT.includes(query.sort)) errors.push(`"sort" must be one of ${ALLOWED_SORT.join(', ')}`);
    else value.sort = query.sort;
  }
  if (errors.length) {
    return { error: new Error(errors.join('; ')) };
  }
  return { value };
}

module.exports = { validateUuid, validateLeadQuery };
