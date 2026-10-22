/**
 * Enterprise Distributed Job Queue & Dead-Letter Queue (DLQ) Service
 * Transactional atomic leasing, exponential backoff, and worker concurrency
 * Author: Axiocruit Enterprise Integration Platform
 */

const os = require('os');
const BackgroundJob = require('../models/BackgroundJob');

class JobQueueService {
  constructor() {
    this.handlers = new Map();
    this.workerId = `${os.hostname()}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
    this.isWorkerRunning = false;
    this.pollIntervalTimer = null;
    this.pollIntervalMs = 1000;
    this.lockDurationMs = 30000; // 30s lock lease
  }

  /**
   * Register a handler for a specific job type
   */
  registerHandler(type, handlerFn) {
    if (typeof handlerFn !== 'function') {
      throw new Error(`Handler for job type '${type}' must be a function`);
    }
    this.handlers.set(type, handlerFn);
  }

  /**
   * Enqueue a new background job
   */
  async enqueueJob(type, payload = {}, options = {}) {
    const {
      priority = 0,
      maxAttempts = 3,
      delayMs = 0,
    } = options;

    const scheduledAt = new Date(Date.now() + Math.max(0, delayMs));

    const job = await BackgroundJob.create({
      type,
      payload,
      priority,
      maxAttempts,
      scheduledAt,
      status: 'queued',
    });

    return job;
  }

  /**
   * Atomically acquire next job lease
   */
  async acquireNextJob(workerId = this.workerId, lockDurationMs = this.lockDurationMs) {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + lockDurationMs);

    const job = await BackgroundJob.findOneAndUpdate(
      {
        status: { $in: ['queued', 'failed'] },
        scheduledAt: { $lte: now },
        $or: [
          { lockedUntil: null },
          { lockedUntil: { $lte: now } }, // lock expired/stale lease recovery
        ],
      },
      {
        $set: {
          status: 'processing',
          lockedBy: workerId,
          lockedUntil: lockExpiry,
          updatedAt: now,
        },
        $inc: { attempts: 1 },
      },
      {
        sort: { priority: -1, scheduledAt: 1 },
        new: true,
      }
    );

    return job;
  }

  /**
   * Execute a single acquired job
   */
  async executeJob(job, workerId = this.workerId) {
    if (!job) return null;

    const handler = this.handlers.get(job.type);

    if (!handler) {
      // No handler registered: mark dead-letter
      job.status = 'dead_letter';
      job.failedReason = `No registered worker handler for job type '${job.type}'`;
      job.lockedUntil = null;
      job.updatedAt = new Date();
      await job.save();
      return { success: false, job, error: job.failedReason };
    }

    try {
      await handler(job.payload, job);

      job.status = 'completed';
      job.completedAt = new Date();
      job.lockedUntil = null;
      job.failedReason = null;
      job.errorStack = null;
      job.updatedAt = new Date();
      await job.save();

      return { success: true, job };
    } catch (err) {
      console.warn(`[JobQueue] Job ${job._id} (${job.type}) failed (Attempt ${job.attempts}/${job.maxAttempts}):`, err.message);

      const now = new Date();
      job.failedReason = err.message;
      job.errorStack = err.stack;
      job.lockedUntil = null;
      job.updatedAt = now;

      if (job.attempts >= job.maxAttempts) {
        // Permanently exhausted attempts -> Dead-Letter Queue (DLQ)
        job.status = 'dead_letter';
      } else {
        // Retry with exponential backoff: 2s, 4s, 8s...
        const backoffSeconds = Math.pow(2, job.attempts);
        job.status = 'failed';
        job.scheduledAt = new Date(now.getTime() + backoffSeconds * 1000);
      }

      await job.save();
      return { success: false, job, error: err.message };
    }
  }

  /**
   * Re-enqueue a failed or dead-letter job
   */
  async retryJob(jobId) {
    const job = await BackgroundJob.findById(jobId);
    if (!job) {
      throw new Error('Background job not found');
    }

    job.status = 'queued';
    job.attempts = 0;
    job.lockedUntil = null;
    job.lockedBy = null;
    job.failedReason = null;
    job.errorStack = null;
    job.scheduledAt = new Date();
    job.updatedAt = new Date();

    await job.save();
    return job;
  }

  /**
   * Get queue statistics aggregated by status
   */
  async getQueueStats() {
    const stats = await BackgroundJob.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      dead_letter: 0,
      total: 0,
    };

    for (const item of stats) {
      if (result[item._id] !== undefined) {
        result[item._id] = item.count;
      }
      result.total += item.count;
    }

    return result;
  }

  /**
   * Process a single poll cycle (used by worker loop or tests)
   */
  async processNextJob() {
    const job = await this.acquireNextJob();
    if (job) {
      return await this.executeJob(job);
    }
    return null;
  }

  /**
   * Start worker polling loop
   */
  startWorker(pollIntervalMs = this.pollIntervalMs) {
    if (this.isWorkerRunning) return;
    this.isWorkerRunning = true;
    this.pollIntervalMs = pollIntervalMs;

    const loop = async () => {
      if (!this.isWorkerRunning) return;
      try {
        await this.processNextJob();
      } catch (err) {
        console.warn('[JobQueue] Worker cycle warning:', err.message);
      } finally {
        if (this.isWorkerRunning) {
          this.pollIntervalTimer = setTimeout(loop, this.pollIntervalMs);
          this.pollIntervalTimer.unref();
        }
      }
    };

    loop();
  }

  /**
   * Stop worker polling loop
   */
  stopWorker() {
    this.isWorkerRunning = false;
    if (this.pollIntervalTimer) {
      clearTimeout(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }
  }
}

const jobQueueService = new JobQueueService();

module.exports = jobQueueService;
