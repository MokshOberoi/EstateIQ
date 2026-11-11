// src/services/api.js
// Centralized API configuration for EstateIQ frontend.
// Uses VITE_API_BASE_URL if defined, otherwise defaults to the local backend.

// Determine the base URL, trimming any trailing slashes if VITE_API_BASE_URL is set.
let _base = import.meta.env.VITE_API_BASE_URL;
if (typeof _base === "string" && _base.length > 0) {
  // Remove trailing slashes (e.g. "http://localhost:5000/" -> "http://localhost:5000")
  _base = _base.replace(/\\/+$/g, "");
}
const API_BASE_URL = _base || "http://localhost:5000/api/v1";

// Helper to retrieve stored access token
function getAccessToken() {
  return localStorage.getItem("estateiq_access_token");
}

/**
 * Wrapper around fetch that prefixes the base URL and adds JSON handling.
 * Automatically injects Authorization header when a token is present.
 * Does not overwrite an explicit Authorization header passed in options.headers.
 */
// Helper to resolve image URLs that may be stored as backend‑relative paths.
// If the URL already starts with http:// or https://, it is returned unchanged.
// If it starts with /uploads/, it is prefixed with the backend origin (API base without the /api/v1 segment).
// This ensures images load correctly from the backend server regardless of the frontend origin.
export function resolveImageUrl(url) {
  if (!url) return '';
  // Already absolute URL?
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  // Backend‑relative upload path?
  if (url.startsWith('/uploads/')) {
    // Derive backend origin from API_BASE_URL (strip any trailing '/api/v1' segment).
    const origin = API_BASE_URL.replace(/\/api\/v1$/i, '');
    // Ensure we don't duplicate slashes.
    return `${origin}${url}`;
  }
  // Fallback – return as‑is (could be other relative paths handled elsewhere).
  return url;
}

// ---------- Global token refresh handling ----------
let refreshPromise = null;
// Paths that should NOT trigger automatic refresh
const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
];
function shouldRefresh(path) {
  // Only refresh for non‑auth endpoints and when we got a 401
  return !NO_REFRESH_PATHS.some((p) => path.startsWith(p));
}
async function performRefresh() {
  const storedRefresh = localStorage.getItem("estateiq_refresh_token");
  if (!storedRefresh) throw new Error("No refresh token");
  const resp = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: storedRefresh }),
  });
  if (!resp.ok) throw new Error("Refresh failed");
  const json = await resp.json();
  const tokens = json?.data?.tokens;
  if (tokens?.accessToken) {
    localStorage.setItem("estateiq_access_token", tokens.accessToken);
  }
  if (tokens?.refreshToken) {
    localStorage.setItem("estateiq_refresh_token", tokens.refreshToken);
  }
}
function clearAuthAndNotify() {
  localStorage.removeItem("estateiq_user");
  localStorage.removeItem("estateiq_access_token");
  localStorage.removeItem("estateiq_refresh_token");
  // broadcast event for AuthContext
  window.dispatchEvent(new Event("estateiq-auth-expired"));
}

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const token = getAccessToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const defaultHeaders = {};
  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  // Add Authorization only if token exists and caller hasn't set one already.
  if (token && !(options.headers && options.headers.Authorization)) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  // Ensure browser sets multipart/form-data boundary automatically when using FormData
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
    // ignore non‑JSON bodies
  }

  // Automatic token refresh on 401 for eligible endpoints
  if (response.status === 401 && shouldRefresh(path) && !(options._retry)) {
    // Ensure only one refresh request runs at a time
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          await performRefresh();
        } finally {
          refreshPromise = null;
        }
      })();
    }
    try {
      await refreshPromise;
      // retry original request once with new token
      const retryOptions = { ...options, _retry: true };
      return await apiRequest(path, retryOptions);
    } catch (e) {
      // Refresh failed – clear auth and propagate original 401 response
      clearAuthAndNotify();
      return { ok: false, status: 401, data: json };
    }
  }

  return { ok: response.ok, status: response.status, data: json };
}
