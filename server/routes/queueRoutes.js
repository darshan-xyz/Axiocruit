/**
 * Enterprise Background Job Queue Routes
 * Administrative routes for monitoring, retrying, and managing async jobs
 * Author: Axiocruit Enterprise Integration Platform
 */

const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all queue routes (Admin only)
router.use(protect);
router.use(authorize('ADMIN'));

// Queue statistics
router.get('/stats', queueController.getQueueStats);

// Enqueue job
router.post('/enqueue', queueController.enqueueJob);

// List jobs
router.get('/', queueController.listJobs);

// Job details, retry, and delete
router.get('/:id', queueController.getJobById);
router.post('/:id/retry', queueController.retryJob);
router.delete('/:id', queueController.deleteJob);

module.exports = router;
