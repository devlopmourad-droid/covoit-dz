const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const ACCESS_TOKEN_KEY = 'nqasmo_access_token';
const REFRESH_TOKEN_KEY = 'nqasmo_refresh_token';

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: any) {
    super(message);
  }
}

// localStorage est utilisé ici volontairement : ceci est une vraie
// application web déployée (pas un artifact claude.ai, où localStorage est
// interdit). Un cookie httpOnly serait plus sûr contre le XSS ; ce choix
// simple correspond au même modèle que l'app mobile pour rester cohérent
// entre les deux clients — à durcir avant une vraie mise en production
// sensible (voir docs/ROADMAP.md).
export function getTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const { refreshToken } = getTokens();
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const doFetch = async (accessToken: string | null) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  const { accessToken } = getTokens();
  let res = await doFetch(accessToken);

  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await doFetch(newToken);
  }

  if (!res.ok) {
    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      /* réponse non-JSON */
    }
    throw new ApiError(res.status, payload?.message || `Erreur ${res.status}`, payload);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export { API_BASE_URL };
