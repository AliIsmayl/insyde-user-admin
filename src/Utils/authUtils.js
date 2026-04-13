// src/Utils/authUtils.js

export const API_BASE = import.meta.env.VITE_API_BASE;

/* ── Cookie yardımçıları ── */
const isSecure = location.protocol === "https:";

export const CK = {
  set: (name, value, days = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const secure = isSecure ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
  },
  get: (name) => {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));
    return match ? decodeURIComponent(match.split("=")[1]) : "";
  },
  del: (name) => {
    const secure = isSecure ? "; Secure" : "";
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${secure}`;
  },
};

export const LS = { set: CK.set, get: CK.get, del: CK.del };

/* ── Token oxu ── */
export function getToken() {
  const fromCookie = CK.get("access_token");
  if (fromCookie) return fromCookie;
  try {
    const fromLS = localStorage.getItem("access_token");
    if (fromLS) return fromLS;
  } catch {}
  return "";
}

export function getRefreshToken() {
  const fromCookie = CK.get("refresh_token");
  if (fromCookie) return fromCookie;
  try {
    const fromLS = localStorage.getItem("refresh_token");
    if (fromLS) return fromLS;
  } catch {}
  return "";
}

export function isAuthenticated() {
  return !!getToken();
}

/* ── Session təmizlə ── */
export function clearSession(navigate) {
  CK.del("access_token");
  CK.del("refresh_token");
  CK.del("isAuthenticated");
  CK.del("hash_id"); // ← əlavə edildi
  CK.del("user_code"); // ← əlavə edildi
  try {
    sessionStorage.removeItem("insyde_trial_modal_seen");
    sessionStorage.removeItem("insyde_package_flip_hint_seen");
  } catch {}
  try {
    localStorage.removeItem("access_token");
  } catch {}
  try {
    localStorage.removeItem("refresh_token");
  } catch {}
  try {
    localStorage.removeItem("isAuthenticated");
  } catch {}
  if (navigate) navigate("/login", { replace: true });
}

/* ── Token saxla ── */
export function saveTokens(access, refresh) {
  CK.set("access_token", access, 1);
  CK.set("refresh_token", refresh, 7);
  try {
    localStorage.setItem("access_token", access);
  } catch {}
  try {
    localStorage.setItem("refresh_token", refresh);
  } catch {}
}

/* ── Refresh singleton ── */
let _refreshPromise = null;

async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE}/api/v1/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!res.ok) return null;

      const data = await res.json().catch(() => null);
      if (!data?.access) return null;

      const newAccess = data.access;

      CK.set("access_token", newAccess, 1);
      try {
        localStorage.setItem("access_token", newAccess);
      } catch {}

      if (data?.refresh) {
        CK.set("refresh_token", data.refresh, 7);
        try {
          localStorage.setItem("refresh_token", data.refresh);
        } catch {}
      }

      return newAccess;
    } catch {
      return null;
    } finally {
      setTimeout(() => {
        _refreshPromise = null;
      }, 100);
    }
  })();

  return _refreshPromise;
}

/* ── Authenticated fetch ── */
export async function authFetch(url, options = {}, navigate) {
  let token = getToken();

  if (!token) {
    token = await refreshAccessToken();
    if (!token) {
      clearSession(navigate);
      return null;
    }
  }

  const isFormData = options.body instanceof FormData;

  const buildHeaders = (t) => {
    const headers = { Authorization: `Bearer ${t}` };
    if (!isFormData) headers["Content-Type"] = "application/json";
    if (options.headers) {
      Object.entries(options.headers).forEach(([k, v]) => {
        if (isFormData && k.toLowerCase() === "content-type") return;
        headers[k] = v;
      });
    }
    return headers;
  };

  const { headers: _drop, ...restOptions } = options;

  try {
    let res = await fetch(url, {
      ...restOptions,
      headers: buildHeaders(token),
    });

    if (res.status === 401) {
      const newToken = await refreshAccessToken();

      if (!newToken) {
        clearSession(navigate);
        return null;
      }

      res = await fetch(url, {
        ...restOptions,
        headers: buildHeaders(newToken),
      });

      if (res.status === 401) {
        clearSession(navigate);
        return null;
      }
    }

    return res;
  } catch (err) {
    throw err;
  }
}
