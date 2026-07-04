/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OmniRide AWS HTTP Client
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Single authenticated fetch wrapper for all API Gateway → Lambda calls.
 *
 * Responsibilities:
 *  • Attaches the Cognito JWT (Bearer token) to every request
 *  • Handles 401 → automatic token refresh flow
 *  • Normalises error responses into AWSError
 *  • Offline fallback: returns cached localStorage data when network fails
 *  • Server-Sent Events (SSE) helper for AI streaming endpoints
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { API_BASE_URL, LAMBDA_ROUTES } from './awsConfig';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AWSError {
  code: string;
  message: string;
  statusCode: number;
}

export interface AWSResponse<T = any> {
  data: T | null;
  error: AWSError | null;
  fromCache: boolean;
}

// Token storage keys
const TOKEN_KEY   = 'omniride_access_token';
const REFRESH_KEY = 'omniride_refresh_token';
const USER_KEY    = 'omniride_user';

// ─────────────────────────────────────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────────────────────────────────────

export const tokenStore = {
  getAccess:  ():  string | null => localStorage.getItem(TOKEN_KEY),
  getRefresh: ():  string | null => localStorage.getItem(REFRESH_KEY),
  setTokens:  (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY,   access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Token refresh
// ─────────────────────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return null;

  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE_URL}${LAMBDA_ROUTES.AUTH_REFRESH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      tokenStore.clearTokens();
      return null;
    }

    const json = await res.json();
    const newAccess: string = json.accessToken;
    tokenStore.setTokens(newAccess, refreshToken);

    // Drain the queue
    refreshQueue.forEach(cb => cb(newAccess));
    refreshQueue = [];

    return newAccess;
  } catch {
    tokenStore.clearTokens();
    return null;
  } finally {
    isRefreshing = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * awsFetch — makes an authenticated call to API Gateway.
 *
 * @param path       LAMBDA_ROUTES constant or a custom path string
 * @param options    Standard RequestInit extended with optional cacheKey
 * @param cacheKey   If set, falls back to localStorage[cacheKey] on failure
 */
export async function awsFetch<T = any>(
  path: string,
  options: RequestInit & { cacheKey?: string } = {},
): Promise<AWSResponse<T>> {
  const { cacheKey, ...fetchOptions } = options;

  const buildHeaders = (token: string | null): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  });

  const doFetch = async (token: string | null): Promise<Response> => {
    return fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: buildHeaders(token),
    });
  };

  try {
    let token = tokenStore.getAccess();
    let response = await doFetch(token);

    // Auto-refresh on 401
    if (response.status === 401) {
      token = await refreshAccessToken();
      if (token) {
        response = await doFetch(token);
      } else {
        return {
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'Session expired. Please log in again.', statusCode: 401 },
          fromCache: false,
        };
      }
    }

    // Non-2xx
    if (!response.ok) {
      let errBody: any = {};
      try { errBody = await response.json(); } catch { /* ignore */ }
      return {
        data: null,
        error: {
          code: errBody.code ?? 'API_ERROR',
          message: errBody.message ?? `Request failed with status ${response.status}`,
          statusCode: response.status,
        },
        fromCache: false,
      };
    }

    // Parse JSON (handle empty bodies gracefully)
    let data: T | null = null;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      data = await response.json() as T;
    }

    // Cache successful GET responses
    if (cacheKey && (!fetchOptions.method || fetchOptions.method === 'GET') && data) {
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* quota */ }
    }

    return { data, error: null, fromCache: false };

  } catch (networkError: any) {
    // ── Offline fallback ──────────────────────────────────────────────────────
    if (cacheKey) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        console.warn(`[OmniRide] Network unavailable — serving cached data for "${cacheKey}"`);
        try {
          return { data: JSON.parse(cached) as T, error: null, fromCache: true };
        } catch { /* invalid cache */ }
      }
    }

    console.error(`[OmniRide] awsFetch error on ${path}:`, networkError);
    return {
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: networkError?.message ?? 'Network request failed',
        statusCode: 0,
      },
      fromCache: false,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience helpers
// ─────────────────────────────────────────────────────────────────────────────

export const awsGet  = <T>(path: string, cacheKey?: string) =>
  awsFetch<T>(path, { method: 'GET', cacheKey });

export const awsPost = <T>(path: string, body: unknown) =>
  awsFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const awsPut  = <T>(path: string, body: unknown) =>
  awsFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) });

export const awsPatch = <T>(path: string, body: unknown) =>
  awsFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

export const awsDelete = <T>(path: string) =>
  awsFetch<T>(path, { method: 'DELETE' });

// ─────────────────────────────────────────────────────────────────────────────
// Streaming SSE helper (for AI chat)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * awsStream — opens a Server-Sent Events stream from a Lambda endpoint.
 * The Lambda must respond with Content-Type: text/event-stream.
 *
 * @param path    Lambda route
 * @param body    JSON body for the POST
 * @param onChunk Called with each text delta as it arrives
 * @param onDone  Called when the stream closes
 * @param onError Called on stream error
 */
export async function awsStream(
  path: string,
  body: unknown,
  onChunk: (delta: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<void> {
  const token = tokenStore.getAccess();

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Accept':        'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      onError(`Stream failed: HTTP ${response.status}`);
      return;
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        // SSE format: "data: <json>"
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(payload);
          // Lambda should return { delta: "..." } or { text: "..." }
          const delta: string = parsed.delta ?? parsed.text ?? '';
          if (delta) onChunk(delta);
        } catch { /* skip malformed line */ }
      }
    }

    onDone();
  } catch (err: any) {
    onError(err?.message ?? 'Stream connection failed');
  }
}
