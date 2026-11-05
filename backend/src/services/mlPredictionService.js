const { sendError } = require('../utils/apiResponse');

/**
 * Calls the external FastAPI ML microservice to get a lead classification.
 * @param {Object} features - numeric features matching the model input schema.
 * @returns {Promise<Object>} - resolves to { classification, confidence, probabilities }
 */
async function predict(features) {
  const baseUrl = process.env.ML_SERVICE_URL;
  if (!baseUrl) {
    throw new Error('ML_SERVICE_URL is not defined in environment');
  }
  const url = `${baseUrl.replace(/\/\+$/, '')}/predict`;

  // Node >=18 provides native fetch; otherwise require node-fetch (not installed).
  const fetchFn = typeof fetch === 'function' ? fetch : require('node-fetch');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5 s timeout

  try {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`ML service responded ${res.status}: ${txt}`);
    }
    const data = await res.json();
    // Validate expected shape (basic)
    if (!data.classification) {
      throw new Error('Invalid response from ML service');
    }
    return data;
  } catch (err) {
    clearTimeout(timeout);
    // Wrap in a generic error for the caller to handle via sendError
    throw err;
  }
}

module.exports = { predict };

