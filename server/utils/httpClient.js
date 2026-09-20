const fetch = require('node-fetch');

/**
 * Enterprise Resilient HTTP Client
 * Provides timeout control, exponential backoff retries, and structured error diagnostics
 * for inter-service communication (AI Microservice, Proctoring Service, External APIs).
 */
class HttpClient {
  /**
   * Perform an HTTP request with timeout and optional retry
   * @param {string} url - Target URL
   * @param {object} options - Fetch options (method, headers, body, timeoutMs, maxRetries)
   */
  static async request(url, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body,
      timeoutMs = 30000,
      maxRetries = 2,
      retryDelayMs = 1000,
    } = options;

    let attempt = 0;
    let lastError = null;

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const fetchOptions = {
          method,
          headers,
          body,
          signal: controller.signal,
        };

        const response = await fetch(url, fetchOptions);
        clearTimeout(timer);

        // Treat 5xx responses on GET as retryable
        if (response.status >= 500 && method === 'GET' && attempt < maxRetries) {
          attempt++;
          const delay = retryDelayMs * Math.pow(2, attempt - 1);
          console.warn(`[HttpClient] GET ${url} returned ${response.status}. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        return response;
      } catch (err) {
        clearTimeout(timer);
        lastError = err;

        const isTimeout = err.name === 'AbortError';
        const isNetworkError = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT';

        if ((isTimeout || isNetworkError) && attempt < maxRetries) {
          attempt++;
          const delay = retryDelayMs * Math.pow(2, attempt - 1);
          console.warn(`[HttpClient] ${method} ${url} failed (${err.message}). Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        break;
      }
    }

    const errorType = lastError?.name === 'AbortError' ? 'TIMEOUT' : 'SERVICE_UNREACHABLE';
    const enhancedError = new Error(`[HttpClient][${errorType}] Failed ${method} ${url}: ${lastError?.message || 'Unknown error'}`);
    enhancedError.code = errorType;
    enhancedError.originalError = lastError;
    throw enhancedError;
  }

  /**
   * Helper: GET JSON
   */
  static async getJson(url, options = {}) {
    const response = await this.request(url, { ...options, method: 'GET' });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status} from ${url}: ${text}`);
    }
    return response.json();
  }

  /**
   * Helper: POST JSON
   */
  static async postJson(url, payload, options = {}) {
    const response = await this.request(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status} from ${url}: ${text}`);
    }
    return response.json();
  }
}

module.exports = HttpClient;
