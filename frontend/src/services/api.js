// src/services/api.js
// Centralized API configuration for EstateIQ frontend.
// Uses VITE_API_BASE_URL if defined (Vite injects env vars prefixed with VITE_), otherwise falls back to the development default.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:5000/api/v1";

/**
 * Simple wrapper around fetch that prefixes the base URL and handles JSON responses.
 * Returns an object { ok, status, data } where `data` is the parsed JSON (or null on error).
 */
export async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      // Add Authorization header here if needed in future (e.g., Bearer token)
      ...(options.headers || {}),
    },
    ...options,
  });

  let json = null;
  try {
    json = await response.json();
  } catch (e) {
    // Non‑JSON response (unlikely for this API)
  }

  return { ok: response.ok, status: response.status, data: json };
}

