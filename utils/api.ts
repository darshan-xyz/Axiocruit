
export const API_URL = '/api';

export interface ApiRequestOptions {
  timeoutMs?: number;
}

export const apiRequest = async (
  endpoint: string,
  method: string = 'GET',
  body?: any,
  options: ApiRequestOptions = {}
) => {
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
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // If unauthorized, clear stale credentials
    if (res.status === 401) {
      console.warn(`[API] 401 Unauthorized encountered on ${normalizedEndpoint}. Session expired.`);
      // If we had a token that is now rejected, wipe it so user is redirected cleanly
      if (token && !window.location.hash.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        window.dispatchEvent(new Event('auth:logout'));
      }
    }

    // Check if response is JSON
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
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
