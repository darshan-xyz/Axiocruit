/**
 * Enterprise Distributed Background Job Model
 * Durable, transactional job queue with distributed locking and dead-letter queue (DLQ)
 * Author: Axiocruit Enterprise Integration Platform
 */

const mongoose = require('mongoose');

const backgroundJobSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed', 'dead_letter'],
    default: 'queued',
    index: true,
  },
  priority: {
    type: Number,
    default: 0,
    index: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 3,
  },
  lockedUntil: {
    type: Date,
    default: null,
    index: true,
  },
  lockedBy: {
    type: String,
    default: null,
  },
  failedReason: {
    type: String,
    default: null,
  },
  errorStack: {
    type: String,
    default: null,
  },
  scheduledAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Primary compound index for polling workers:
// Fetches queued jobs ready to execute, ordered by priority (high to low) and scheduledAt
backgroundJobSchema.index({ status: 1, scheduledAt: 1, priority: -1 });

module.exports = mongoose.model('BackgroundJob', backgroundJobSchema);
