/**
 * Express Application Bootstrap & Middleware Assembly
 * Author: Procruit Core Engineering
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

const createApp = () => {
  const app = express();

  // Enterprise Security & Request Tracing Middleware
  app.use(correlationMiddleware);
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

  app.use(
    express.json({
      limit: '50mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

  // Application Routes (guarded by requireDatabase to prevent unhandled buffering timeouts)
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

  app.get('/', (req, res) => {
    res.send('Procruit Platform API is running...');
  });

  // Error Handler (must be last)
  app.use(errorHandler);

  return app;
};

module.exports = {
  createApp,
};
