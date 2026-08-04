// ─── Central API Client ────────────────────────────────────────────────────────
// All backend calls go through here. Reads the JWT from localStorage and
// unwraps the { success, data } envelope that every backend route returns.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/**
 * Returns the Authorization header if a token exists, otherwise empty object.
 */
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Core fetch wrapper.
 * - Attaches JWT header automatically
 * - Accepts optional body (serialized to JSON)
 * - Unwraps { success: true, data: ... } envelope
 * - Throws an Error with the server message on non-2xx responses
 *
 * @param {string} path   — e.g. "/api/modules"
 * @param {object} [opts] — fetch options override
 * @returns {Promise<any>} — the `data` field from the backend response
 */
export async function apiFetch(path, opts = {}) {
  const { body, method = "GET", headers: extraHeaders = {}, ...rest } = opts;

  const isFormData = body instanceof FormData;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...authHeader(),
      ...extraHeaders,
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  // Try to parse JSON; fall back to null if body is empty
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      json?.message ||
      json?.error ||
      (json?.errors && Array.isArray(json.errors) ? json.errors.map(e => e.msg).join(', ') : null) ||
      `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  // Unwrap the standard { success: true, data: ... } envelope
  return json?.data !== undefined ? json.data : json;
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: "POST", body }),
  patch: (path, body) => apiFetch(path, { method: "PATCH", body }),
  put: (path, body) => apiFetch(path, { method: "PUT", body }),
  delete: (path) => apiFetch(path, { method: "DELETE" }),
};
