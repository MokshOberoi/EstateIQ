// Recommendation Validator
const { validate: uuidValidate } = require('uuid');

/** Validate UUID string */
function validateUuid(id) {
  if (!uuidValidate(id)) {
    return { error: new Error('Invalid UUID format') };
  }
  return {};
}

/** Validate pagination query params */
function validatePagination(query) {
  const errors = [];
  const value = {};
  const page = query.page ? Number(query.page) : 1;
  if (isNaN(page) || page < 1) errors.push('"page" must be a positive integer');
  else value.page = page;
  const limit = query.limit ? Number(query.limit) : 20;
  if (isNaN(limit) || limit < 1) errors.push('"limit" must be a positive integer');
  else if (limit > 100) errors.push('"limit" cannot exceed 100');
  else value.limit = limit;
  if (errors.length) return { error: new Error(errors.join('; ')) };
  return { value };
}

/** Validate generate request body (optional limit) */
function validateGenerateBody(body) {
  const errors = [];
  const value = {};
  if (body.limit !== undefined) {
    const limit = Number(body.limit);
    if (isNaN(limit) || limit < 1) errors.push('"limit" must be a positive integer');
    else if (limit > 50) errors.push('"limit" cannot exceed 50');
    else value.limit = limit;
  } else {
    value.limit = 10; // default
  }
  if (errors.length) return { error: new Error(errors.join('; ')) };
  return { value };
}

module.exports = { validateUuid, validatePagination, validateGenerateBody };
