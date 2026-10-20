/**
 * Enterprise Metrics & Telemetry Routes
 * Author: Axiocruit Enterprise Integration Platform
 */

const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Prometheus text format export
router.get('/', metricsController.getPrometheusMetrics);

// JSON summary for platform admins
router.get('/summary', protect, authorize('ADMIN'), metricsController.getMetricsSummary);

module.exports = router;
