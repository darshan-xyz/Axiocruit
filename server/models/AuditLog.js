const mongoose = require('mongoose');

/**
 * AuditLog Schema for Tamper-Evident Security and Operational Auditing
 * Tracks actor identity, action type, impacted resources, client metadata and timestamps.
 */
const auditLogSchema = new mongoose.Schema({
  actor: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    email: {
      type: String,
      default: 'anonymous',
    },
    role: {
      type: String,
      default: 'ANONYMOUS',
    },
  },
  action: {
    type: String,
    required: true,
    index: true,
  },
  resource: {
    type: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      default: null,
    },
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ip: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Index for high-performance administrative queries
auditLogSchema.index({ timestamp: -1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
