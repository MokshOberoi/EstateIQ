// src/services/api.js
// Centralized API configuration for EstateIQ frontend.
// Uses VITE_API_BASE_URL if defined, otherwise defaults to the local backend.

// Determine the base URL, trimming any trailing slashes if VITE_API_BASE_URL is set.
let _base = import.meta.env.VITE_API_BASE_URL;

if (typeof _base === "string" && _base.length > 0) {
  // Remove trailing slashes
  _base = _base.replace(/\/+$/g, "");
}

const API_BASE_URL = _base || "http://localhost:5000/api/v1";

// Helper to retrieve stored access token
function getAccessToken() {
  return localStorage.getItem("estateiq_access_token");
}

// Helper to resolve image URLs that may be stored as backend-relative paths.
export function resolveImageUrl(url) {
  if (!url) return "";

  // Already an absolute URL
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Backend-relative upload path
  if (url.startsWith("/uploads/")) {
    const origin = API_BASE_URL.replace(/\/api\/v1$/i, "");
    return `${origin}${url}`;
  }

  // Other paths remain unchanged
  return url;
}

/**
 * Wrapper around fetch that prefixes the base URL and adds JSON handling.
 * Automatically injects Authorization header when a token is present.
 */
export async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const token = getAccessToken();
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const defaultHeaders = {};

  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  // Add Authorization only if a token exists and caller hasn't set one already.
  if (token && !(options.headers && options.headers.Authorization)) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  // Let the browser set the multipart boundary automatically.
  if (isFormData) {
    delete mergedHeaders["Content-Type"];
  }

  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });

  let json = null;

  try {
    json = await response.json();
  } catch (e) {
    // Ignore non-JSON responses.
  }

  return {
    ok: response.ok,
    status: response.status,
    data: json,
  };
}