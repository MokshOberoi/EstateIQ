// src/services/api.js
// Centralized API configuration for EstateIQ frontend.
// Uses VITE_API_BASE_URL if defined, otherwise defaults.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\\/+$/, "") || "http://localhost:5000/api/v1";

// Helper to retrieve stored access token
function getAccessToken() {
  return localStorage.getItem("estateiq_access_token");
}

/**
 * Wrapper around fetch that prefixes the base URL and adds JSON handling.
 * Automatically injects Authorization header when a token is present.
 */
export async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const token = getAccessToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...(options.headers || {}),
    },
    ...options,
  });

  let json = null;
  try {
    json = await response.json();
  } catch (e) {
    // ignore non‑JSON bodies
  }

  return { ok: response.ok, status: response.status, data: json };
}
