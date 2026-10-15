const fetch = require('node-fetch');

/**
 * Enterprise Circuit Breaker
 * Tracks failure states, prevents cascade failures to offline microservices,
 * trips to OPEN upon exceeding error thresholds, and probes recovery during HALF_OPEN.
 */
class CircuitBreaker {
  constructor(name = 'default', options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeoutMs = options.resetTimeoutMs || options.cooldownMs || 10000;
    this.state = 'CLOSED'; // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = 0;
    this.halfOpenTrialInProgress = false;
  }

  getState() {
    if (this.state === 'OPEN' && Date.now() >= this.nextAttempt) {
      this.state = 'HALF_OPEN';
    }
    return this.state;
  }

  isOpen() {
    return this.getState() === 'OPEN';
  }

  trip() {
    this.state = 'OPEN';
    this.halfOpenTrialInProgress = false;
    this.lastFailureTime = Date.now();
    this.nextAttempt = this.lastFailureTime + this.resetTimeoutMs;
    console.warn(`[CircuitBreaker:${this.name}] Circuit TRIPPED to OPEN. Cooldown: ${this.resetTimeoutMs}ms`);
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = 0;
    this.halfOpenTrialInProgress = false;
    console.log(`[CircuitBreaker:${this.name}] Circuit RESET to CLOSED.`);
  }

  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      console.log(`[CircuitBreaker:${this.name}] Half-open trial succeeded. Closing circuit.`);
      this.reset();
    } else {
      this.failureCount = 0;
    }
  }

  shouldRecordFailure(error) {
    // Client errors (4xx) indicate client input issues, not downstream service outages.
    // They must not increment the failure count or trip the circuit breaker.
    const status = error?.status || error?.statusCode || error?.response?.status;
    if (status && status >= 400 && status < 500) {
      return false;
    }
    if (typeof error?.message === 'string' && /^HTTP\s+4\d\d\b/i.test(error.message)) {
      return false;
    }
    return true;
  }

  recordFailure(error) {
    if (!this.shouldRecordFailure(error)) {
      console.warn(`[CircuitBreaker:${this.name}] 4xx client error ignored by breaker: ${error?.message || error}`);
      return;
    }

    this.failureCount++;
    this.lastFailureTime = Date.now();
    console.warn(`[CircuitBreaker:${this.name}] Failure recorded (${this.failureCount}/${this.failureThreshold}): ${error?.message || error}`);

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.trip();
    }
  }

  async execute(actionFn, fallbackFn) {
    const currentState = this.getState();

    if (currentState === 'OPEN') {
      const remainingMs = Math.max(0, this.nextAttempt - Date.now());
      const err = new Error(`[CircuitBreaker:${this.name}] Circuit is OPEN. Service unavailable (cooldown remaining: ${remainingMs}ms)`);
      err.code = 'CIRCUIT_BREAKER_OPEN';
      err.service = this.name;
      err.remainingCooldownMs = remainingMs;

      if (typeof fallbackFn === 'function') {
        return await fallbackFn(err);
      }
      throw err;
    }

    if (currentState === 'HALF_OPEN' && this.halfOpenTrialInProgress) {
      // Prevent thundering herd during probe trial
      const err = new Error(`[CircuitBreaker:${this.name}] Circuit is HALF_OPEN (trial in progress). Fast-failing concurrent request.`);
      err.code = 'CIRCUIT_BREAKER_HALF_OPEN_PROBE';
      err.service = this.name;
      if (typeof fallbackFn === 'function') {
        return await fallbackFn(err);
      }
      throw err;
    }

    if (currentState === 'HALF_OPEN') {
      this.halfOpenTrialInProgress = true;
    }

    try {
      const result = await actionFn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure(err);
      if (typeof fallbackFn === 'function') {
        return await fallbackFn(err);
      }
      throw err;
    } finally {
      if (currentState === 'HALF_OPEN') {
        this.halfOpenTrialInProgress = false;
      }
    }
  }
}

/**
 * Enterprise Resilient HTTP Client
 * Combines timeout control, exponential backoff retries, and Circuit Breaker
 * for inter-service communication (AI Microservice, Proctoring Service, External APIs).
 */
class HttpClient {
  static CircuitBreaker = CircuitBreaker;
  static breakers = new Map();

  static getBreaker(name = 'default', options = {}) {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    const breaker = this.breakers.get(name);
    if (options.failureThreshold) breaker.failureThreshold = options.failureThreshold;
    if (options.resetTimeoutMs || options.cooldownMs) {
      breaker.resetTimeoutMs = options.resetTimeoutMs || options.cooldownMs;
    }
    return breaker;
  }

