export const API_URL = '/api';

export interface ApiRequestOptions {
  timeoutMs?: number;
  _isRetry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempts silent token refresh via HTTP-only cookie or fallback bearer/localStorage token.
 * Deduplicates in-flight calls to prevent concurrent storm on refresh endpoint.
 */
export const silentRefreshToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const fallbackRefreshToken = localStorage.getItem('refreshToken');
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: fallbackRefreshToken ? JSON.stringify({ refreshToken: fallbackRefreshToken }) : undefined,
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      const newToken = data.token || data.accessToken;
      if (newToken) {
        localStorage.setItem('token', newToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.user.role) {
            localStorage.setItem('role', data.user.role);
          }
        }
        return newToken;
      }
      return null;
    } catch (err) {
      console.warn('[API] Silent token refresh failed:', err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const apiRequest = async (
  endpoint: string,
  method: string = 'GET',
  body?: any,
  options: ApiRequestOptions = {}
): Promise<any> => {
  const token = localStorage.getItem('token');
  const headers: any = {};

  // Only set Content-Type to JSON if body is NOT FormData
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Normalize endpoint to ensure leading slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${API_URL}${normalizedEndpoint}`;

  // Request timeout controller
  const timeoutMs = options.timeoutMs || 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(targetUrl, {
      method,
      headers,
      credentials: 'include',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Silent refresh on 401 Unauthorized
    if (res.status === 401) {
      const isAuthEndpoint = normalizedEndpoint.includes('/auth/login') ||
                             normalizedEndpoint.includes('/auth/refresh') ||
                             normalizedEndpoint.includes('/auth/register');

      if (!options._isRetry && !isAuthEndpoint) {
        console.info(`[API] 401 on ${normalizedEndpoint}. Initiating silent token refresh...`);
        const newToken = await silentRefreshToken();
        if (newToken) {
          console.info(`[API] Silent refresh succeeded. Retrying request to ${normalizedEndpoint}`);
          return apiRequest(endpoint, method, body, { ...options, _isRetry: true });
        }
      }

      console.warn(`[API] Session expired or refresh rejected on ${normalizedEndpoint}.`);
      if (token && !window.location.hash.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        window.dispatchEvent(new Event('auth:logout'));
      }
    }

    // Check if response is JSON
    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.indexOf("application/json") !== -1;

    if (isJson) {
      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data.message || 'API Request Failed') as any;
        error.status = res.status;
        error.data = data;
        Object.assign(error, data);
        throw error;
      }
      return data;
    } else {
      // If successful empty or non-JSON response (e.g. 204 No Content)
      if (res.ok) {
        const text = await res.text();
        return text ? { message: text } : {};
      }
      // If not JSON, it's likely an HTML error page (404, 500, etc.)
      const text = await res.text();
      console.error('Non-JSON Response:', text);
      throw new Error(`Server Error: ${res.status} ${res.statusText}. Please check the console for details.`);
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const timeoutError = new Error(`Request to ${normalizedEndpoint} timed out after ${timeoutMs / 1000}s`);
      console.error('API Timeout:', timeoutError);
      throw timeoutError;
    }
    console.error('API Error:', error);
    throw error;
  }
};
