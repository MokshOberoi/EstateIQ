// Property Validator
const { sendError } = require('../utils/apiResponse');

// Allowed enum values (read from schema manually)
const PROPERTY_TYPES = [
  'SINGLE_FAMILY',
  'APARTMENT',
  'CONDO',
  'TOWNHOUSE',
  'VILLA',
  'PENTHOUSE',
  'ESTATE',
];
const PROPERTY_STATUS = ['ACTIVE', 'PENDING', 'SOLD'];

/**
 * Validate query parameters for listing endpoints.
 * Returns { error, value } where error.message contains a user‑friendly description.
 */
function validateQueryParams(query) {
  const errors = [];
  const value = {};

  // page
  const page = query.page ? Number(query.page) : 1;
  if (isNaN(page) || page < 1) errors.push('"page" must be a positive integer starting from 1');
  else value.page = page;

  // limit
  const limit = query.limit ? Number(query.limit) : 20;
  if (isNaN(limit) || limit < 1) errors.push('"limit" must be a positive integer');
  else if (limit > 100) errors.push('"limit" cannot exceed 100');
  else value.limit = limit;

  // sort
  const allowedSort = ['newest', 'price_low', 'price_high', 'area_high'];
  if (query.sort) {
    if (!allowedSort.includes(query.sort)) errors.push(`"sort" must be one of ${allowedSort.join(', ')}`);
    else value.sort = query.sort;
  }

  // filters – only those that exist in schema
  const filters = {};
  if (query.city) filters.city = query.city.trim();
  if (query.state) filters.state = query.state.trim();
  if (query.property_type) {
    if (!PROPERTY_TYPES.includes(query.property_type)) errors.push('Invalid "property_type"');
    else filters.property_type = query.property_type;
  }
  if (query.status) {
    if (!PROPERTY_STATUS.includes(query.status)) errors.push('Invalid "status"');
    else filters.status = query.status;
  }

  // numeric range filters
  const num = (name) => {
    if (query[name] !== undefined) {
      const n = Number(query[name]);
      if (isNaN(n) || n < 0) errors.push(`"${name}" must be a non‑negative number`);
      else filters[name] = n;
    }
  };
  num('minPrice');
  num('maxPrice');
  num('minBedrooms');
  num('maxBedrooms');
  num('minBathrooms');
  num('maxBathrooms');
  num('minArea');
  num('maxArea');

  // range consistency checks
  if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
    errors.push('"minPrice" cannot be greater than "maxPrice"');
  }
  if (filters.minBedrooms !== undefined && filters.maxBedrooms !== undefined && filters.minBedrooms > filters.maxBedrooms) {
    errors.push('"minBedrooms" cannot be greater than "maxBedrooms"');
  }
  if (filters.minBathrooms !== undefined && filters.maxBathrooms !== undefined && filters.minBathrooms > filters.maxBathrooms) {
    errors.push('"minBathrooms" cannot be greater than "maxBathrooms"');
  }
  if (filters.minArea !== undefined && filters.maxArea !== undefined && filters.minArea > filters.maxArea) {
    errors.push('"minArea" cannot be greater than "maxArea"');
  }

  // search string
  if (query.search) {
    value.search = query.search.trim();
  }

  value.filters = filters;

  if (errors.length) {
    return { error: new Error(errors.join('; ')) };
  }
  return { value };
}

/**
 * Validate payload for create / update property.
 * mode: 'create' or 'update'.
 */
function validatePropertyPayload(payload, mode = 'create') {
  const errors = [];
  const value = {};

  // Required fields for both create and update (update may be partial but we will treat missing as unchanged – for simplicity we require same fields)
  const required = ['title', 'description', 'price', 'property_type', 'status', 'bedrooms', 'bathrooms', 'square_feet', 'address', 'city', 'state', 'zip_code'];

  required.forEach((field) => {
    if (mode === 'create' && (payload[field] === undefined || payload[field] === null)) {
      errors.push(`"${field}" is required`);
    } else if (payload[field] !== undefined) {
      value[field] = payload[field];
    }
  });

  // Validate enums
  if (value.property_type && !PROPERTY_TYPES.includes(value.property_type)) errors.push('Invalid "property_type"');
  if (value.status && !PROPERTY_STATUS.includes(value.status)) errors.push('Invalid "status"');

  // Numeric checks
  const numCheck = (field, allowFloat = false) => {
    if (value[field] !== undefined) {
      const n = Number(value[field]);
      if (isNaN(n) || n <= 0) errors.push(`"${field}" must be a positive ${allowFloat ? 'number' : 'integer'}`);
      else value[field] = n;
    }
  };
  numCheck('price');
  numCheck('bedrooms');
  numCheck('bathrooms', true);
  numCheck('square_feet');

  // Optional fields
  if (payload.year_built !== undefined) {
    const year = Number(payload.year_built);
    if (!Number.isInteger(year) || year < 1800 || year > 2100) errors.push('"year_built" must be an integer between 1800 and 2100');
    else value.year_built = year;
  }
  if (payload.latitude !== undefined) {
    const lat = Number(payload.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) errors.push('"latitude" must be a number between -90 and 90');
    else value.latitude = lat;
  }
  if (payload.longitude !== undefined) {
    const lng = Number(payload.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) errors.push('"longitude" must be a number between -180 and 180');
    else value.longitude = lng;
  }

  // Amenities – array of UUID strings
  if (payload.amenities !== undefined) {
    if (!Array.isArray(payload.amenities)) errors.push('"amenities" must be an array of UUIDs');
    else value.amenities = payload.amenities.map(String);
  }

  // Reject client‑provided agent_id for safety – ignore it.
  if (payload.agent_id !== undefined) {
    // ignore
  }

  if (errors.length) return { error: new Error(errors.join('; ')) };
  return { value };
}

module.exports = { validateQueryParams, validatePropertyPayload };

