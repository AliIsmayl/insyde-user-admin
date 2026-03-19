export const API_BASE = import.meta.env.VITE_API_BASE;

// ── Cookie helpers ────────────────────────────────────────
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

// ── Token oxuma: cookie → localStorage ───────────────────
export function getToken() {
  const fromCookie = CK.get("access_token");
  if (fromCookie) return fromCookie;
  try {
    const fromLS = localStorage.getItem("access_token");
    if (fromLS) return fromLS;
  } catch {}
  return "";
}

// ── Auth yoxlama ──────────────────────────────────────────
export function isAuthenticated() {
  return !!getToken();
}

// ── Session təmizlə ───────────────────────────────────────
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

// ── Authenticated fetch ───────────────────────────────────
export async function authFetch(url, options = {}, navigate) {
  const token = getToken();

  if (!token) {
    clearSession(navigate);
    return null;
  }

  const isFormData = options.body instanceof FormData;

  const headers = { Authorization: `Token ${token}` };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (options.headers) {
    Object.entries(options.headers).forEach(([k, v]) => {
      if (isFormData && k.toLowerCase() === "content-type") return;
      headers[k] = v;
    });
  }

  const { headers: _drop, ...restOptions } = options;

  try {
    const res = await fetch(url, { ...restOptions, headers });
    if (res.status === 401) {
      clearSession(navigate);
      return null;
    }
    return res;
  } catch (err) {
    throw err;
  }
}
