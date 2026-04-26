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
  const invalid = new Set(["", "null", "undefined"]);
  const fromCookie = CK.get("access_token");
  if (fromCookie && !invalid.has(fromCookie)) return fromCookie.trim();
  try {
    const fromLS = localStorage.getItem("access_token");
    if (fromLS && !invalid.has(fromLS)) return fromLS.trim();
  } catch {}
  return "";
}

export function isAuthenticated() {
  return !!getToken();
}

export function getBearerHeaders(extraHeaders = {}) {
  const token = getToken();
  if (!token) return { ...extraHeaders };
  return {
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };
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
  if (!access || typeof access !== "string" || !access.trim()) return;
  const token = access.trim();
  CK.set("access_token", token, 1);
  try {
    localStorage.setItem("access_token", token);
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

  const headers = getBearerHeaders({
    Accept: "application/json",
  });

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

  const response = await fetch(url, {
    ...restOptions,
    credentials: options.credentials || "include",
    headers,
  });

  if (response.status === 401) {
    clearSession();
    if (!navigate) window.location.replace("/login");
    return null;
  }

  return response;
}
