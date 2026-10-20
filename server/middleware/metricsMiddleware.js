/**
 * Enterprise HTTP Request Telemetry Middleware
 * Captures request latency and status distributions without high-cardinality path pollution
 * Author: Axiocruit Enterprise Integration Platform
 */

const metricsCollector = require('../utils/metricsCollector');

/**
 * Normalize route paths to prevent metric cardinality explosion
 */
const normalizePath = (originalUrl = '/') => {
  let path = originalUrl.split('?')[0];

  // Strip trailing slashes
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  // Replace MongoDB ObjectIds (24 hex chars)
  path = path.replace(/\b[0-9a-fA-F]{24}\b/g, ':id');

  // Replace UUIDs
  path = path.replace(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, ':id');

  // Replace email addresses in path
  path = path.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ':email');

  // Replace meeting IDs
  path = path.replace(/\/room\/[^\/]+/g, '/room/:roomId');

  return path;
};

const metricsMiddleware = (req, res, next) => {
  // Skip metrics collection for the /metrics endpoint itself to prevent skew
  if (req.path === '/metrics') {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const method = req.method;
    const route = normalizePath(req.baseUrl ? `${req.baseUrl}${req.path}` : req.path);
    const status = String(res.statusCode);

    metricsCollector.incCounter('axiocruit_http_requests_total', { method, route, status });
    metricsCollector.observeHistogram('axiocruit_http_request_duration_ms', { method, route }, durationMs);
  });

  next();
};

module.exports = {
  metricsMiddleware,
  normalizePath,
};
