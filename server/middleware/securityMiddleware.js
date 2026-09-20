const { v4: uuidv4 } = require('uuid');

/**
 * Enterprise Request Correlation ID Middleware
 * Assigns a unique X-Request-Id to every inbound request and passes it to the response.
 */
const correlationMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

/**
 * Enterprise Security Headers Middleware
 * Applies standard security headers to protect against common web vulnerabilities.
 */
const securityHeadersMiddleware = (req, res, next) => {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Clickjacking protection (allow same origin)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Legacy XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

/**
 * Lightweight In-Memory Rate Limiter for Authentication and Sensitive Endpoints
 * Prevents brute force and denial of service without requiring external Redis in dev.
 */
const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests from this IP, please try again later.' } = {}) => {
  const hits = new Map();

  // Periodic cleanup every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now - record.startTime > windowMs) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref(); // unref so it does not keep process alive

  return (req, res, next) => {
    // Skip in testing or development if explicitly disabled
    if (process.env.DISABLE_RATE_LIMIT === 'true') {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = hits.get(ip);
    if (!record) {
      hits.set(ip, { count: 1, startTime: now });
      return next();
    }

    if (now - record.startTime > windowMs) {
      // Window expired, reset
      hits.set(ip, { count: 1, startTime: now });
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.startTime + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSeconds,
        requestId: req.id,
      });
    }

    next();
  };
};

// Standard rate limiters
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,                   // 50 attempts per 15 minutes
  message: 'Too many authentication attempts. Please wait before trying again.',
});

const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,       // 1 minute
  max: 300,                  // 300 requests per minute
  message: 'API rate limit exceeded. Please slow down your requests.',
});

module.exports = {
  correlationMiddleware,
  securityHeadersMiddleware,
  authRateLimiter,
  apiRateLimiter,
};
