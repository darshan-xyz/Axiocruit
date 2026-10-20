const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const https = require('https');
const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8002';
const PROCTORING_SERVICE_URL = process.env.PROCTORING_SERVICE_URL || 'http://localhost:8001';

/**
 * Quick HTTP ping helper with timeout
 */
const pingService = (urlStr, timeoutMs = 2000) => {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(urlStr);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      const req = client.get(parsedUrl, { timeout: timeoutMs }, (res) => {
        resolve({
          reachable: res.statusCode >= 200 && res.statusCode < 400,
          statusCode: res.statusCode,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ reachable: false, reason: 'timeout' });
      });

      req.on('error', (err) => {
        resolve({ reachable: false, reason: err.message });
      });
    } catch (e) {
      resolve({ reachable: false, reason: e.message });
    }
  });
};

/**
 * GET /api/health
 * Liveness probe: returns 200 if the Node.js process is healthy and serving traffic.
 */
router.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'axiocruit-backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    system: {
      memoryRssMB: Math.round(memoryUsage.rss / 1024 / 1024),
      memoryHeapMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      nodeVersion: process.version,
    },
  });
});

/**
 * GET /api/ready
 * Readiness probe: checks dependencies (MongoDB, AI Microservice, Proctoring Service).
 */
router.get('/ready', async (req, res) => {
  const mongoStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const mongoState = mongoose.connection ? mongoose.connection.readyState : 0;
  const mongoStatus = mongoStateMap[mongoState] || 'unknown';
  const isMongoReady = mongoState === 1;

  // Ping auxiliary microservices concurrently
  const [aiPing, proctorPing] = await Promise.all([
    pingService(`${AI_SERVICE_URL}/health`),
    pingService(`${PROCTORING_SERVICE_URL}/health`),
  ]);

  const allCriticalReady = isMongoReady;
  const statusCode = allCriticalReady ? 200 : 503;

  res.status(statusCode).json({
    status: allCriticalReady ? 'ready' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    dependencies: {
      database: {
        type: 'mongodb',
        status: mongoStatus,
        ready: isMongoReady,
      },
      aiService: {
        url: AI_SERVICE_URL,
        status: aiPing.reachable ? 'reachable' : 'offline',
        statusCode: aiPing.statusCode,
      },
      proctoringService: {
        url: PROCTORING_SERVICE_URL,
        status: proctorPing.reachable ? 'reachable' : 'offline',
        statusCode: proctorPing.statusCode,
      },
    },
  });
});

const metricsController = require('../controllers/metricsController');

/**
 * Standard Kubernetes Liveness & Readiness Probes
 */
router.get('/health/live', metricsController.getLivenessProbe);
router.get('/health/ready', metricsController.getReadinessProbe);

module.exports = router;
