export const API_BASE = import.meta.env.VITE_API_BASE;

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
    if (!match) return "";
    const raw = match.split("=").slice(1).join("=");
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  },
  del: (name) => {
    const secure = isSecure ? "; Secure" : "";
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${secure}`;
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

export function isAuthenticated() {
  return !!getToken();
}

export function clearSession(navigate) {
  CK.del("access_token");
  CK.del("refresh_token");
  CK.del("isAuthenticated");
  CK.del("hash_id");
  CK.del("user_code");
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

export function saveTokens(access) {
  CK.set("access_token", access, 1);
  try {
    localStorage.setItem("access_token", access);
  } catch {}
}

function getCsrfToken() {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
}

export async function authFetch(url, options = {}, navigate) {
  const token = getToken();
  if (!token) {
    clearSession(navigate);
    return null;
  }

  const isFormData = options.body instanceof FormData;
  const method = (options.method || "GET").toUpperCase();
  const needsCsrf = !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method);

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  if (!isFormData) headers["Content-Type"] = "application/json";

  if (needsCsrf) {
    const csrf = getCsrfToken();
    if (csrf) headers["X-CSRFToken"] = csrf;
  }

  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (isFormData && key.toLowerCase() === "content-type") return;
      headers[key] = value;
    });
  }

  const { headers: _ignoredHeaders, ...restOptions } = options;

  return fetch(url, {
    ...restOptions,
    credentials: "include",
    headers,
  });
}
