/**
 * Express Application Bootstrap & Middleware Assembly
 * Author: Axiocruit Core Engineering
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Middlewares
const { requireDatabase } = require('../middleware/dbCheckMiddleware');
const {
  correlationMiddleware,
  securityHeadersMiddleware,
  authRateLimiter,
  apiRateLimiter,
} = require('../middleware/securityMiddleware');
const { errorHandler } = require('../middleware/errorMiddleware');

// Routes
const healthRoutes = require('../routes/healthRoutes');
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const interviewRoutes = require('../routes/interviewRoutes');
const jobRoutes = require('../routes/jobRoutes');
const adminRoutes = require('../routes/adminRoutes');
const stripeRoutes = require('../routes/stripeRoutes');
const applicationRoutes = require('../routes/applicationRoutes');
const organizationRoutes = require('../routes/organizationRoutes');
const codingTestRoutes = require('../routes/codingTestRoutes');
const freelancerRoutes = require('../routes/freelancerRoutes');
const recruiterServiceRoutes = require('../routes/recruiterServiceRoutes');
const messageRoutes = require('../routes/messageRoutes');
const complianceRoutes = require('../routes/complianceRoutes');
const webhookRoutes = require('../routes/webhookRoutes');
const metricsRoutes = require('../routes/metricsRoutes');
const ssoRoutes = require('../routes/ssoRoutes');
const storageRoutes = require('../routes/storageRoutes');
const scorecardRoutes = require('../routes/scorecardRoutes');
const queueRoutes = require('../routes/queueRoutes');
const { metricsMiddleware } = require('../middleware/metricsMiddleware');

const createApp = () => {
  const app = express();

  // Enterprise Security & Request Tracing Middleware
  app.use(correlationMiddleware);
  app.use(metricsMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(
    cors({
      origin: [
        process.env.CLIENT_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
      ].filter(Boolean),
      credentials: true,
    })
  );

  // Elevated limits (10mb) for routes that genuinely need larger payloads (e.g. code/transcript submissions)
  const elevatedJson = express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  });
  app.use('/api/coding-test', elevatedJson);
  app.use('/api/interviews', elevatedJson);

  // Safe Enterprise Default JSON and URL-Encoded Body Parsers (1mb)
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  // Lightweight Cookie Parsing Middleware
  app.use((req, res, next) => {
    if (!req.cookies) {
      req.cookies = {};
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        cookieHeader.split(';').forEach((cookie) => {
          const idx = cookie.indexOf('=');
          if (idx > 0) {
            const key = cookie.substring(0, idx).trim();
            const val = cookie.substring(idx + 1).trim();
            try {
              req.cookies[key] = decodeURIComponent(val);
            } catch (_) {
              req.cookies[key] = val;
            }
          }
        });
      }
    }
    next();
  });

  // Serve static uploads
  app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

  // Request Logger with Correlation ID
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] [${req.id || 'N/A'}] ${req.method} ${req.originalUrl || req.url}`);
    next();
  });

  // Health & Readiness Probes
  app.use('/api', healthRoutes);
  app.use('/', healthRoutes);

  // Gateway Rate Limiting across /api routes (preserves specific authRateLimiter on /api/auth)
  app.use('/api', apiRateLimiter);

  // Application Routes (guarded by requireDatabase to prevent unhandled buffering timeouts)
  app.use('/api/auth/sso', requireDatabase, ssoRoutes);
  app.use('/api/auth', authRateLimiter, requireDatabase, authRoutes);
  app.use('/api/users', requireDatabase, userRoutes);
  app.use('/api/interviews', requireDatabase, interviewRoutes);
  app.use('/api/jobs', requireDatabase, jobRoutes);
  app.use('/api/admin', requireDatabase, adminRoutes);
  app.use('/api/payments', requireDatabase, stripeRoutes);
  app.use('/api/applications', requireDatabase, applicationRoutes);
  app.use('/api/organization', requireDatabase, organizationRoutes);
  app.use('/api/messages', requireDatabase, messageRoutes);
  app.use('/api/coding-test', requireDatabase, codingTestRoutes);
  app.use('/api/freelancers', requireDatabase, freelancerRoutes);
  app.use('/api/recruiter', requireDatabase, recruiterServiceRoutes);
  app.use('/api/compliance', requireDatabase, complianceRoutes);
  app.use('/api/webhooks', requireDatabase, webhookRoutes);
  app.use('/api/storage', requireDatabase, storageRoutes);
  app.use('/api/scorecards', requireDatabase, scorecardRoutes);
  app.use('/api/admin/jobs/queue', requireDatabase, queueRoutes);
  app.use('/metrics', metricsRoutes);
  app.use('/api/metrics', metricsRoutes);

  app.get('/', (req, res) => {
    res.send('Axiocruit Platform API is running...');
  });

  // Error Handler (must be last)
  app.use(errorHandler);

  return app;
};

module.exports = {
  createApp,
};
