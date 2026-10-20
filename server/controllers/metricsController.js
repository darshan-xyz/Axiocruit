/**
 * Enterprise Metrics & Health Controller
 * Author: Axiocruit Enterprise Integration Platform
 */

const mongoose = require('mongoose');
const metricsCollector = require('../utils/metricsCollector');
const { isAdminRole } = require('../schemas/roleTaxonomy');

/**
 * GET /metrics
 * Renders Prometheus 0.0.4 plaintext exposition format
 */
const getPrometheusMetrics = (req, res) => {
  const token = process.env.METRICS_BEARER_TOKEN;
  if (token) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${token}`) {
      return res.status(401).send('# Unauthorized: Invalid metrics bearer token\n');
    }
  } else if (process.env.METRICS_REQUIRE_ADMIN === 'true') {
    if (!req.user || !isAdminRole(req.user.role)) {
      return res.status(403).send('# Forbidden: Admin access required\n');
    }
  }

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.send(metricsCollector.renderPrometheusText());
};

/**
 * GET /api/metrics/summary
 * Returns JSON summary for Admin dashboards
 */
const getMetricsSummary = (req, res) => {
  return res.status(200).json({
    success: true,
    metrics: metricsCollector.getSummary(),
  });
};

/**
 * GET /api/health/live
 * Kubernetes liveness probe - fast verification that process event loop is active
 */
const getLivenessProbe = (req, res) => {
  return res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    pid: process.pid,
  });
};

/**
 * GET /api/health/ready
 * Kubernetes readiness probe - validates critical downstream dependencies
 */
const getReadinessProbe = (req, res) => {
  const mongoReadyState = mongoose.connection ? mongoose.connection.readyState : 0;
  const isMongoReady = mongoReadyState === 1;

  const mem = process.memoryUsage();
  const heapUsageRatio = mem.heapUsed / mem.heapTotal;
  const isMemoryHealthy = heapUsageRatio < 0.95; // Under 95% of allocated heap
  const isLagHealthy = metricsCollector.eventLoopLagMs < 3000; // Event loop lag < 3s

  const isReady = isMongoReady && isMemoryHealthy && isLagHealthy;
  const statusCode = isReady ? 200 : 503;

  return res.status(statusCode).json({
    status: isReady ? 'ready' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    checks: {
      mongodb: {
        status: isMongoReady ? 'connected' : 'disconnected',
        readyState: mongoReadyState,
        healthy: isMongoReady,
      },
      memory: {
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        heapUsageRatio: Math.round(heapUsageRatio * 100) / 100,
        healthy: isMemoryHealthy,
      },
      eventLoop: {
        lagMs: metricsCollector.eventLoopLagMs,
        healthy: isLagHealthy,
      },
    },
  });
};

module.exports = {
  getPrometheusMetrics,
  getMetricsSummary,
  getLivenessProbe,
  getReadinessProbe,
};
