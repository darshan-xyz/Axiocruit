/**
 * Enterprise Distributed Job Queue Controller
 * Administrative controls for inspecting, retrying, and managing background tasks
 * Author: Axiocruit Enterprise Integration Platform
 */

const BackgroundJob = require('../models/BackgroundJob');
const jobQueueService = require('../services/jobQueueService');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * @desc    Get aggregate queue statistics
 * @route   GET /api/admin/jobs/stats (or /api/admin/queue/stats)
 * @access  Private (Admin only)
 */
exports.getQueueStats = async (req, res) => {
  try {
    const stats = await jobQueueService.getQueueStats();
    res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('[QueueController] getQueueStats error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve queue statistics', error: err.message });
  }
};

/**
 * @desc    List background jobs with filtering and pagination
 * @route   GET /api/admin/jobs (or /api/admin/queue)
 * @access  Private (Admin only)
 */
exports.listJobs = async (req, res) => {
  try {
    const { status, type } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (type) {
      filter.type = type;
    }

    const [jobs, total] = await Promise.all([
      BackgroundJob.find(filter)
        .sort({ priority: -1, scheduledAt: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BackgroundJob.countDocuments(filter),
    ]);

    res.json({
      success: true,
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('[QueueController] listJobs error:', err);
    res.status(500).json({ success: false, message: 'Failed to list background jobs', error: err.message });
  }
};

/**
 * @desc    Get details of a single background job
 * @route   GET /api/admin/jobs/:id (or /api/admin/queue/:id)
 * @access  Private (Admin only)
 */
exports.getJobById = async (req, res) => {
  try {
    const job = await BackgroundJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Background job not found' });
    }

    res.json({
      success: true,
      job,
    });
  } catch (err) {
    console.error('[QueueController] getJobById error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch job', error: err.message });
  }
};

/**
 * @desc    Retry a failed or dead-letter background job
 * @route   POST /api/admin/jobs/:id/retry (or /api/admin/queue/:id/retry)
 * @access  Private (Admin only)
 */
exports.retryJob = async (req, res) => {
  try {
    const job = await jobQueueService.retryJob(req.params.id);

    await logAuditEvent({
      req,
      actor: { id: req.user._id || req.user.id, email: req.user.email, role: req.user.role },
      action: 'BACKGROUND_JOB_RETRY',
      resource: { type: 'BACKGROUND_JOB', id: job._id },
      details: { jobType: job.type },
    });

    res.json({
      success: true,
      message: 'Job successfully re-queued for execution',
      job,
    });
  } catch (err) {
    console.error('[QueueController] retryJob error:', err);
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Delete a background job
 * @route   DELETE /api/admin/jobs/:id (or /api/admin/queue/:id)
 * @access  Private (Admin only)
 */
exports.deleteJob = async (req, res) => {
  try {
    const job = await BackgroundJob.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Background job not found' });
    }

    await logAuditEvent({
      req,
      actor: { id: req.user._id || req.user.id, email: req.user.email, role: req.user.role },
      action: 'BACKGROUND_JOB_DELETE',
      resource: { type: 'BACKGROUND_JOB', id: req.params.id },
      details: { jobType: job.type },
    });

    res.json({
      success: true,
      message: 'Background job removed successfully',
    });
  } catch (err) {
    console.error('[QueueController] deleteJob error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete job', error: err.message });
  }
};

/**
 * @desc    Enqueue a new background job
 * @route   POST /api/admin/jobs/enqueue (or /api/admin/queue/enqueue)
 * @access  Private (Admin only)
 */
exports.enqueueJob = async (req, res) => {
  try {
    const { type, payload, priority, maxAttempts, delayMs } = req.body;
    if (!type || typeof type !== 'string') {
      return res.status(400).json({ success: false, message: 'Job type string is required' });
    }

    const job = await jobQueueService.enqueueJob(type, payload, { priority, maxAttempts, delayMs });

    await logAuditEvent({
      req,
      actor: { id: req.user._id || req.user.id, email: req.user.email, role: req.user.role },
      action: 'BACKGROUND_JOB_ENQUEUE',
      resource: { type: 'BACKGROUND_JOB', id: job._id },
      details: { jobType: job.type, priority },
    });

    res.status(201).json({
      success: true,
      message: 'Job enqueued successfully',
      job,
    });
  } catch (err) {
    console.error('[QueueController] enqueueJob error:', err);
    res.status(500).json({ success: false, message: 'Failed to enqueue job', error: err.message });
  }
};
