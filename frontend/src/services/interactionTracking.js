// frontend/src/services/interactionTracking.js
// Simple utility to send interaction events to the backend.
// It respects the existing apiRequest wrapper and never throws errors that could break the UI.

import { apiRequest } from "./api";

/**
 * Track a user interaction.
 * @param {Object} params
 * @param {string} params.event_type - Required event type.
 * @param {string|null} [params.property_id=null]
 * @param {string|null} [params.session_id=null]
 * @param {number} [params.dwell_time_seconds=0]
 * @param {Object} [params.metadata={}] - Optional additional data.
 * @returns {Promise<any|null>} API response on success, otherwise null.
 */
export async function trackInteraction({
  event_type,
  property_id = null,
  session_id = null,
  dwell_time_seconds = 0,
  metadata = {},
}) {
  // Ensure we have an authenticated user before sending anything.
  const token = localStorage.getItem("estateiq_access_token");
  if (!token) {
    return null;
  }

  try {
    const payload = {
      event_type,
      property_id,
      session_id,
      dwell_time_seconds,
      metadata,
    };
    // apiRequest will automatically add the Authorization header.
    const response = await apiRequest("/interactions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response;
  } catch (error) {
    // Never let tracking errors affect the UI.
    console.warn("Interaction tracking error:", error);
    return null;
  }
}

