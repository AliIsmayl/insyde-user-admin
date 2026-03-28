// src/Utils/authUtils.js

export const API_BASE = import.meta.env.VITE_API_BASE;

export const CK = {
  set: (name, value, days = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  },
  get: (name) => {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));
    return match ? decodeURIComponent(match.split("=")[1]) : "";
  },
  del: (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  },
};

export const LS = { set: CK.set, get: CK.get, del: CK.del };

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

export function clearSession(navigate) {
  CK.del("access_token");
  CK.del("refresh_token");
  CK.del("isAuthenticated");
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

// ── Eyni anda birdən çox refresh sorğusu getməsin deyə singleton
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
      if (!data) return null;

      const newAccess = data?.access;
      if (!newAccess) return null;

      // Yeni access token saxla
      CK.set("access_token", newAccess, 1);
      try {
        localStorage.setItem("access_token", newAccess);
      } catch {}

      // Backend yeni refresh token da qaytarırsa onu da saxla
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
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

export async function authFetch(url, options = {}, navigate) {
  let token = getToken();

  if (!token) {
    clearSession(navigate);
    return null;
  }

  const isFormData = options.body instanceof FormData;

  const buildHeaders = (t) => {
    const headers = { Authorization: `Bearer ${t}` };
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
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
    // ── İlk sorğu cəhdi
    let res = await fetch(url, {
      ...restOptions,
      headers: buildHeaders(token),
    });

    // ── 401 gəldisə refresh token ilə yenilə
    if (res.status === 401) {
      const newToken = await refreshAccessToken();

      // Refresh uğursuz → session bitdi
      if (!newToken) {
        clearSession(navigate);
        return null;
      }

      // Yeni token ilə sorğunu təkrar et
      res = await fetch(url, {
        ...restOptions,
        headers: buildHeaders(newToken),
      });

      // Yenə 401 → session tamamilə bitib
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