  static resetAllBreakers() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Execute an arbitrary asynchronous operation within a named circuit breaker
   * @param {string} serviceName - Logical service identifier
   * @param {Function} actionFn - Async operation to execute
   * @param {Function} [fallbackFn] - Fallback handler invoked when open or on failure
   * @param {object} [options] - Circuit breaker options
   */
  static async executeWithBreaker(serviceName, actionFn, fallbackFn, options = {}) {
    const breaker = this.getBreaker(serviceName, options);
    return breaker.execute(actionFn, fallbackFn);
  }

  /**
   * Perform an HTTP request with timeout, optional exponential retry, and circuit breaker
   * @param {string} url - Target URL
   * @param {object} options - Fetch options (method, headers, body, timeoutMs, maxRetries, breaker)
   */
  static async request(url, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body,
      timeoutMs = 30000,
      maxRetries = 2,
      retryDelayMs = 1000,
      breaker: breakerOption = null,
      serviceName = null,
      fallback = null,
    } = options;

    const breakerKey = breakerOption === true
      ? (serviceName || (new URL(url)).hostname)
      : (typeof breakerOption === 'string' ? breakerOption : serviceName);

    const breaker = breakerKey ? this.getBreaker(breakerKey, options) : null;

    const executeFetch = async () => {
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

          // Treat 5xx responses on GET (or when specified) as retryable
          if (response.status >= 500 && (method === 'GET' || options.retry5xx) && attempt < maxRetries) {
            attempt++;
            const delay = retryDelayMs * Math.pow(2, attempt - 1);
            console.warn(`[HttpClient] ${method} ${url} returned ${response.status}. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }

          if (response.status >= 500 && options.throwOn5xx !== false) {
            const err5xx = new Error(`HTTP ${response.status} from ${url}`);
            err5xx.status = response.status;
            err5xx.response = response;
            throw err5xx;
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
    };

    if (breaker) {
      return breaker.execute(
        executeFetch,
        typeof fallback === 'function' ? fallback : (fallback !== null ? () => fallback : undefined)
      );
    }

    return executeFetch();
  }

  /**
   * Helper: GET JSON
   */
  static async getJson(url, options = {}) {
    const { breaker: breakerOption, fallback, serviceName, ...cleanOptions } = options;
    const breakerKey = breakerOption === true
      ? (serviceName || (new URL(url)).hostname)
      : (typeof breakerOption === 'string' ? breakerOption : (serviceName && breakerOption ? serviceName : null));

    if (breakerKey) {
      return this.executeWithBreaker(
        breakerKey,
        () => this.getJson(url, cleanOptions),
        fallback,
        options
      );
    }

    const response = await this.request(url, { ...options, method: 'GET' });
    if (!response || typeof response.json !== 'function') {
      return response;
    }
    if (!response.ok) {
      const text = await response.text();
      const err = new Error(`HTTP ${response.status} from ${url}: ${text}`);
      err.status = response.status;
      err.statusCode = response.status;
      err.response = response;
      throw err;
    }
    return response.json();
  }

  /**
   * Helper: POST JSON
   */
  static async postJson(url, payload, options = {}) {
    const { breaker: breakerOption, fallback, serviceName, ...cleanOptions } = options;
    const breakerKey = breakerOption === true
      ? (serviceName || (new URL(url)).hostname)
      : (typeof breakerOption === 'string' ? breakerOption : (serviceName && breakerOption ? serviceName : null));

    if (breakerKey) {
      return this.executeWithBreaker(
        breakerKey,
        () => this.postJson(url, payload, cleanOptions),
        fallback,
        options
      );
    }

    const response = await this.request(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response || typeof response.json !== 'function') {
      return response;
    }

    if (!response.ok) {
      const text = await response.text();
      const err = new Error(`HTTP ${response.status} from ${url}: ${text}`);
      err.status = response.status;
      err.statusCode = response.status;
      err.response = response;
      throw err;
    }
    return response.json();
  }

  /**
   * Helper: POST Form / Multipart
   */
  static async postForm(url, form, options = {}) {
    const { breaker: breakerOption, fallback, serviceName, ...cleanOptions } = options;
    const breakerKey = breakerOption === true
      ? (serviceName || (new URL(url)).hostname)
      : (typeof breakerOption === 'string' ? breakerOption : (serviceName && breakerOption ? serviceName : null));

    if (breakerKey) {
      return this.executeWithBreaker(
        breakerKey,
        () => this.postForm(url, form, cleanOptions),
        fallback,
        options
      );
    }

    const headers = {
      ...(typeof form.getHeaders === 'function' ? form.getHeaders() : {}),
      ...(options.headers || {}),
    };
    const response = await this.request(url, {
      ...options,
      method: 'POST',
      headers,
      body: form,
    });

    if (!response || typeof response.json !== 'function') {
      return response;
    }

    if (!response.ok) {
      const text = await response.text();
      const err = new Error(`HTTP ${response.status} from ${url}: ${text}`);
      err.status = response.status;
      err.statusCode = response.status;
      err.response = response;
      throw err;
    }
    return response.json();
  }
}

module.exports = HttpClient;
