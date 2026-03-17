// ─────────────────────────────────────────────────────────
// src/utils/authUtils.js
// ─────────────────────────────────────────────────────────

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

// ── LS — köhnə kod uyğunluğu üçün CK-ya yönləndirir ─────
export const LS = {
  set: CK.set,
  get: CK.get,
  del: CK.del,
};

// ── Token var mı? ─────────────────────────────────────────
export function isAuthenticated() {
  return !!CK.get("access_token");
}

// ── Sessionu təmizlə + login-ə yönləndir ─────────────────
export function clearSession(navigate) {
  CK.del("access_token");
  CK.del("refresh_token");
  CK.del("isAuthenticated");
  // köhnə localStorage qalıqlarını da sil
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
  const token = CK.get("access_token");

  if (!token) {
    clearSession(navigate);
    return null;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    clearSession(navigate);
    return null;
  }

  return res;
}
