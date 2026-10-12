const mongoose = require('mongoose');

/**
 * Session Schema for Dual-Token Architecture & Refresh Token Rotation
 * Supports family tracking for token reuse detection and automatic revocation.
 */
const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  refreshTokenHash: {
    type: String,
    required: true,
    index: true,
  },
  familyId: {
    type: String,
    required: true,
    index: true,
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  userAgent: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index to automatically purge expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);
